use rusqlite::{Connection, Result};
use std::path::PathBuf;
use tauri::api::path::app_dir;

pub fn initialize_database(app_handle: &tauri::AppHandle) -> Result<Connection> {
    let app_dir = app_dir(app_handle.config()).expect("Failed to get app dir");
    let db_path: PathBuf = app_dir.join("local.db");
    
    let conn = Connection::open(db_path)?;
    
    // Create tables
    conn.execute(
        "CREATE TABLE IF NOT EXISTS clients (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            address TEXT,
            phone TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            sync_status TEXT DEFAULT 'new'
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS sales (
            id TEXT PRIMARY KEY,
            client_id TEXT,
            date TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            sync_status TEXT DEFAULT 'new',
            FOREIGN KEY (client_id) REFERENCES clients (id)
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS sale_items (
            id TEXT PRIMARY KEY,
            sale_id TEXT,
            product_type TEXT NOT NULL,
            quantity REAL NOT NULL,
            price REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            sync_status TEXT DEFAULT 'new',
            FOREIGN KEY (sale_id) REFERENCES sales (id)
        )",
        [],
    )?;

    Ok(conn)
}