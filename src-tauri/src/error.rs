use serde::{Serialize, Serializer};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Couldn't read or write a settings file ({0}). Check that your user folder isn't full or read-only.")]
    Io(#[from] std::io::Error),

    #[error("A settings file has invalid data ({0}).")]
    Json(#[from] serde_json::Error),

    #[error("{0}")]
    Tauri(#[from] tauri::Error),

    #[error("Couldn't find your user settings folder.")]
    ConfigDirMissing,

    #[error("{0}")]
    Other(String),
}

impl AppError {
    pub fn other(msg: impl Into<String>) -> Self {
        AppError::Other(msg.into())
    }
}

impl From<crate::domain::zoom::ParseError> for AppError {
    fn from(e: crate::domain::zoom::ParseError) -> Self {
        AppError::other(e.to_string())
    }
}

impl Serialize for AppError {
    fn serialize<S>(&self, s: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        s.serialize_str(&self.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;
