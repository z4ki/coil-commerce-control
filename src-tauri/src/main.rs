// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use sqlx::SqlitePool;
use std::fs;
use std::path::PathBuf;

#[tokio::main]
async fn main() {
    // Create database directory
    let app_dir = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("coil-commerce-control");
    fs::create_dir_all(&app_dir).expect("Failed to create app directory");
    
    // Setup database
    let database_url = format!("sqlite:{}/database.db", app_dir.display());
    let pool = SqlitePool::connect(&database_url).await
        .expect("Failed to connect to database");
    
    // Run migrations
    sqlx::migrate!("./migrations").run(&pool).await
        .expect("Failed to run migrations");

    tauri::Builder::default()
        .manage(pool)
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Client commands
            commands::get_clients,
            commands::get_client_by_id,
            commands::create_client,
            commands::update_client,
            commands::delete_client,
            // Sale commands
            commands::get_sales,
            commands::get_sale_by_id,
            commands::create_sale,
            commands::delete_sale,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
