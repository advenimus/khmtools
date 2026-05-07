use crate::domain::settings::files;
use crate::error::AppResult;
use crate::storage;

#[tauri::command]
pub fn onboarding_needed() -> bool {
    !storage::marker_exists(files::ONBOARDING)
}

#[tauri::command]
pub fn onboarding_complete() -> AppResult<()> {
    storage::marker_set(files::ONBOARDING)
}
