// lib.rs

pub mod database;
pub mod sync;

use tauri::Manager;
use database::initialize_database;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let db = initialize_database(app.handle()).expect("Failed to initialize database");
            app.manage(db);
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![]) // Add commands here if needed
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
