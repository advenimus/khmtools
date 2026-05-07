use crate::domain::meeting_schedule;
use crate::domain::settings::{
    files, AppPaths, CustomMessageDisplay, MediaLauncherSettings, MeetingSettings,
};
use crate::platform::{self, Kind};
use crate::storage;
use serde::Serialize;
use std::path::{Path, PathBuf};
use tauri_plugin_dialog::DialogExt;

#[derive(Serialize)]
pub struct LaunchResult {
    pub success: bool,
    pub message: String,
}

impl LaunchResult {
    fn ok(msg: impl Into<String>) -> Self {
        Self {
            success: true,
            message: msg.into(),
        }
    }
    fn err(msg: impl Into<String>) -> Self {
        Self {
            success: false,
            message: msg.into(),
        }
    }
}

fn resolve_path(kind: Kind) -> Option<PathBuf> {
    let paths: AppPaths = storage::load_or_default(files::PATHS);
    let configured = match kind {
        Kind::Zoom => paths.zoom,
        Kind::Obs => paths.obs,
        Kind::MediaManager => paths.media_manager,
    };
    configured.or_else(|| platform::default_path(kind))
}

fn path_exists(p: &Path) -> bool {
    p.exists()
}

#[tauri::command]
pub fn default_zoom_path() -> Option<PathBuf> {
    platform::default_path(Kind::Zoom)
}

#[tauri::command]
pub fn default_obs_path() -> Option<PathBuf> {
    platform::default_path(Kind::Obs)
}

#[tauri::command]
pub fn default_media_manager_path() -> Option<PathBuf> {
    platform::default_path(Kind::MediaManager)
}

#[tauri::command]
pub async fn browse_for_app(app: tauri::AppHandle, kind: String) -> Option<PathBuf> {
    use tokio::sync::oneshot;

    let kind_enum = match kind.as_str() {
        "zoom" => Kind::Zoom,
        "obs" => Kind::Obs,
        "media_manager" => Kind::MediaManager,
        _ => return None,
    };

    let title = match kind_enum {
        Kind::Zoom => "Select Zoom application",
        Kind::Obs => "Select OBS Studio application",
        Kind::MediaManager => "Select Meeting Media Manager application",
    };

    let (tx, rx) = oneshot::channel();
    let mut builder = app.dialog().file().set_title(title);
    if cfg!(target_os = "macos") {
        builder = builder.add_filter("Applications", &["app"]);
    } else if cfg!(target_os = "windows") {
        builder = builder.add_filter("Executables", &["exe"]);
    }
    builder.pick_file(move |p| {
        let _ = tx.send(p);
    });

    let chosen = rx.await.ok().flatten()?;
    let path: PathBuf = chosen.into_path().ok()?;

    let mut paths: AppPaths = storage::load_or_default(files::PATHS);
    match kind_enum {
        Kind::Zoom => paths.zoom = Some(path.clone()),
        Kind::Obs => paths.obs = Some(path.clone()),
        Kind::MediaManager => paths.media_manager = Some(path.clone()),
    }
    let _ = storage::save(files::PATHS, &paths);
    Some(path)
}

#[tauri::command]
pub fn launch_zoom() -> LaunchResult {
    let meeting: MeetingSettings = storage::load_or_default(files::MEETING);
    let id = meeting.meeting_id.trim();
    if !id.is_empty() {
        let cleaned: String = id.chars().filter(|c| c.is_ascii_digit()).collect();
        if cleaned.len() >= 9 {
            return match platform::launch_zoom_meeting(&cleaned) {
                Ok(_) => LaunchResult::ok(format!("Launching meeting {cleaned}")),
                Err(e) => LaunchResult::err(format!("Couldn't open Zoom URL: {e}")),
            };
        }
    }

    let Some(path) = resolve_path(Kind::Zoom) else {
        return LaunchResult::err(
            "Zoom path not configured. Set it in Settings → Application Paths.",
        );
    };
    if !path_exists(&path) {
        return LaunchResult::err(format!("Zoom not found at {}", path.display()));
    }
    match platform::launch_app(Kind::Zoom, &path) {
        Ok(_) => LaunchResult::ok("Zoom launched"),
        Err(e) => LaunchResult::err(format!("Failed to launch Zoom: {e}")),
    }
}

#[tauri::command]
pub fn launch_obs() -> LaunchResult {
    let Some(path) = resolve_path(Kind::Obs) else {
        return LaunchResult::err(
            "OBS path not configured. Set it in Settings → Application Paths.",
        );
    };
    if !path_exists(&path) {
        return LaunchResult::err(format!("OBS not found at {}", path.display()));
    }
    match platform::launch_app(Kind::Obs, &path) {
        Ok(_) => LaunchResult::ok("OBS launched"),
        Err(e) => LaunchResult::err(format!("Failed to launch OBS: {e}")),
    }
}

#[tauri::command]
pub fn launch_media_manager() -> LaunchResult {
    let Some(path) = resolve_path(Kind::MediaManager) else {
        return LaunchResult::err(
            "Meeting Media Manager path not configured. Set it in Settings → Application Paths.",
        );
    };
    if !path_exists(&path) {
        return LaunchResult::err(format!(
            "Meeting Media Manager not found at {}",
            path.display()
        ));
    }
    match platform::launch_app(Kind::MediaManager, &path) {
        Ok(_) => LaunchResult::ok("Meeting Media Manager launched"),
        Err(e) => LaunchResult::err(format!("Failed to launch Media Manager: {e}")),
    }
}

#[tauri::command]
pub fn should_show_custom_message() -> bool {
    let media: MediaLauncherSettings = storage::load_or_default(files::MEDIA);
    let meeting: MeetingSettings = storage::load_or_default(files::MEETING);
    match media.custom_message.display_when {
        CustomMessageDisplay::None => false,
        CustomMessageDisplay::Always => true,
        CustomMessageDisplay::Weekend => meeting_schedule::is_today(&meeting.weekend.day),
    }
}
