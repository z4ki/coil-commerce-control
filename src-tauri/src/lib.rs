// use tauri_plugin_dialog;

// #[cfg_attr(mobile, tauri::mobile_entry_point)]
// pub fn run() {
//   tauri::Builder::default()
//     .plugin(tauri_plugin_dialog::init())
//     .setup(|app| {
//       if cfg!(debug_assertions) {
//         app.handle().plugin(
//           tauri_plugin_log::Builder::default()
//             .level(log::LevelFilter::Info)
//             .build(),
//         )?;
//       }
//       Ok(())
//     })
//     .run(tauri::generate_context!())
//     .expect("error while running tauri application");
// }

// In your commands file (e.g., `commands/mod.rs`), you will need to import this trait.
// use tauri_plugin_dialog::DialogExt; 

// It's also good practice to import the AppHandle and Manager traits in lib.rs
use tauri::{AppHandle, Manager};
mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    // --- START: THE DEFINITIVE FIX ---
    // All plugins should be registered and managed inside the `setup` hook.
    // This ensures they are fully initialized before any other code can run.
    .setup(|app| {
      // Get a handle to the app, which is needed to register plugins
      let handle: AppHandle = app.handle().clone();

      // Register the Dialog plugin using the handle
      handle.plugin(tauri_plugin_dialog::init())?;

      // Register the Log plugin (only for debug builds) using the handle
      if cfg!(debug_assertions) {
        handle.plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // After setting up all plugins, return Ok.
      Ok(())
    })
    // --- END: THE DEFINITIVE FIX ---

    // Your invoke_handler should come AFTER setup
    .invoke_handler(tauri::generate_handler![
        // Make sure to include your `import_db` command here
        // e.g., crate::commands::import_db
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
