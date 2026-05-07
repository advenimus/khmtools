use crate::domain::settings::{
    files, AppPaths, AppSettings, MediaLauncherSettings, MeetingSettings, UpdateChannel,
};
use crate::error::AppResult;
use crate::storage;

#[tauri::command]
pub fn get_app_settings() -> AppSettings {
    storage::load_or_default(files::APP)
}

#[tauri::command]
pub fn save_app_settings(settings: AppSettings) -> AppResult<()> {
    storage::save(files::APP, &settings)
}

#[tauri::command]
pub fn get_meeting_settings() -> MeetingSettings {
    storage::load_or_default(files::MEETING)
}

#[tauri::command]
pub fn save_meeting_settings(settings: MeetingSettings) -> AppResult<()> {
    storage::save(files::MEETING, &settings)
}

#[tauri::command]
pub fn get_paths() -> AppPaths {
    storage::load_or_default(files::PATHS)
}

#[tauri::command]
pub fn save_paths(paths: AppPaths) -> AppResult<()> {
    storage::save(files::PATHS, &paths)
}

#[tauri::command]
pub fn get_media_launcher_settings() -> MediaLauncherSettings {
    storage::load_or_default(files::MEDIA)
}

#[tauri::command]
pub fn save_media_launcher_settings(settings: MediaLauncherSettings) -> AppResult<()> {
    storage::save(files::MEDIA, &settings)
}

#[tauri::command]
pub fn reset_all_settings() -> AppResult<()> {
    storage::delete_files(files::ALL)?;
    storage::marker_clear(files::ONBOARDING)
}

#[tauri::command]
pub fn set_update_channel(channel: UpdateChannel) -> AppResult<()> {
    let mut app: AppSettings = storage::load_or_default(files::APP);
    app.update_channel = channel;
    storage::save(files::APP, &app)
}
