use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri::State;

use crate::crypto::master;
use crate::AppState;

/// Magic bytes identifying a MyPwd backup file.
const MAGIC_BYTES: &[u8; 4] = b"MPWD";

/// Current backup format version.
const FORMAT_VERSION: u8 = 1;

/// Nonce size for AES-256-GCM (96 bits).
const NONCE_SIZE: usize = 12;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupMetadata {
    pub version: u8,
    pub created_at: String,
    pub credential_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupInfo {
    pub file_path: String,
    pub file_size: u64,
    pub created_at: String,
    pub credential_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupHistoryEntry {
    pub id: i64,
    pub file_path: String,
    pub file_size: Option<i64>,
    pub created_at: Option<String>,
}

/// Creates an encrypted backup of the database.
///
/// File format:
/// [4 bytes: MPWD magic] [1 byte: version] [12 bytes: nonce] [rest: AES-256-GCM ciphertext]
fn create_backup_inner(
    db_path: &Path,
    master_key: &[u8],
    password: &str,
    salt: &[u8],
    stored_hash: &[u8],
    output_path: &str,
) -> Result<BackupInfo, String> {
    // Re-verify master password
    if !master::verify_master_password(password, salt, stored_hash) {
        return Err("Invalid master password".to_string());
    }

    // Read the database file
    let db_data =
        fs::read(db_path).map_err(|e| format!("Failed to read database file: {}", e))?;

    // Encrypt with AES-256-GCM using the master key
    let cipher =
        Aes256Gcm::new_from_slice(master_key).map_err(|e| format!("Cipher error: {}", e))?;

    let mut nonce_bytes = [0u8; NONCE_SIZE];
    rand::rngs::OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, db_data.as_ref())
        .map_err(|e| format!("Encryption failed: {}", e))?;

    // Build the backup file: magic + version + nonce + ciphertext
    let mut backup_data = Vec::new();
    backup_data.extend_from_slice(MAGIC_BYTES);
    backup_data.push(FORMAT_VERSION);
    backup_data.extend_from_slice(&nonce_bytes);
    backup_data.extend_from_slice(&ciphertext);

    fs::write(output_path, &backup_data)
        .map_err(|e| format!("Failed to write backup file: {}", e))?;

    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    Ok(BackupInfo {
        file_path: output_path.to_string(),
        file_size: backup_data.len() as u64,
        created_at: now,
        credential_count: 0, // Will be updated by the caller
    })
}

/// Restores a database from an encrypted backup file.
fn restore_backup_inner(
    db_path: &str,
    backup_path: &str,
    password: &str,
    salt: &[u8],
) -> Result<(), String> {
    let backup_data =
        fs::read(backup_path).map_err(|e| format!("Failed to read backup file: {}", e))?;

    // Verify magic bytes
    if backup_data.len() < MAGIC_BYTES.len() + 1 + NONCE_SIZE
        || &backup_data[..4] != MAGIC_BYTES
    {
        return Err("Invalid backup file: missing or incorrect magic bytes".to_string());
    }

    let version = backup_data[4];
    if version != FORMAT_VERSION {
        return Err(format!(
            "Unsupported backup format version: {}",
            version
        ));
    }

    // Derive key from password
    let key = master::derive_key(password, salt);

    // Extract nonce and ciphertext
    let nonce_start = 5;
    let nonce_end = nonce_start + NONCE_SIZE;
    let nonce = Nonce::from_slice(&backup_data[nonce_start..nonce_end]);
    let ciphertext = &backup_data[nonce_end..];

    // Decrypt
    let cipher =
        Aes256Gcm::new_from_slice(&key).map_err(|e| format!("Cipher error: {}", e))?;

    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| "Decryption failed: invalid password or corrupt backup".to_string())?;

    // Write restored database
    fs::write(db_path, &plaintext)
        .map_err(|e| format!("Failed to write restored database: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn create_backup_cmd(
    state: State<'_, AppState>,
    password: String,
    output_path: String,
) -> Result<BackupInfo, String> {
    let db_path = state.db_path.lock().map_err(|e| e.to_string())?.clone();
    let master_key_lock = state.master_key.lock().map_err(|e| e.to_string())?;
    let master_key = master_key_lock
        .as_ref()
        .ok_or_else(|| "Master key not available".to_string())?
        .clone();
    let salt_lock = state.salt.lock().map_err(|e| e.to_string())?;
    let salt = salt_lock
        .as_ref()
        .ok_or_else(|| "Salt not available".to_string())?
        .clone();

    // Get stored hash from settings
    let db_lock = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db_lock
        .as_ref()
        .ok_or_else(|| "Database not opened".to_string())?;

    let stored_hash_b64: String = conn
        .query_row(
            "SELECT value FROM settings WHERE key = 'master_hash'",
            [],
            |row| row.get(0),
        )
        .map_err(|e| format!("Failed to read master hash: {}", e))?;

    let stored_hash =
        base64::Engine::decode(&base64::engine::general_purpose::STANDARD, &stored_hash_b64)
            .map_err(|e| format!("Failed to decode master hash: {}", e))?;

    // Count credentials for metadata
    let credential_count: u64 = conn
        .query_row("SELECT COUNT(*) FROM credentials", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    drop(db_lock);

    let mut info =
        create_backup_inner(&db_path, &master_key, &password, &salt, &stored_hash, &output_path)?;
    info.credential_count = credential_count;

    // Record in backup history
    let db_lock = state.db.lock().map_err(|e| e.to_string())?;
    if let Some(conn) = db_lock.as_ref() {
        let _ = conn.execute(
            "INSERT INTO backup_history (file_path, file_size) VALUES (?1, ?2)",
            rusqlite::params![info.file_path, info.file_size as i64],
        );
    }

    Ok(info)
}

#[tauri::command]
pub fn restore_backup_cmd(
    state: State<'_, AppState>,
    backup_path: String,
    password: String,
) -> Result<(), String> {
    let db_path = state.db_path.lock().map_err(|e| e.to_string())?;
    let salt_lock = state.salt.lock().map_err(|e| e.to_string())?;
    let salt = salt_lock
        .as_ref()
        .ok_or_else(|| "Salt not available. Please set up a master password first.".to_string())?
        .clone();

    // Close the current DB connection before restoring
    {
        let mut db_lock = state.db.lock().map_err(|e| e.to_string())?;
        *db_lock = None;
    }

    let db_path_str = db_path.to_string_lossy().to_string();
    restore_backup_inner(&db_path_str, &backup_path, &password, &salt)
}

#[tauri::command]
pub fn list_backups(state: State<'_, AppState>) -> Result<Vec<BackupHistoryEntry>, String> {
    let db_lock = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db_lock
        .as_ref()
        .ok_or_else(|| "Database not opened".to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, file_path, file_size, created_at FROM backup_history ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(BackupHistoryEntry {
                id: row.get(0)?,
                file_path: row.get(1)?,
                file_size: row.get(2)?,
                created_at: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut entries = Vec::new();
    for row in rows {
        entries.push(row.map_err(|e| e.to_string())?);
    }

    Ok(entries)
}
