use sqlx::SqlitePool;
use tauri::{Manager, Wry};
use tauri_plugin_sql::{Migration, MigrationKind};

pub mod commands;
pub mod database;
pub mod error;
pub mod sync;

pub use error::Error;
pub type Result<T> = std::result::Result<T, Error>;

pub fn run_app() {
    let context = tauri::generate_context!();

    // Define the database migrations using the official plugin feature.
    // This will automatically create your tables the first time the app is run.
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: include_str!("../db/schema.sql"), // This embeds your schema.sql into the app
            kind: MigrationKind::Up,
        }
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_sql::Builder::default()
            // This tells the plugin about your database and automatically
            // handles its creation and migrations at runtime.
            .add_migrations("sqlite:app.db", migrations)
            .build())
        .setup(|app| {
            // Now that the plugin manages the DB, the setup is much cleaner.
            // We can get a handle to the DB pool if we need it for other tasks.
            let pool: SqlitePool = app.state::<tauri_plugin_sql::TauriSql<Wry>>().get_pool("sqlite:app.db")?;
            app.manage(pool);

            log::info!("App setup complete. Database initialized by tauri-plugin-sql.");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::check_local_data,
            commands::fetch_pending_sync_items,
            commands::mark_sync_complete,
            commands::mark_sync_failed,
            commands::get_local_records,
            commands::initial_download_and_insert,
            sync::process_sync_queue,
            sync::initial_sync,
        ])
        .run(context)
        .expect("error while running tauri application");
}
