// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use sqlx::SqlitePool;
use std::fs;
use std::path::PathBuf;
use std::path::Path;
use std::env;
use dotenv::dotenv;

#[tokio::main]
async fn main() {
    dotenv().ok(); // Loads .env file

    let db_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set in .env");

    // Optionally, extract the directory and create it if needed
    if let Some(path) = db_url.strip_prefix("sqlite://") {
        if let Some(parent) = Path::new(path).parent() {
            if !parent.exists() {
                fs::create_dir_all(parent).expect("Failed to create database directory");
            }
        }
    }

    let pool = SqlitePool::connect(&db_url).await
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
            commands::update_sale,
            commands::mark_sale_invoiced,
            commands::unmark_sale_invoiced,
            // Invoice commands
            commands::get_invoices,
            commands::create_invoice,
            commands::delete_invoice,
            // Product commands
            commands::get_corrugated_sheet_items,
            commands::create_corrugated_sheet_item,
            commands::get_steel_slitting_strip_items,
            commands::create_steel_slitting_strip_item,
            // Payment commands
            commands::create_payment,
            commands::get_payments,
            // Soft-delete and restore commands
            commands::delete_payment,
            commands::restore_invoice,
            commands::restore_sale,
            commands::restore_payment,
            commands::get_deleted_invoices,
            commands::get_deleted_sales,
            commands::get_deleted_payments,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
