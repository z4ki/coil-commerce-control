mod commands {
    pub mod product_history;
    // ... other command modules ...
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::product_history::get_product_history,
            commands::product_history::create_product_history,
            // ... other commands ...
        ])
        // ... rest of the builder configuration ...
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
