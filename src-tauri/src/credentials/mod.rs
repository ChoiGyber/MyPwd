pub mod generator;

use serde::{Deserialize, Serialize};
use tauri::State;

use crate::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Credential {
    pub id: i64,
    pub category_id: Option<i64>,
    pub title: String,
    pub url: Option<String>,
    pub username: String,
    pub password: String,
    pub notes: Option<String>,
    pub favorite: bool,
    pub source: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CredentialInput {
    pub category_id: Option<i64>,
    pub title: String,
    pub url: Option<String>,
    pub username: String,
    pub password: String,
    pub notes: Option<String>,
    pub source: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub id: i64,
    pub name: String,
    pub icon: Option<String>,
    pub sort_order: i64,
}

#[tauri::command]
pub fn list_credentials(
    state: State<'_, AppState>,
    search: Option<String>,
    category_id: Option<i64>,
) -> Result<Vec<Credential>, String> {
    let db_lock = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db_lock
        .as_ref()
        .ok_or_else(|| "Database not opened".to_string())?;

    let mut sql = String::from(
        "SELECT id, category_id, title, url, username, password, notes, favorite, source, created_at, updated_at FROM credentials WHERE 1=1",
    );
    let mut params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(ref s) = search {
        if !s.is_empty() {
            sql.push_str(" AND (title LIKE ?1 OR url LIKE ?1 OR username LIKE ?1 OR notes LIKE ?1)");
            params.push(Box::new(format!("%{}%", s)));
        }
    }

    if let Some(cat_id) = category_id {
        let param_idx = params.len() + 1;
        sql.push_str(&format!(" AND category_id = ?{}", param_idx));
        params.push(Box::new(cat_id));
    }

    sql.push_str(" ORDER BY favorite DESC, updated_at DESC");

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    let rows = stmt
        .query_map(param_refs.as_slice(), |row| {
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
        .map_err(|e| e.to_string())?;

    let mut credentials = Vec::new();
    for row in rows {
        credentials.push(row.map_err(|e| e.to_string())?);
    }

    Ok(credentials)
}

#[tauri::command]
pub fn get_credential(state: State<'_, AppState>, id: i64) -> Result<Credential, String> {
    let db_lock = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db_lock
        .as_ref()
        .ok_or_else(|| "Database not opened".to_string())?;

    conn.query_row(
        "SELECT id, category_id, title, url, username, password, notes, favorite, source, created_at, updated_at FROM credentials WHERE id = ?1",
        [id],
        |row| {
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
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_credential(
    state: State<'_, AppState>,
    input: CredentialInput,
) -> Result<Credential, String> {
    let db_lock = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db_lock
        .as_ref()
        .ok_or_else(|| "Database not opened".to_string())?;

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

    let id = conn.last_insert_rowid();
    drop(db_lock);

    get_credential(state, id)
}

#[tauri::command]
pub fn update_credential(
    state: State<'_, AppState>,
    id: i64,
    input: CredentialInput,
) -> Result<Credential, String> {
    let db_lock = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db_lock
        .as_ref()
        .ok_or_else(|| "Database not opened".to_string())?;

    let affected = conn
        .execute(
            "UPDATE credentials SET category_id = ?1, title = ?2, url = ?3, username = ?4, password = ?5, notes = ?6, source = ?7, updated_at = datetime('now') WHERE id = ?8",
            rusqlite::params![
                input.category_id,
                input.title,
                input.url,
                input.username,
                input.password,
                input.notes,
                input.source,
                id,
            ],
        )
        .map_err(|e| e.to_string())?;

    if affected == 0 {
        return Err("Credential not found".to_string());
    }

    drop(db_lock);
    get_credential(state, id)
}

#[tauri::command]
pub fn delete_credential(state: State<'_, AppState>, id: i64) -> Result<bool, String> {
    let db_lock = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db_lock
        .as_ref()
        .ok_or_else(|| "Database not opened".to_string())?;

    let affected = conn
        .execute("DELETE FROM credentials WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;

    Ok(affected > 0)
}

#[tauri::command]
pub fn list_categories(state: State<'_, AppState>) -> Result<Vec<Category>, String> {
    let db_lock = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db_lock
        .as_ref()
        .ok_or_else(|| "Database not opened".to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, name, icon, sort_order FROM categories ORDER BY sort_order, id")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(Category {
                id: row.get(0)?,
                name: row.get(1)?,
                icon: row.get(2)?,
                sort_order: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut categories = Vec::new();
    for row in rows {
        categories.push(row.map_err(|e| e.to_string())?);
    }

    Ok(categories)
}

#[tauri::command]
pub fn toggle_favorite(state: State<'_, AppState>, id: i64) -> Result<bool, String> {
    let db_lock = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db_lock
        .as_ref()
        .ok_or_else(|| "Database not opened".to_string())?;

    // Toggle the favorite value
    let affected = conn
        .execute(
            "UPDATE credentials SET favorite = CASE WHEN favorite = 0 THEN 1 ELSE 0 END, updated_at = datetime('now') WHERE id = ?1",
            [id],
        )
        .map_err(|e| e.to_string())?;

    if affected == 0 {
        return Err("Credential not found".to_string());
    }

    // Return the new favorite state
    let new_favorite: bool = conn
        .query_row(
            "SELECT favorite FROM credentials WHERE id = ?1",
            [id],
            |row| row.get::<_, i64>(0).map(|v| v != 0),
        )
        .map_err(|e| e.to_string())?;

    Ok(new_favorite)
}
