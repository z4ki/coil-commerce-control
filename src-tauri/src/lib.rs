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

    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: include_str!("../db/schema.sql"),
            kind: MigrationKind::Up,
        }
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_sql::Builder::default()
            .add_migrations("sqlite:app.db", migrations)
            .build())
        .setup(|app| {
            // The plugin automatically manages the database pool.
            // We can just use the setup hook to run async tasks at startup.
            let _handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                log::info!("App setup complete. Database has been initialized by the plugin.");
                // You could run startup tasks like an initial sync check here.
            });
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
