use tauri::{AppHandle, Manager, Runtime};
use sqlx::{SqlitePool, query, query_scalar};
use log::{info, error};
use crate::Error;

pub const ENTITY_TABLES: &[&str] = &["clients", "sales", "invoices", "payments", "credit_transactions"];

pub async fn initialize_database<R: Runtime>(app: &AppHandle<R>) -> Result<(), Error> {
    info!("Initializing database...");
    let pool = app.state::<SqlitePool>();
    
    info!("Reading schema file...");
    let migration_source = std::fs::read_to_string("db/schema.sql")?;

    let create_migrations_table = "
        CREATE TABLE IF NOT EXISTS _migrations (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );";

    // FIX: Changed `&**pool` to `&*pool`.
    // `pool` is a `State<'_, SqlitePool>`. We need to dereference it once to get
    // the underlying `SqlitePool` and then take a reference to that.
    query(create_migrations_table)
        .execute(&*pool)
        .await
        .map_err(|e| {
            error!("Failed to create migrations table: {}", e);
            Error::Sql(e)
        })?;

    // FIX: Changed `&**pool` to `&*pool`
    let migration_count: i64 = query_scalar(
        "SELECT COUNT(*) FROM _migrations WHERE name = ?"
    )
        .bind("initial")
        .fetch_one(&*pool)
        .await
        .map_err(|e| {
            error!("Failed to check migration status: {}", e);
            Error::Sql(e)
        })?;

    let migration_exists = migration_count > 0;

    if !migration_exists {
        info!("Applying initial migration...");
        // FIX: Changed `&**pool` to `&*pool`
        query(&migration_source)
            .execute(&*pool)
            .await
            .map_err(|e| {
                error!("Failed to apply migrations: {}", e);
                Error::Sql(e)
            })?;

        // FIX: Changed `&**pool` to `&*pool`
        query("INSERT INTO _migrations (name) VALUES (?)")
            .bind("initial")
            .execute(&*pool)
            .await
            .map_err(|e| {
                error!("Failed to record migration: {}", e);
                Error::Sql(e)
            })?;

        info!("Initial migration applied successfully");
    } else {
        info!("Initial migration already applied");
    }

    info!("Database initialization completed");
    Ok(())
}
