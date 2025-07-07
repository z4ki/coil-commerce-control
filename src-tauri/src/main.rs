// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use sqlx::SqlitePool;
use std::fs;
use std::path::PathBuf;
use std::path::Path;
use std::env;
use dotenv::dotenv;
use shellexpand;



#[tokio::main]
async fn main() {
    println!("[DEBUG] main.rs: main() started");
    dotenv().ok(); // Loads .env file
    
    let db_url_raw = env::var("DATABASE_URL").expect("DATABASE_URL must be set in .env");
    println!("[DEBUG] Raw DATABASE_URL from env: {}", db_url_raw);
    let db_url = shellexpand::env(&db_url_raw).unwrap().to_string();
    println!("[DEBUG] Expanded DATABASE_URL: {}", db_url);
    println!("[DEBUG] HOME: {:?}", std::env::var("HOME"));
    println!("[DEBUG] USERPROFILE: {:?}", std::env::var("USERPROFILE"));
    // std::process::exit(1);
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
    
    // Connect to database with retry logic
    let pool = match SqlitePool::connect(&db_url).await {
        Ok(pool) => {
            println!("Successfully connected to database");
            pool
        }
        Err(e) => {
            eprintln!("Failed to connect to database: {}", e);
            eprintln!("Database URL: {}", db_url);
            panic!("Database connection failed");
        }
    };
    
    // Run migrations
    match sqlx::migrate!("./migrations").run(&pool).await {
        Ok(_) => println!("Migrations completed successfully"),
        Err(e) => {
            eprintln!("Migration failed: {}", e);
            panic!("Failed to run migrations");
        }
    }
    
    // Ensure settings row exists
    ensure_settings_row(&pool).await
        .expect("Failed to ensure settings row");
    
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