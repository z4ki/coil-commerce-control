use serde::{Serialize, Serializer};
use thiserror::Error;

// No changes were needed here, but it's the key to understanding the main error.
// Each variant like `Io`, `Sql`, `Network`, and `Custom` is defined to hold
// ONLY ONE value (e.g., `Sql` holds a `sqlx::Error`).
// The problem was that in other files, you were trying to pass two arguments,
// like `Error::Sql(the_error, some_context)`. The compiler correctly flagged this.
// The fix is to only pass the one argument that the enum variant expects.

#[derive(Debug, Error)]
pub enum Error {
    #[error("IO error: {0}")]
    Io(#[source] std::io::Error),

    #[error("SQL error: {0}")]
    Sql(#[source] sqlx::Error),

    #[error("Network error: {0}")]
    Network(#[source] reqwest::Error),

    #[error("Tauri error: {0}")]
    Tauri(#[source] tauri::Error),

    #[error("{0}")]
    Custom(String),
}

impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

// The From traits are very helpful. They allow us to use `?` to automatically
// convert standard errors into our custom `Error` type.
impl From<std::io::Error> for Error {
    fn from(err: std::io::Error) -> Self {
        Error::Io(err)
    }
}

impl From<sqlx::Error> for Error {
    fn from(err: sqlx::Error) -> Self {
        Error::Sql(err)
    }
}

impl From<reqwest::Error> for Error {
    fn from(err: reqwest::Error) -> Self {
        Error::Network(err)
    }
}

impl From<tauri::Error> for Error {
    fn from(err: tauri::Error) -> Self {
        Error::Tauri(err)
    }
}
