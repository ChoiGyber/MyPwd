pub mod browser_detect;
pub mod chromium_direct;
pub mod csv_import;
pub mod dedup;

use serde::{Deserialize, Serialize};
use tauri::State;

use crate::credentials::{Credential, CredentialInput};
use crate::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportedCredential {
    pub title: String,
    pub url: Option<String>,
    pub username: String,
    pub password: String,
    pub source: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DuplicateInfo {
    pub imported: ImportedCredential,
    pub existing: Option<Credential>,
    pub status: DuplicateStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DuplicateStatus {
    New,
    ExactDuplicate,
    Conflict,
}

#[tauri::command]
pub fn import_csv(content: String) -> Result<(String, Vec<ImportedCredential>), String> {
    csv_import::parse_csv(&content)
}

#[tauri::command]
pub fn detect_browsers() -> Result<Vec<browser_detect::BrowserInfo>, String> {
    Ok(browser_detect::detect_installed_browsers())
}

#[tauri::command]
pub fn import_from_browser(profile_path: String) -> Result<Vec<ImportedCredential>, String> {
    let path = std::path::Path::new(&profile_path);
    chromium_direct::read_chromium_passwords(path)
}

#[tauri::command]
pub fn check_duplicates(
    state: State<'_, AppState>,
    imported: Vec<ImportedCredential>,
) -> Result<Vec<DuplicateInfo>, String> {
    let db_lock = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db_lock
        .as_ref()
        .ok_or_else(|| "Database not opened".to_string())?;

    // Fetch all existing credentials
    let mut stmt = conn
        .prepare("SELECT id, category_id, title, url, username, password, notes, favorite, source, created_at, updated_at FROM credentials")
        .map_err(|e| e.to_string())?;

    let existing: Vec<Credential> = stmt
        .query_map([], |row| {
            Ok(Credential {
                id: row.get(0)?,
                category_id: row.get(1)?,
                title: row.get(2)?,
                url: row.get(3)?,
                username: row.get(4)?,
                password: row.get(5)?,
                notes: row.get(6)?,
                favorite: row.get::<_, i64>(7).map(|v| v != 0)?,
                source: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(dedup::check_duplicates(&imported, &existing))
}

#[tauri::command]
pub fn save_imported(
    state: State<'_, AppState>,
    credentials: Vec<ImportedCredential>,
) -> Result<u64, String> {
    let db_lock = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db_lock
        .as_ref()
        .ok_or_else(|| "Database not opened".to_string())?;

    let mut count = 0u64;
    for cred in &credentials {
        let input = CredentialInput {
            category_id: Some(1), // Default to '웹사이트' category
            title: cred.title.clone(),
            url: cred.url.clone(),
            username: cred.username.clone(),
            password: cred.password.clone(),
            notes: None,
            source: cred.source.clone(),
        };

        conn.execute(
            "INSERT INTO credentials (category_id, title, url, username, password, notes, source) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            rusqlite::params![
                input.category_id,
                input.title,
                input.url,
                input.username,
                input.password,
                input.notes,
                input.source,
            ],
        )
        .map_err(|e| e.to_string())?;
        count += 1;
    }

    Ok(count)
}
