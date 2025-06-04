// src/commands.rs
use crate::database::DatabaseConnection;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct InitialSyncData {
    pub clients: Vec<serde_json::Value>,
    pub sales: Vec<serde_json::Value>,
    pub payments: Vec<serde_json::Value>,
    pub credit_transactions: Vec<serde_json::Value>,
}

#[tauri::command]
pub async fn check_local_data(db: State<'_, DatabaseConnection>) -> Result<bool, String> {
    db.check_needs_initial_sync()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn fetch_pending_sync_items(
    db: State<'_, DatabaseConnection>
) -> Result<Vec<serde_json::Value>, String> {
    db.fetch_pending_sync_items()
        .map(|items| {
            items
                .into_iter()
                .map(|item| serde_json::to_value(item).unwrap())
                .collect()
        })
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn mark_sync_complete(id: String, db: State<'_, DatabaseConnection>) -> Result<(), String> {
    db.mark_synced(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn mark_sync_failed(
    id: String,
    error: String,
    db: State<'_, DatabaseConnection>
) -> Result<(), String> {
    db.mark_sync_failed(&id, &error).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_local_records(
    table: String,
    db: State<'_, DatabaseConnection>
) -> Result<Vec<(String, String, String)>, String> {
    db.get_records(&table).map_err(|e| e.to_string())
}
