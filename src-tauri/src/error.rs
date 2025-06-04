use rusqlite::Error as SqliteError;
use serde::Serialize;
use std::fmt;
use tauri::Manager;

#[derive(Debug, Serialize)]
pub enum SyncError {
    Database(String),
    Network(String),
    Conflict(String),
    Io(String),
    Json(String),
    Parse(String), // ← Add this line

}

impl fmt::Display for SyncError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            SyncError::Database(msg) => write!(f, "Database error: {}", msg),
            SyncError::Network(msg) => write!(f, "Network error: {}", msg),
            SyncError::Conflict(msg) => write!(f, "Sync conflict: {}", msg),
            SyncError::Io(msg) => write!(f, "IO error: {}", msg),
            SyncError::Json(msg) => write!(f, "JSON error: {}", msg),
            SyncError::Parse(msg) => write!(f, "Parse error: {}", msg), // ← Add this line
        }
    }
}

impl From<SqliteError> for SyncError {
    fn from(err: SqliteError) -> Self {
        SyncError::Database(err.to_string())
    }
}

impl From<std::io::Error> for SyncError {
    fn from(err: std::io::Error) -> Self {
        SyncError::Io(err.to_string())
    }
}

impl From<serde_json::Error> for SyncError {
    fn from(err: serde_json::Error) -> Self {
        SyncError::Json(err.to_string())
    }
}

impl From<tauri::Error> for SyncError {
    fn from(err: tauri::Error) -> Self {
        SyncError::Io(err.to_string())
    }
}

impl From<Box<dyn std::error::Error>> for SyncError {
    fn from(err: Box<dyn std::error::Error>) -> Self {
        SyncError::Io(err.to_string())
    }
}

impl std::error::Error for SyncError {}

pub fn get_app_data_dir(app_handle: &tauri::AppHandle) -> Result<String, SyncError> {
    let app_dir = app_handle.path().app_data_dir()?;
    Ok(app_dir.to_string_lossy().into_owned())
}
