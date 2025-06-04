// src/lib.rs
mod error;
mod database;
mod sync;
mod commands;

use tauri::Manager;
use database::initialize_database;
use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let db = initialize_database(app.handle())?;
            app.manage(db);
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            check_local_data,
            sync::initial_sync,
            fetch_pending_sync_items,
            mark_sync_complete,
            mark_sync_failed,
            get_local_records
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
