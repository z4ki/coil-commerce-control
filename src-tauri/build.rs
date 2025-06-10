// fn main() {
//   tauri_build::build()
// }
// src-tauri/build.rs

use std::env;
use std::fs;
use std::path::Path;
use sqlx::sqlite::{SqlitePoolOptions};
use dotenv::dotenv;

// We use tokio's runtime to run async code in a sync context.
#[tokio::main]
async fn main() {
    // Tell Cargo to rerun this script if the schema file changes.
    println!("cargo:rerun-if-changed=db/schema.sql");
    println!("cargo:rerun-if-changed=.env");

    // Load the .env file to get the DATABASE_URL.
    dotenv().ok();
    
    let db_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set in your .env file");
    
    // The prepare command expects a db/app.db file, so let's make sure the path is correct.
    // This removes the "sqlite:" prefix for path manipulation.
    let db_path_str = db_url.strip_prefix("sqlite:").unwrap_or(&db_url);
    let db_path = Path::new(db_path_str);

    // Create the db directory if it doesn't exist.
    if let Some(parent) = db_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).expect("Failed to create db directory");
        }
    }

    // Create the database file if it doesn't exist.
    if !db_path.exists() {
        fs::File::create(db_path).expect("Failed to create database file");
    }

    // Now connect to the database.
    let pool = SqlitePoolOptions::new()
        .connect(&db_url)
        .await
        .expect("Failed to connect to the database for build script");

    // Read the schema file.
    let schema_sql = fs::read_to_string("db/schema.sql")
        .expect("Failed to read schema.sql file");

    // Execute the schema SQL to create the tables.
    sqlx::query(&schema_sql)
        .execute(&pool)
        .await
        .expect("Failed to execute schema SQL");
    
    pool.close().await;

    println!("cargo:warning=Build script finished, database schema created at {}", db_path.display());
}
