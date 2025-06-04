// main.rs - Fixed version
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database;
mod sync;
mod error;
mod commands;

use tauri::Manager;
use crate::database::{initialize_database, DatabaseConnection};
use crate::sync::*;
use std::sync::Arc;

use commands::*;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let db = initialize_database(app.handle())?;
            app.manage(db);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            check_local_data,
            initial_sync, // ✅ only sync::initial_sync
            fetch_pending_sync_items,
            mark_sync_complete,
            mark_sync_failed,
            get_local_records
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
