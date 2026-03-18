pub mod auth;
pub mod backup;
pub mod credentials;
pub mod crypto;
pub mod import;
pub mod server;

use base64::Engine;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::Manager;
use zeroize::Zeroize;

use crypto::{master, vault};

/// Global application state shared across all Tauri commands.
pub struct AppState {
    pub db: Arc<Mutex<Option<rusqlite::Connection>>>,
    pub master_key: Mutex<Option<Vec<u8>>>,
    pub salt: Mutex<Option<Vec<u8>>>,
    pub db_path: Mutex<PathBuf>,
}

// --- Auth Tauri commands ---

/// Sets up the master password for first-time use.
/// Generates salt, derives key, opens DB, initializes schema, stores salt+hash in settings.
#[tauri::command]
fn setup_master_password(state: tauri::State<'_, AppState>, password: String) -> Result<(), String> {
    let salt = master::generate_salt();
    let key = master::derive_key(&password, &salt);

    let db_path = state.db_path.lock().map_err(|e| e.to_string())?.clone();

    // Open and initialize the encrypted database
    let conn = vault::open(&db_path, &key)?;
    vault::init_schema(&conn)?;

    // Store salt and master hash in settings
    let salt_b64 = base64::engine::general_purpose::STANDARD.encode(&salt);
    let hash_b64 = base64::engine::general_purpose::STANDARD.encode(&key);

    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('salt', ?1)",
        [&salt_b64],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('master_hash', ?1)",
        [&hash_b64],
    )
    .map_err(|e| e.to_string())?;

    // Save salt to sidecar file for unlock_with_password
    let salt_path = db_path.with_extension("salt");
    std::fs::write(&salt_path, &salt_b64)
        .map_err(|e| format!("Failed to save salt file: {}", e))?;

    // Update app state
    *state.db.lock().map_err(|e| e.to_string())? = Some(conn);
    *state.master_key.lock().map_err(|e| e.to_string())? = Some(key);
    *state.salt.lock().map_err(|e| e.to_string())? = Some(salt);

    Ok(())
}

/// Unlocks the app using the master password.
/// Reads salt from the DB, derives key, verifies, and opens the DB connection.
#[tauri::command]
fn unlock_with_password(state: tauri::State<'_, AppState>, password: String) -> Result<(), String> {
    let db_path = state.db_path.lock().map_err(|e| e.to_string())?.clone();

    if !vault::is_initialized(&db_path) {
        return Err("Database not initialized. Please set up a master password first.".to_string());
    }

    // We need to try opening the DB with a derived key.
    // First, we need the salt. Since the DB is encrypted, we store salt
    // in a sidecar file or try different approach.
    // Strategy: Try to open with the derived key. If it works, the password is correct.

    // Read salt from the sidecar or attempt to open with a temporary key.
    // For SQLCipher, we need the correct key to read anything.
    // So we store salt in a non-encrypted sidecar file.
    let salt_path = db_path.with_extension("salt");
    let salt_b64 = std::fs::read_to_string(&salt_path)
        .map_err(|_| {
            // Fallback: try to read salt from a known location
            "Could not read salt file. Database may be corrupted.".to_string()
        })?;

    let salt = base64::engine::general_purpose::STANDARD
        .decode(salt_b64.trim())
        .map_err(|e| format!("Failed to decode salt: {}", e))?;

    let key = master::derive_key(&password, &salt);

    // Try to open the database with this key
    let conn = vault::open(&db_path, &key)
        .map_err(|_| "Invalid master password".to_string())?;

    // Update app state
    *state.db.lock().map_err(|e| e.to_string())? = Some(conn);
    *state.master_key.lock().map_err(|e| e.to_string())? = Some(key);
    *state.salt.lock().map_err(|e| e.to_string())? = Some(salt);

    Ok(())
}

/// Unlocks the app using a PIN code.
/// The PIN hash is stored in settings; the master key is re-derived from the stored data.
#[tauri::command]
fn unlock_with_pin(state: tauri::State<'_, AppState>, pin: String) -> Result<(), String> {
    let db_path = state.db_path.lock().map_err(|e| e.to_string())?.clone();

    if !vault::is_initialized(&db_path) {
        return Err("Database not initialized".to_string());
    }

    // Read salt and PIN hash from sidecar files
    let salt_path = db_path.with_extension("salt");
    let salt_b64 = std::fs::read_to_string(&salt_path)
        .map_err(|_| "Could not read salt file".to_string())?;
    let salt = base64::engine::general_purpose::STANDARD
        .decode(salt_b64.trim())
        .map_err(|e| format!("Failed to decode salt: {}", e))?;

    let pin_hash_path = db_path.with_extension("pin");
    let pin_hash = std::fs::read_to_string(&pin_hash_path)
        .map_err(|_| "PIN not set up. Please use master password.".to_string())?;

    // Verify PIN
    if !auth::pin::verify_pin(&pin, pin_hash.trim())? {
        return Err("Invalid PIN".to_string());
    }

    // PIN is correct - read the encrypted master key
    let key_path = db_path.with_extension("key");
    let key_b64 = std::fs::read_to_string(&key_path)
        .map_err(|_| "Could not read key file".to_string())?;
    let key = base64::engine::general_purpose::STANDARD
        .decode(key_b64.trim())
        .map_err(|e| format!("Failed to decode key: {}", e))?;

    // Open the database
    let conn = vault::open(&db_path, &key)
        .map_err(|_| "Failed to open database".to_string())?;

    *state.db.lock().map_err(|e| e.to_string())? = Some(conn);
    *state.master_key.lock().map_err(|e| e.to_string())? = Some(key);
    *state.salt.lock().map_err(|e| e.to_string())? = Some(salt);

    Ok(())
}

/// Locks the app by clearing the master key and closing the DB connection.
#[tauri::command]
fn lock_app(state: tauri::State<'_, AppState>) -> Result<(), String> {
    // Zeroize the master key
    if let Ok(mut key_lock) = state.master_key.lock() {
        if let Some(ref mut key) = *key_lock {
            key.zeroize();
        }
        *key_lock = None;
    }

    // Close the database connection
    if let Ok(mut db_lock) = state.db.lock() {
        *db_lock = None;
    }

    Ok(())
}

/// Checks if the database has been set up (i.e., the DB file exists).
#[tauri::command]
fn check_is_setup(state: tauri::State<'_, AppState>) -> Result<bool, String> {
    let db_path = state.db_path.lock().map_err(|e| e.to_string())?;
    Ok(vault::is_initialized(&db_path))
}

/// Checks if a PIN has been set up.
#[tauri::command]
fn check_has_pin(state: tauri::State<'_, AppState>) -> Result<bool, String> {
    let db_path = state.db_path.lock().map_err(|e| e.to_string())?.clone();
    let pin_path = db_path.with_extension("pin");
    Ok(pin_path.exists())
}

/// Sets up a PIN for quick unlock.
/// Stores the PIN hash and the master key (for PIN-based unlock).
#[tauri::command]
fn set_pin(state: tauri::State<'_, AppState>, pin: String) -> Result<(), String> {
    let db_path = state.db_path.lock().map_err(|e| e.to_string())?.clone();
    let master_key_lock = state.master_key.lock().map_err(|e| e.to_string())?;
    let master_key = master_key_lock
        .as_ref()
        .ok_or_else(|| "App is locked. Please unlock first.".to_string())?;

    // Hash the PIN
    let pin_hash = auth::pin::hash_pin(&pin)?;

    // Store PIN hash in a sidecar file
    let pin_path = db_path.with_extension("pin");
    std::fs::write(&pin_path, &pin_hash)
        .map_err(|e| format!("Failed to save PIN: {}", e))?;

    // Store the master key (base64 encoded) for PIN-based unlock
    let key_b64 = base64::engine::general_purpose::STANDARD.encode(master_key);
    let key_path = db_path.with_extension("key");
    std::fs::write(&key_path, &key_b64)
        .map_err(|e| format!("Failed to save key: {}", e))?;

    // Also update settings table
    let db_lock = state.db.lock().map_err(|e| e.to_string())?;
    if let Some(conn) = db_lock.as_ref() {
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('pin_enabled', 'true')",
            [],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Retrieves a setting value by key.
#[tauri::command]
fn get_settings(state: tauri::State<'_, AppState>, key: String) -> Result<Option<String>, String> {
    let db_lock = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db_lock
        .as_ref()
        .ok_or_else(|| "Database not opened".to_string())?;

    let result = conn.query_row(
        "SELECT value FROM settings WHERE key = ?1",
        [&key],
        |row| row.get::<_, String>(0),
    );

    match result {
        Ok(value) => Ok(Some(value)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

/// Updates or inserts a setting value.
#[tauri::command]
fn update_setting(
    state: tauri::State<'_, AppState>,
    key: String,
    value: String,
) -> Result<(), String> {
    let db_lock = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db_lock
        .as_ref()
        .ok_or_else(|| "Database not opened".to_string())?;

    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
        rusqlite::params![key, value],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// Exports the bundled browser extension to a user-chosen folder.
#[tauri::command]
fn export_extension(app_handle: tauri::AppHandle, target_dir: String) -> Result<String, String> {
    let target_path = std::path::Path::new(&target_dir).join("MyPwd-Extension");

    // In dev mode, copy from the project's extension/ directory
    // In production, copy from the bundled resources
    let extension_source = app_handle
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?
        .join("extension");

    // Fallback: try the project directory (dev mode)
    let source = if extension_source.exists() {
        extension_source
    } else {
        // Dev mode: extension is at project root/extension
        let dev_path = std::env::current_dir()
            .map_err(|e| e.to_string())?;
        // Try multiple possible locations
        let candidates = [
            dev_path.join("extension"),
            dev_path.join("../extension"),
            dev_path.join("../../extension"),
        ];
        candidates
            .into_iter()
            .find(|p| p.exists())
            .ok_or_else(|| "Extension files not found".to_string())?
    };

    // Create target directory
    std::fs::create_dir_all(&target_path)
        .map_err(|e| format!("Failed to create directory: {}", e))?;

    // Copy all extension files recursively
    copy_dir_recursive(&source, &target_path)
        .map_err(|e| format!("Failed to copy extension: {}", e))?;

    Ok(target_path.to_string_lossy().to_string())
}

fn copy_dir_recursive(src: &std::path::Path, dst: &std::path::Path) -> std::io::Result<()> {
    std::fs::create_dir_all(dst)?;
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let file_type = entry.file_type()?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());
        if file_type.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            std::fs::copy(&src_path, &dst_path)?;
        }
    }
    Ok(())
}

/// Opens a folder in the system file explorer.
#[tauri::command]
fn open_folder(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Runs the Tauri application.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir().map_err(|e| {
                Box::new(std::io::Error::new(
                    std::io::ErrorKind::Other,
                    e.to_string(),
                ))
            })?;

            // Ensure the app data directory exists
            std::fs::create_dir_all(&app_data_dir).map_err(|e| {
                Box::new(std::io::Error::new(
                    std::io::ErrorKind::Other,
                    format!("Failed to create app data dir: {}", e),
                ))
            })?;

            let db_path = app_data_dir.join("mypwd.db");

            let db_arc = Arc::new(Mutex::new(None));
            let db_for_server = db_arc.clone();

            app.manage(AppState {
                db: db_arc,
                master_key: Mutex::new(None),
                salt: Mutex::new(None),
                db_path: Mutex::new(db_path),
            });

            tauri::async_runtime::spawn(async move {
                server::start_server(db_for_server).await;
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Auth commands
            setup_master_password,
            unlock_with_password,
            unlock_with_pin,
            lock_app,
            check_is_setup,
            check_has_pin,
            set_pin,
            get_settings,
            update_setting,
            // Credential commands
            credentials::list_credentials,
            credentials::get_credential,
            credentials::create_credential,
            credentials::update_credential,
            credentials::delete_credential,
            credentials::list_categories,
            credentials::toggle_favorite,
            // Password generator
            credentials::generator::generate_password_cmd,
            // Import commands
            import::import_csv,
            import::detect_browsers,
            import::import_from_browser,
            import::check_duplicates,
            import::save_imported,
            // Backup commands
            backup::create_backup_cmd,
            backup::restore_backup_cmd,
            backup::list_backups,
            // Extension commands
            export_extension,
            open_folder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
