// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use sqlx::{SqlitePool, sqlite::SqlitePoolOptions}; // Add SqlitePoolOptions
use std::fs;
use std::path::PathBuf;
use std::path::Path;
use std::env;
use dotenv::dotenv;
use shellexpand;
use tauri_plugin_log::{Target, TargetKind};
use dirs;
use tauri::Manager;
use std::time::Instant;


#[tokio::main]
async fn main() {
    println!("[DEBUG] main.rs: main() started");
    dotenv().ok(); // Loads .env file
    
    let start_time = Instant::now();

    // Always use the current user's AppData directory for the database
    let db_path = dirs::data_local_dir()
        .expect("Could not get local app data dir")
        .join("HA-SALES-MANAGER")
        .join("groupeha-dev.db");
    let db_url = format!("sqlite://{}", db_path.display());
    println!("[DEBUG] Using DATABASE_URL: {}", db_url);
    // Ensure the directory exists
    std::fs::create_dir_all(
        db_path.parent().unwrap()
    ).expect("Failed to create app data directory");
    
    // Ensure database file and directory exist
    if let Some(path) = db_url.strip_prefix("sqlite://") {
        let db_path = Path::new(path);
        println!("[DEBUG] Parsed DB file path: {:?}", db_path);
        
        // Create parent directory if it doesn't exist
        if let Some(parent) = db_path.parent() {
            println!("[DEBUG] Parent directory: {:?}", parent);
            println!("[DEBUG] Parent exists before: {}", parent.exists());
            if !parent.exists() {
                match fs::create_dir_all(parent) {
                    Ok(_) => println!("[DEBUG] Created database directory: {:?}", parent),
                    Err(e) => println!("[ERROR] Failed to create database directory: {:?} - {}", parent, e),
                }
            }
            println!("[DEBUG] Parent exists after: {}", parent.exists());
            // List directory contents
            match fs::read_dir(parent) {
                Ok(entries) => {
                    println!("[DEBUG] Directory contents after creation:");
                    for entry in entries {
                        if let Ok(entry) = entry {
                            println!("    - {:?}", entry.path());
                        }
                    }
                },
                Err(e) => println!("[ERROR] Could not read directory: {}", e),
            }
        }
        
        // Create database file if it doesn't exist
        // Using touch-like approach instead of opening connection
        println!("[DEBUG] DB file exists before: {}", db_path.exists());
        if !db_path.exists() {
            match fs::File::create(db_path) {
                Ok(_) => println!("[DEBUG] Created database file: {:?}", db_path),
                Err(e) => println!("[ERROR] Failed to create database file: {:?} - {}", db_path, e),
            }
        }
        println!("[DEBUG] DB file exists after: {}", db_path.exists());
        
        // Check if the file is writable
        match fs::metadata(db_path) {
            Ok(metadata) => {
                println!("[DEBUG] DB file permissions: {:?}", metadata.permissions());
                if metadata.permissions().readonly() {
                    println!("[ERROR] Database file is read-only: {:?}", db_path);
                }
            },
            Err(e) => println!("[ERROR] Failed to get database file metadata: {}", e),
        }
    }
    
    // Connect to database with pool options
    let pool = match SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await
    {
        Ok(pool) => {
            println!("[PERF] Database connected in {:.2?}", start_time.elapsed());
            pool
        }
        Err(e) => {
            eprintln!("Failed to connect to database: {}", e);
            eprintln!("Database URL: {}", db_url);
            panic!("Database connection failed");
        }
    };

    // Enable WAL mode for better performance
    let wal_start = Instant::now();
    sqlx::query("PRAGMA journal_mode = WAL;")
        .execute(&pool)
        .await
        .expect("Failed to set WAL mode");
    println!("[PERF] WAL mode set in {:.2?}", wal_start.elapsed());

    // Run migrations
    let mig_start = Instant::now();
    match sqlx::migrate!("./migrations").run(&pool).await {
        Ok(_) => println!("[PERF] Migrations completed in {:.2?}", mig_start.elapsed()),
        Err(e) => {
            eprintln!("Migration failed: {}", e);
            panic!("Failed to run migrations");
        }
    }

    // Ensure settings row exists
    let settings_start = Instant::now();
    ensure_settings_row(&pool).await
        .expect("Failed to ensure settings row");
    println!("[PERF] Settings row ensured in {:.2?}", settings_start.elapsed());

    println!("[PERF] Total DB startup time: {:.2?}", start_time.elapsed());
    
    tauri::Builder::default()
        .manage(pool)
        .plugin(tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Debug)
            .target(Target::new(TargetKind::Stdout))
            .target(Target::new(TargetKind::Webview))
            .target(Target::new(TargetKind::LogDir { file_name: None }))
            .build())
        .setup(|_app| {
            // No splashscreen logic needed
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
            // Settings commands
            commands::get_settings,
            commands::update_settings,
            commands::export_db,
            commands::import_db,
            // Audit log commands
            commands::get_audit_log,
            // commands::create_audit_log,
            // commands::delete_audit_log,
            // commands::restore_audit_log,
            // commands::get_deleted_audit_logs,
            // Analytics commands
            commands::get_sold_products_analytics,
            commands::get_sold_products_summary,
            commands::get_unique_thickness_width,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn ensure_settings_row(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    let row = sqlx::query("SELECT id FROM settings LIMIT 1")
        .fetch_optional(pool)
        .await?;
    if row.is_none() {
        sqlx::query(
            r#"
            INSERT INTO settings (
                id, company_name, company_address, company_phone, company_email, company_logo,
                tax_rate, currency, nif, nis, rc, ai, rib, language, theme,
                notifications, dark_mode, user_id, created_at, updated_at
            ) VALUES (
                lower(hex(randomblob(16))),
                'Dummy Company',
                '123 Main St',
                '+213000000000',
                'dummy@email.com',
                '',
                0.19,
                'DZD',
                '',
                '',
                '',
                '',
                '',
                'en',
                'light',
                1,
                0,
                '',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            "#
        )
        .execute(pool)
        .await?;
    }
    Ok(())
}