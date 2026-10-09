use crate::domain::urls;
use crate::error::{AppError, AppResult};
use crate::platform;
use crate::storage;

#[tauri::command(async)]
pub fn open_url(url: String) -> AppResult<()> {
    if !urls::is_allowed_external(&url) {
        tracing::warn!("blocked open_url for {url:?}");
        return Err(AppError::other("That link isn't allowed."));
    }
    platform::open_url(&url).map_err(|e| AppError::other(e.to_string()))
}

#[tauri::command(async)]
pub fn open_logs_dir() -> AppResult<()> {
    let dir = storage::logs_dir()?;
    platform::open_path(&dir).map_err(|e| AppError::other(e.to_string()))
}
