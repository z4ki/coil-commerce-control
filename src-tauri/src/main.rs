// main.rs - Updated version
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// This main.rs now simply calls the run_app function from the library.
// This is a common pattern for larger Tauri apps to keep main.rs clean.

use fern::colors::{Color, ColoredLevelConfig};
use log::LevelFilter;
use chrono::Local;

fn setup_logging() -> std::result::Result<(), fern::InitError> {
    let colors = ColoredLevelConfig::new()
        .info(Color::Green)
        .warn(Color::Yellow)
        .error(Color::Red)
        .debug(Color::Blue)
        .trace(Color::White);

    fern::Dispatch::new()
        .format(move |out, message, record| {
            out.finish(format_args!(
                "{}[{}][{}] {}",
                Local::now().format("[%Y-%m-%d][%H:%M:%S]"),
                record.target(),
                colors.color(record.level()),
                message
            ))
        })
        .level(if cfg!(debug_assertions) {
            LevelFilter::Debug
        } else {
            LevelFilter::Info
        })
        .chain(std::io::stdout())
        .chain(fern::log_file("app.log")?)
        .apply()?;

    Ok(())
}

fn main() {
    if let Err(e) = setup_logging() {
        // Use standard eprintln before logger is set up.
        eprintln!("FATAL: Failed to initialize logging: {}", e);
        // Exit if we can't log, as it's a critical failure.
        return;
    }
    
    // Call the app setup and run logic from the library crate.
    app_lib::run_app();
}
