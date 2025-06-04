use rusqlite::{Connection, Result, params};
use std::sync::{Arc, Mutex};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use tauri::Manager;
use crate::error::SyncError;

const ENTITY_TABLES: &[&str] = &["clients", "sales", "payments", "credit_transactions"];

const SQL_CREATE_SYNC_QUEUE: &str = r#"CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    table_name TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    synced_at TEXT,
    sync_status TEXT NOT NULL DEFAULT 'pending',
    error TEXT,
    retry_count INTEGER DEFAULT 0,
    version INTEGER DEFAULT 1
)"#;

const SQL_CREATE_SYNC_LOG: &str = r#"CREATE TABLE IF NOT EXISTS sync_log (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    sync_type TEXT NOT NULL,
    sync_status TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_sync_id TEXT
)"#;

fn create_entity_table_sql(table: &str) -> String {
    format!(r#"CREATE TABLE IF NOT EXISTS "{}" (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_deleted INTEGER DEFAULT 0,
        version INTEGER DEFAULT 1,
        last_synced TEXT
    )"#, table)
}

fn upsert_record_sql(table: &str) -> String {
    format!(r#"INSERT INTO "{}" (id, data, created_at, updated_at, version)
        VALUES (?1, ?2, ?3, ?3, 1)
        ON CONFLICT(id) DO UPDATE SET
        data = ?2,
        updated_at = ?3,
        version = version + 1"#, table)
}

fn get_records_sql(table: &str) -> String {
    format!(r#"SELECT id, data, updated_at 
        FROM "{}" 
        WHERE is_deleted = 0
        ORDER BY updated_at DESC"#, table)
}

fn get_changes_sql(table: &str) -> String {
    format!(r#"SELECT id, data 
        FROM "{}" 
        WHERE updated_at > ?1"#, table)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncQueueItem {
    pub id: String,
    pub table_name: String,
    pub entity_id: String,
    pub operation: String,
    pub data: String,
    pub created_at: String,
    pub synced_at: Option<String>,
    pub sync_status: String,
    pub error: Option<String>,
    pub retry_count: i32,
    pub version: i64
}

pub struct DatabaseConnection(pub Arc<Mutex<Connection>>);

impl DatabaseConnection {
    pub fn new(conn: Connection) -> Self {
        Self(Arc::new(Mutex::new(conn)))
    }

    pub fn initialize(&self) -> Result<()> {
        let conn = self.0.lock().unwrap();

        conn.execute(SQL_CREATE_SYNC_QUEUE, [])?;
        conn.execute(SQL_CREATE_SYNC_LOG, [])?;

        for table in ENTITY_TABLES {
            conn.execute(&create_entity_table_sql(table), [])?;
        }

        Ok(())
    }

    pub fn check_needs_initial_sync(&self) -> Result<bool> {
        let conn = self.0.lock().unwrap();
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM sync_log WHERE sync_type = 'download'",
            [],
            |row| row.get(0),
        )?;
        Ok(count == 0)
    }

    pub fn perform_initial_sync(&self) -> Result<()> {
        let conn = self.0.lock().unwrap();

        conn.execute(
            "INSERT OR REPLACE INTO sync_log (id, entity_type, entity_id, sync_type, sync_status)
             VALUES ('initial_sync', 'all', '0', 'download', 'success')",
            [],
        )?;

        Ok(())
    }

    pub fn queue_change(&self, table: &str, id: &str, operation: &str, data: &str) -> Result<()> {
        let conn = self.0.lock().unwrap();
        let sync_id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        conn.execute(
            "INSERT INTO sync_queue (id, table_name, entity_id, operation, data, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![sync_id, table, id, operation, data, now],
        )?;
        Ok(())
    }

    pub fn fetch_pending_sync_items(&self) -> Result<Vec<SyncQueueItem>> {
        let conn = self.0.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT 
                id, table_name, entity_id, operation, data, created_at,
                synced_at, sync_status, error, retry_count, version
             FROM sync_queue 
             WHERE sync_status = 'pending'
             ORDER BY created_at ASC"
        )?;

        let items = stmt.query_map([], |row| {
            Ok(SyncQueueItem {
                id: row.get(0)?,
                table_name: row.get(1)?,
                entity_id: row.get(2)?,
                operation: row.get(3)?,
                data: row.get(4)?,
                created_at: row.get(5)?,
                synced_at: row.get(6)?,
                sync_status: row.get(7)?,
                error: row.get(8)?,
                retry_count: row.get(9)?,
                version: row.get(10)?,
            })
        })?;

        Ok(items.collect::<Result<Vec<_>>>()?)
    }

    pub fn mark_synced(&self, id: &str) -> Result<()> {
        let conn = self.0.lock().unwrap();
        let now = Utc::now().to_rfc3339();

        conn.execute(
            "UPDATE sync_queue 
             SET sync_status = 'completed',
                 synced_at = ?1
             WHERE id = ?2",
            params![now, id],
        )?;
        Ok(())
    }

    pub fn mark_sync_failed(&self, id: &str, error: &str) -> Result<()> {
        let conn = self.0.lock().unwrap();
        conn.execute(
            "UPDATE sync_queue 
             SET sync_status = 'failed',
                 error = ?1,
                 retry_count = retry_count + 1
             WHERE id = ?2",
            params![error, id],
        )?;
        Ok(())
    }

    pub fn upsert_record(&self, table: &str, id: &str, data: &str) -> Result<()> {
        let mut conn = self.0.lock().unwrap();
        let tx = conn.transaction()?;
        let now = Utc::now().to_rfc3339();

        tx.execute(&upsert_record_sql(table), params![id, data, now])?;

        let sync_id = Uuid::new_v4().to_string();
        tx.execute(
            "INSERT INTO sync_queue (id, table_name, entity_id, operation, data, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![sync_id, table, id, "upsert", data, now],
        )?;

        tx.commit()?;
        Ok(())
    }

    pub fn get_records(&self, table: &str) -> Result<Vec<(String, String, String)>> {
        let conn = self.0.lock().unwrap();
        let mut stmt = conn.prepare(&get_records_sql(table))?;

        let rows = stmt.query_map([], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        })?;

        Ok(rows.collect::<Result<Vec<_>>>()?)
    }

    pub fn get_changes_since(&self, table: &str, since: DateTime<Utc>) -> Result<Vec<(String, String)>> {
        let conn = self.0.lock().unwrap();
        let mut stmt = conn.prepare(&get_changes_sql(table))?;

        let rows = stmt.query_map([since.to_rfc3339()], |row| {
            Ok((row.get(0)?, row.get(1)?))
        })?;

        Ok(rows.collect::<Result<Vec<_>>>()?)
    }
}

pub fn initialize_database(app_handle: &tauri::AppHandle) -> Result<DatabaseConnection, SyncError> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| SyncError::Io(format!("Could not get app data directory: {}", e)))?;

    std::fs::create_dir_all(&app_dir)
        .map_err(|e| SyncError::Io(format!("Failed to create directory: {}", e)))?;

    let db_path = app_dir.join("app.db");
    let conn = Connection::open(&db_path)
        .map_err(|e| SyncError::Database(format!("Failed to open database: {}", e)))?;

    conn.execute("PRAGMA foreign_keys = ON", [])
    .map_err(|e| SyncError::Database(format!("Failed to enable foreign keys: {}", e)))?;
let _: String = conn.query_row("PRAGMA journal_mode = WAL", [], |row| row.get(0))
    .map_err(|e| SyncError::Database(format!("Failed to set journal mode: {}", e)))?;


    let db_connection = DatabaseConnection::new(conn);

    db_connection.initialize()
        .map_err(|e| SyncError::Database(format!("Failed to initialize database: {}", e)))?;

    if db_connection.check_needs_initial_sync()
        .map_err(|e| SyncError::Database(format!("Failed to check sync status: {}", e)))? {
        db_connection.perform_initial_sync()
            .map_err(|e| SyncError::Database(format!("Failed to perform initial sync: {}", e)))?;
    }

    Ok(db_connection)
}
