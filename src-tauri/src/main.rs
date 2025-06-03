// // Prevents additional console window on Windows in release, DO NOT REMOVE!!
// #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// mod database;

// use tauri::Manager;
// use database::initialize_database;

// fn main() {
//     tauri::Builder::default()
//         .setup(|app| {
//             let handle = app.handle();
//             let conn = initialize_database(&handle).expect("Database initialization failed");
//             app.manage(conn);
//             Ok(())
//         })
//         .run(tauri::generate_context!())
//         .expect("error while running tauri application");
// }
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    app_lib::run()
}