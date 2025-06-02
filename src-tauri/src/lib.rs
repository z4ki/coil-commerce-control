pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_log::init())
    .plugin(tauri_plugin_sql::Builder::default()
      .add_database("sqlite:local.db")
      .build())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
