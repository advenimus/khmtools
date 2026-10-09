use crate::commands::auto_launch;
use crate::domain::settings::{
    files, AppPaths, AppSettings, MediaLauncherSettings, MeetingSettings, UpdateChannel,
};
use crate::domain::zoom;
use crate::error::{AppError, AppResult};
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
    let settings = settings.normalized();
    match zoom::parse(&settings.meeting_id, &settings.passcode) {
        Ok(_) | Err(zoom::ParseError::Empty) => storage::save(files::MEETING, &settings),
        Err(e) => Err(e.into()),
    }
}

#[tauri::command]
pub fn get_paths() -> AppPaths {
    storage::load_or_default(files::PATHS)
}

#[tauri::command]
pub fn save_paths(paths: AppPaths) -> AppResult<()> {
    let all = [&paths.zoom, &paths.obs, &paths.media_manager];
    if let Some(missing) = all.into_iter().flatten().find(|p| !p.exists()) {
        return Err(AppError::other(format!(
            "{} doesn't exist. Pick the program again.",
            missing.display()
        )));
    }
    storage::save(files::PATHS, &paths)
}

#[tauri::command]
pub fn get_media_launcher_settings() -> MediaLauncherSettings {
    storage::load_or_default(files::MEDIA)
}

#[tauri::command]
pub fn save_media_launcher_settings(settings: MediaLauncherSettings) -> AppResult<()> {
    storage::save(files::MEDIA, &settings.clamped())
}

#[tauri::command(async)]
pub fn reset_all_settings() -> AppResult<()> {
    if let Err(e) = auto_launch::set(false) {
        tracing::warn!("couldn't turn off run-at-login during reset: {e}");
    }
    storage::delete_files(files::ALL)?;
    storage::marker_clear(files::ONBOARDING)
}

#[tauri::command]
pub fn set_update_channel(channel: UpdateChannel) -> AppResult<AppSettings> {
    storage::update(files::APP, |app: AppSettings| AppSettings {
        update_channel: channel,
        ..app
    })
}
