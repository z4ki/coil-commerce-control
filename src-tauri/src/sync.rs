// src/sync.rs
use tauri::State;
use crate::database::DatabaseConnection;
use rusqlite::OptionalExtension;

#[tauri::command]
pub async fn initial_sync(db: State<'_, DatabaseConnection>) -> Result<(), String> {
    let mut conn = db.0.lock().unwrap();

    // Check if an initial sync entry exists in sync_log
    let needs_sync: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM sync_log WHERE sync_type = 'download'",
            [],
            |row| row.get::<_, i64>(0),
        )
        .map_err(|e| e.to_string())?
        == 0;

    if !needs_sync {
        return Ok(());
    }

    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // (Placeholder for actual data-loading logic)
    tx.execute("INSERT INTO synced_data (data) VALUES (?)", [&"initial data"])
        .map_err(|e| e.to_string())?;

    tx.execute(
        "INSERT OR REPLACE INTO sync_log (id, entity_type, entity_id, sync_type, sync_status) 
         VALUES ('initial_sync', 'all', '0', 'download', 'success')",
        [],
    )
    .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;

    Ok(())
}
