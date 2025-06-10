use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::{query, query_as, query_scalar, Column, Row, SqlitePool};
use tauri::{AppHandle, Manager, Runtime, State};
use log::{debug, error, info};

use crate::Error;

#[derive(Debug, Serialize, Deserialize)]
pub struct InitialSyncData {
    pub last_sync: Option<String>,
    pub has_local_data: bool,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct SyncQueueItem {
    pub id: String,
    pub operation: String,
    pub table_name: String,
    pub data: String,
    pub timestamp: i64,
    pub status: String,
    pub error: Option<String>,
    pub created_at: String,
    pub updated_at: Option<String>,
}

#[tauri::command]
pub async fn check_local_data<R: Runtime>(app: AppHandle<R>) -> Result<bool, Error> {
    debug!("Checking for local data...");
    let db = app.state::<SqlitePool>();

    let count: i64 = query_scalar("SELECT COUNT(*) FROM clients")
        .fetch_one(&*db)
        .await
        .map_err(|e| {
            error!("Failed to check local data: {}", e);
            Error::Sql(e)
        })?;

    let has_data = count > 0;
    debug!("Local data check result: {}", has_data);
    Ok(has_data)
}

#[tauri::command]
pub async fn fetch_pending_sync_items(
    db: State<'_, SqlitePool>,
) -> Result<Vec<SyncQueueItem>, Error> {
    info!("Fetching pending sync items...");
    let items = query_as!(
        SyncQueueItem,
        "SELECT id, operation, table_name, data, timestamp, status, error, created_at, updated_at FROM sync_queue WHERE status = 'pending' ORDER BY timestamp ASC"
    )
    .fetch_all(&*db)
    .await
    .map_err(|e| {
        error!("Failed to fetch pending sync items: {}", e);
        Error::Sql(e)
    })?;

    debug!("Found {} pending sync items", items.len());
    Ok(items)
}

#[tauri::command]
pub async fn mark_sync_complete(id: String, db: State<'_, SqlitePool>) -> Result<(), Error> {
    info!("Marking sync item {} as complete", id);
    query("UPDATE sync_queue SET status = 'completed', updated_at = datetime('now') WHERE id = ?")
        .bind(&id)
        .execute(&*db)
        .await
        .map_err(|e| {
            error!("Failed to mark sync complete for item {}: {}", id, e);
            Error::Sql(e)
        })?;

    debug!("Successfully marked sync item {} as complete", id);
    Ok(())
}

#[tauri::command]
pub async fn mark_sync_failed(
    id: String,
    error_msg: String,
    db: State<'_, SqlitePool>,
) -> Result<(), Error> {
    info!("Marking sync item {} as failed: {}", id, error_msg);
    query(
        "UPDATE sync_queue SET status = 'error', error = ?, updated_at = datetime('now') WHERE id = ?",
    )
    .bind(&error_msg)
    .bind(&id)
    .execute(&*db)
    .await
    .map_err(|e| {
        error!("Failed to mark sync failed for item {}: {}", id, e);
        Error::Sql(e)
    })?;

    debug!("Successfully marked sync item {} as failed", id);
    Ok(())
}

#[tauri::command]
pub async fn get_local_records(
    db: State<'_, SqlitePool>,
    table_name: String,
) -> Result<Vec<Value>, Error> {
    info!("Fetching local records from table: {}", table_name);
    let rows = query(&format!("SELECT * FROM {}", table_name))
        .fetch_all(&*db)
        .await
        .map_err(|e| {
            error!("Failed to fetch records from {}: {}", table_name, e);
            Error::Sql(e)
        })?;

    // FIX: Added explicit type annotation `Vec<Value>` to help the compiler.
    let records: Vec<Value> = rows
        .into_iter()
        .map(|row| {
            let mut map = serde_json::Map::new();
            for col in row.columns() {
                let key = col.name().to_string();
                let value: Value = row.try_get(col.ordinal()).unwrap_or(Value::Null);
                map.insert(key, value);
            }
            Value::Object(map)
        })
        .collect();

    debug!("Found {} records in table {}", records.len(), table_name);
    Ok(records)
}

#[tauri::command]
pub async fn initial_download_and_insert(
    db: State<'_, SqlitePool>,
    table_name: String,
    records: Vec<Value>,
) -> Result<(), Error> {
    info!(
        "Inserting {} records into table: {}",
        records.len(),
        table_name
    );
    let mut tx = db.begin().await.map_err(Error::Sql)?;

    for record in records {
        let obj = record.as_object().ok_or_else(|| {
            Error::Custom("Invalid record format: record must be a JSON object".to_string())
        })?;

        let columns: Vec<String> = obj.keys().cloned().collect();
        let placeholders: String = std::iter::repeat("?")
            .take(columns.len())
            .collect::<Vec<_>>()
            .join(", ");

        let sql = format!(
            "INSERT INTO {} ({}) VALUES ({})",
            table_name,
            columns.join(", "),
            placeholders
        );

        let mut q = query(&sql);
        for col in &columns {
            let value = obj.get(col).cloned().unwrap_or(Value::Null);
            q = q.bind(value);
        }

        q.execute(&mut *tx).await.map_err(|e| {
            error!("Failed to insert record into {}: {}", table_name, e);
            Error::Sql(e)
        })?;
    }

    tx.commit().await.map_err(Error::Sql)?;

    debug!(
        "Successfully inserted records into {}",
        table_name
    );
    Ok(())
}
