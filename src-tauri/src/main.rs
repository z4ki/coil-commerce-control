// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database;
mod sync;

use tauri::{Manager, Runtime, Emitter};
use std::sync::Arc;
use crate::database::{initialize_database, DatabaseConnection};
use serde_json::json;
use chrono::Local;

#[tauri::command]
async fn fetch_pending_sync_items(
    state: tauri::State<'_, Arc<DatabaseConnection>>
) -> Result<Vec<(String, String, String)>, String> {
    let db = &*state;
    db.fetch_pending_sync_items()
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn sync_changes<R: Runtime>(
    state: tauri::State<'_, Arc<DatabaseConnection>>,
    app: tauri::AppHandle<R>,
) -> Result<(), String> {
    let db = &*state;
    let items = db.fetch_pending_sync_items().map_err(|e| e.to_string())?;

    for (table_name, id, operation) in items {
        let data = db.get_entity_data(&table_name, &id).map_err(|e| e.to_string())?;

        match operation.as_str() {
            "create" | "update" | "delete" => {
                db.mark_sync_complete(&id).map_err(|e| e.to_string())?;
            },
            _ => return Err("Invalid operation type".into()),
        }
    }

    // Emit event to all webview windows (Tauri v2 compatible)
    for (_label, window) in app.webview_windows() {
        window.emit(
            "sync-status",
            json!({
                "status": "completed",
                "timestamp": Local::now().to_rfc3339(),
            }),
        ).map_err(|e| e.to_string())?;
    }

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            fetch_pending_sync_items,
            sync_changes,
        ])
        .setup(|app| {
            let app_handle = app.handle();
            let db = initialize_database(&app_handle).expect("Failed to initialize database");
            let db = Arc::new(db);
            app.manage(db);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}