// pub fn run() {
//   tauri::Builder::default()
//     .plugin(tauri_plugin_log::init())
//     .plugin(tauri_plugin_sql::Builder::default()
//       .add_database("sqlite:local.db")
//       .build())
//     .run(tauri::generate_context!())
//     .expect("error while running tauri application");
// }
// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
// #[tauri::command]
// fn greet(name: &str) -> String {
//     format!("Hello, {}! You've been greeted from Rust!", name)
// }

// #[cfg_attr(mobile, tauri::mobile_entry_point)]
// pub fn run() {
//     tauri::Builder::default()
//         .plugin(tauri_plugin_shell::init())
//         .plugin(tauri_plugin_dialog::init())
//         .plugin(tauri_plugin_fs::init())
//         .invoke_handler(tauri::generate_handler![greet])
//         .setup(|app| {
//             let window = app.get_webview_window("main").unwrap();
            
//             // Apply window shadows (if supported on the platform)
//             #[cfg(any(windows, target_os = "macos"))]
//             {
//                 use window_shadows::set_shadow;
//                 let _ = set_shadow(&window, true);
//             }
            
//             // Apply window vibrancy (if supported on the platform)
//             #[cfg(target_os = "macos")]
//             {
//                 use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
//                 let _ = apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None);
//             }
            
//             #[cfg(target_os = "windows")]
//             {
//                 use window_vibrancy::apply_blur;
//                 let _ = apply_blur(&window, Some((18, 18, 18, 125)));
//             }
            
//             Ok(())
//         })
//         .run(tauri::generate_context!())
//         .expect("error while running tauri application");
// }

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}