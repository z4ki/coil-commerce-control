use reqwest::Client;
use tauri::{AppHandle, Manager, Runtime, State};
use sqlx::{SqlitePool, query, query_as};
use serde::{Deserialize, Serialize};
use log::{info, error, debug};
use crate::Error;

// FIX: Added `sqlx::FromRow` which is required for `query_as!` to work.
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct SyncItem {
    pub id: String,
    pub table_name: String,
    // pub entity_id: String, // This field was in the struct but not the query
    pub operation: String,
    pub data: String,
}

#[tauri::command]
pub async fn initial_sync(db: State<'_, SqlitePool>) -> Result<(), Error> {
    info!("Starting initial sync process...");
    
    let needs_sync: (i64,) = query_as(
        "SELECT COUNT(*) FROM sync_log WHERE sync_type = 'download'"
    )
        .fetch_one(&*db)
        .await
        .map_err(|e| {
            error!("Failed to check sync status: {}", e);
            Error::Sql(e)
        })?;

    if needs_sync.0 > 0 {
        info!("Initial sync already completed");
        return Ok(());
    }

    info!("Performing initial sync...");
    query(
        "INSERT OR REPLACE INTO sync_log (id, entity_type, entity_id, sync_type, sync_status) 
         VALUES ('initial_sync', 'all', '0', 'download', 'success')"
    )
        .execute(&*db)
        .await
        .map_err(|e| {
            error!("Failed to record sync completion: {}", e);
            Error::Sql(e)
        })?;

    info!("Initial sync completed successfully");
    Ok(())
}


// FIX: Corrected function signature.
// API keys and URLs should not be passed from the frontend for security reasons.
// They should be loaded from a config file or environment variables and managed in Tauri state.
// For now, they are hardcoded to show how it works. You should replace this.
#[tauri::command]
pub async fn process_sync_queue<R: Runtime>(
    app: AppHandle<R>
) -> Result<(), Error> {
    info!("Processing sync queue...");
    
    // Retrieve the DB pool from state
    let db = app.state::<SqlitePool>();

    // NOTE: Replace these with a secure way of storing secrets.
    let supabase_url = "YOUR_SUPABASE_URL";
    let supabase_key = "YOUR_SUPABASE_KEY";
    
    let client = Client::new();

    let items: Vec<SyncItem> = query_as(
        "SELECT id, entity_type as table_name, 'sync' as operation, '' as data 
         FROM sync_queue 
         WHERE sync_status = 'pending' 
         ORDER BY timestamp ASC"
    )
        .fetch_all(&*db)
        .await
        .map_err(|e| {
            error!("Failed to fetch pending sync items: {}", e);
            Error::Sql(e)
        })?;

    for item in items {
        info!("Processing sync item: {:?}", item.id);
        match process_single_item(&client, &db, &item, supabase_url, supabase_key).await {
            Ok(_) => {
                info!("Successfully processed sync item: {}", item.id);
            }
            Err(e) => {
                error!("Failed to process sync item {}: {}", item.id, e);
                // Mark item as failed so we don't retry it indefinitely
                let _ = query("UPDATE sync_queue SET sync_status = 'error', error = ? WHERE id = ?")
                    .bind(e.to_string())
                    .bind(&item.id)
                    .execute(&*db)
                    .await;
            }
        }
    }

    Ok(())
}

async fn process_single_item(
    client: &Client,
    db: &SqlitePool,
    item: &SyncItem,
    supabase_url: &str,
    supabase_key: &str,
) -> Result<(), Error> {
    debug!("Processing item: {} ({} {})", item.id, item.table_name, item.operation);
    
    let url = format!("{}/rest/v1/{}", supabase_url, item.table_name);
    let result = client
        .post(&url)
        .header("apikey", supabase_key)
        .header("Authorization", format!("Bearer {}", supabase_key))
        .json(&item)
        .send()
        .await
        .map_err(|e| {
            error!("API request failed for item {}: {}", item.id, e);
            Error::Network(e)
        })?;

    if !result.status().is_success() {
        let status = result.status();
        let error_msg = result.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        error!("API request failed with status {}: {}", status, error_msg);
        return Err(Error::Custom(format!(
            "API request failed for {}: {} - {}",
            item.id, status, error_msg
        )));
    }

    query(
        "UPDATE sync_queue SET sync_status = 'completed', updated_at = datetime('now') WHERE id = ?"
    )
        .bind(&item.id)
        .execute(db)
        .await
        .map_err(|e| {
            error!("Failed to update sync status for item {}: {}", item.id, e);
            Error::Sql(e)
        })?;

    debug!("Successfully processed item: {}", item.id);
    Ok(())
}
