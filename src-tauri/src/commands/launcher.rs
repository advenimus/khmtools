use crate::domain::settings::{
    files, AppPaths, CustomMessageDisplay, MediaLauncherSettings, MeetingSettings,
};
use crate::domain::{meeting_schedule, zoom};
use crate::error::AppResult;
use crate::platform::{self, Kind};
use crate::storage;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
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

#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AppKind {
    Zoom,
    Obs,
    MediaManager,
}

impl From<AppKind> for Kind {
    fn from(k: AppKind) -> Self {
        match k {
            AppKind::Zoom => Kind::Zoom,
            AppKind::Obs => Kind::Obs,
            AppKind::MediaManager => Kind::MediaManager,
        }
    }
}

fn configured_path(paths: &AppPaths, kind: Kind) -> Option<PathBuf> {
    match kind {
        Kind::Zoom => paths.zoom.clone(),
        Kind::Obs => paths.obs.clone(),
        Kind::MediaManager => paths.media_manager.clone(),
    }
}

pub fn resolve_path(kind: Kind) -> Option<PathBuf> {
    let paths: AppPaths = storage::load_or_default(files::PATHS);
    configured_path(&paths, kind).or_else(|| platform::default_path(kind))
}

fn launch_kind(kind: Kind) -> LaunchResult {
    let name = kind.label();
    let Some(path) = resolve_path(kind) else {
        return LaunchResult::err(format!(
            "{name} wasn't found. Set its location in Settings → Application Paths."
        ));
    };
    if !path.exists() {
        return LaunchResult::err(format!(
            "{name} wasn't found at {}. Set its location in Settings → Application Paths.",
            path.display()
        ));
    }
    match platform::launch_app(kind, &path) {
        Ok(()) => LaunchResult::ok(format!("{name} opened")),
        Err(e) => {
            tracing::error!("launching {name} at {} failed: {e}", path.display());
            LaunchResult::err(format!("{name} didn't start: {e}"))
        }
    }
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
pub async fn browse_for_app(app: tauri::AppHandle, kind: AppKind) -> AppResult<Option<PathBuf>> {
    let Some(path) = pick_app_file(&app, kind.into()).await else {
        return Ok(None);
    };
    storage::update(files::PATHS, |paths: AppPaths| {
        set_path(paths, kind, Some(path.clone()))
    })?;
    Ok(Some(path))
}

async fn pick_app_file(app: &tauri::AppHandle, kind: Kind) -> Option<PathBuf> {
    let (tx, rx) = tokio::sync::oneshot::channel();
    let mut builder = app
        .dialog()
        .file()
        .set_title(format!("Select the {} application", kind.label()));
    if cfg!(target_os = "macos") {
        builder = builder.add_filter("Applications", &["app"]);
    } else if cfg!(target_os = "windows") {
        builder = builder.add_filter("Programs", &["exe"]);
    }
    builder.pick_file(move |p| {
        let _ = tx.send(p);
    });
    rx.await.ok().flatten()?.into_path().ok()
}

pub fn set_path(paths: AppPaths, kind: AppKind, value: Option<PathBuf>) -> AppPaths {
    match kind {
        AppKind::Zoom => AppPaths {
            zoom: value,
            ..paths
        },
        AppKind::Obs => AppPaths {
            obs: value,
            ..paths
        },
        AppKind::MediaManager => AppPaths {
            media_manager: value,
            ..paths
        },
    }
}

#[tauri::command(async)]
pub fn launch_zoom() -> LaunchResult {
    let meeting: MeetingSettings = storage::load_or_default(files::MEETING);
    match zoom::parse(&meeting.meeting_id, &meeting.passcode) {
        Ok(join) => join_meeting(&join),
        Err(zoom::ParseError::Empty) => launch_kind(Kind::Zoom),
        Err(e) => LaunchResult::err(format!("{e} Fix it in Settings → Meetings.")),
    }
}

fn join_meeting(join: &zoom::ZoomJoin) -> LaunchResult {
    match platform::open_url(&zoom::join_url(join)) {
        Ok(()) => LaunchResult::ok(format!("Joining meeting {}", join.meeting_id)),
        Err(e) => {
            tracing::warn!("zoommtg link failed: {e}");
            let fallback = launch_kind(Kind::Zoom);
            let message = if fallback.success {
                "Zoom opened, but it couldn't join the meeting automatically. Join it from Zoom."
                    .to_string()
            } else {
                format!("Zoom couldn't join the meeting. {}", fallback.message)
            };
            LaunchResult::err(message)
        }
    }
}

#[tauri::command(async)]
pub fn launch_obs() -> LaunchResult {
    launch_kind(Kind::Obs)
}

#[tauri::command(async)]
pub fn launch_media_manager() -> LaunchResult {
    launch_kind(Kind::MediaManager)
}

#[tauri::command]
pub fn should_show_custom_message() -> bool {
    let media: MediaLauncherSettings = storage::load_or_default(files::MEDIA);
    let meeting: MeetingSettings = storage::load_or_default(files::MEETING);
    match media.custom_message.display_when {
        CustomMessageDisplay::None => false,
        CustomMessageDisplay::Always => true,
        CustomMessageDisplay::Weekend => meeting_schedule::is_meeting_day(
            &meeting.weekend.day,
            &meeting.weekend.time,
            chrono::Local::now().naive_local(),
        ),
    }
}

#[derive(Serialize)]
pub struct MeetingInputCheck {
    pub valid: bool,
    pub meeting_id: Option<String>,
    pub has_passcode: bool,
    pub message: Option<String>,
}

#[tauri::command]
pub fn check_meeting_input(meeting_id: String, passcode: String) -> MeetingInputCheck {
    match zoom::parse(&meeting_id, &passcode) {
        Ok(j) => MeetingInputCheck {
            valid: true,
            has_passcode: j.passcode.is_some(),
            meeting_id: Some(j.meeting_id),
            message: None,
        },
        Err(e) => MeetingInputCheck {
            valid: matches!(e, zoom::ParseError::Empty),
            meeting_id: None,
            has_passcode: false,
            message: Some(e.to_string()),
        },
    }
}

#[derive(Serialize)]
pub struct SetupStatus {
    pub problems: Vec<String>,
}

#[tauri::command(async)]
pub fn setup_status() -> SetupStatus {
    let meeting: MeetingSettings = storage::load_or_default(files::MEETING);
    let media: MediaLauncherSettings = storage::load_or_default(files::MEDIA);
    let wanted = [
        (media.toggles.launch_obs, Kind::Obs),
        (media.toggles.launch_media_manager, Kind::MediaManager),
    ];
    let mut problems: Vec<String> = wanted
        .iter()
        .filter(|(on, kind)| *on && !resolve_path(*kind).is_some_and(|p| p.exists()))
        .map(|(_, kind)| format!("{} wasn't found on this computer.", kind.label()))
        .collect();
    match zoom::parse(&meeting.meeting_id, &meeting.passcode) {
        Ok(_) => {}
        Err(zoom::ParseError::Empty) => {
            problems.push("No Zoom meeting ID is set, so Zoom will open without joining.".into())
        }
        Err(e) => problems.push(e.to_string()),
    }
    SetupStatus { problems }
}
