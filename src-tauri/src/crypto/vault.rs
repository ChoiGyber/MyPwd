use rusqlite::Connection;
use std::path::{Path, PathBuf};

pub struct VaultManager {
    pub db_path: PathBuf,
}

impl VaultManager {
    pub fn new(db_path: PathBuf) -> Self {
        Self { db_path }
    }
}

/// Opens a SQLCipher-encrypted database with the given hex key.
pub fn open(db_path: &Path, key: &[u8]) -> Result<Connection, String> {
    let conn = Connection::open(db_path).map_err(|e| format!("Failed to open database: {}", e))?;

    // Convert key bytes to hex string for SQLCipher PRAGMA
    let hex_key = key.iter().map(|b| format!("{:02x}", b)).collect::<String>();
    let pragma = format!("PRAGMA key = \"x'{}'\";", hex_key);

    conn.execute_batch(&pragma)
        .map_err(|e| format!("Failed to set encryption key: {}", e))?;

    // Verify the key works by reading from the database
    conn.execute_batch("SELECT count(*) FROM sqlite_master;")
        .map_err(|e| format!("Invalid encryption key or corrupt database: {}", e))?;

    Ok(conn)
}

/// Initializes the database schema with all required tables and default categories.
pub fn init_schema(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            icon TEXT,
            sort_order INTEGER DEFAULT 0
        );

        INSERT OR IGNORE INTO categories (id, name, icon) VALUES
            (1, '웹사이트', 'globe'),
            (2, '프로그램', 'app'),
            (3, '금융', 'bank'),
            (4, '기타', 'folder');

        CREATE TABLE IF NOT EXISTS credentials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER REFERENCES categories(id),
            title TEXT NOT NULL,
            url TEXT,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            notes TEXT,
            favorite INTEGER DEFAULT 0,
            source TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS backup_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_path TEXT NOT NULL,
            file_size INTEGER,
            created_at TEXT DEFAULT (datetime('now'))
        );
        ",
    )
    .map_err(|e| format!("Failed to initialize schema: {}", e))?;

    Ok(())
}

/// Checks if the database file already exists at the given path.
pub fn is_initialized(db_path: &Path) -> bool {
    db_path.exists()
}
