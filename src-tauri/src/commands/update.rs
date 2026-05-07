use crate::domain::settings::{files, AppSettings, UpdateChannel};
use crate::storage;
use serde::Serialize;
use tauri_plugin_updater::UpdaterExt;

const STABLE_ENDPOINT: &str =
    "https://github.com/advenimus/khmtools/releases/latest/download/latest.json";
const BETA_ENDPOINT: &str =
    "https://github.com/advenimus/khmtools/releases/download/beta/latest-beta.json";

#[derive(Serialize)]
pub struct UpdateInfo {
    pub available: bool,
    pub current_version: String,
    pub latest_version: Option<String>,
    pub notes: Option<String>,
}

fn endpoint_for_channel(c: &UpdateChannel) -> &'static str {
    match c {
        UpdateChannel::Stable => STABLE_ENDPOINT,
        UpdateChannel::Beta => BETA_ENDPOINT,
    }
}

#[tauri::command]
pub async fn check_for_update(app: tauri::AppHandle) -> Result<UpdateInfo, String> {
    let settings: AppSettings = storage::load_or_default(files::APP);
    let endpoint = endpoint_for_channel(&settings.update_channel);
    let url = endpoint
        .parse()
        .map_err(|e: url::ParseError| e.to_string())?;

    let current_version = app.package_info().version.to_string();

    let updater = app
        .updater_builder()
        .endpoints(vec![url])
        .map_err(|e| e.to_string())?
        .build()
        .map_err(|e| e.to_string())?;

    match updater.check().await {
        Ok(Some(update)) => Ok(UpdateInfo {
            available: true,
            current_version,
            latest_version: Some(update.version.clone()),
            notes: update.body.clone(),
        }),
        Ok(None) => Ok(UpdateInfo {
            available: false,
            current_version,
            latest_version: None,
            notes: None,
        }),
        Err(e) => {
            tracing::warn!("update check error: {e}");
            Ok(UpdateInfo {
                available: false,
                current_version,
                latest_version: None,
                notes: None,
            })
        }
    }
}

#[tauri::command]
pub async fn install_update(app: tauri::AppHandle) -> Result<(), String> {
    let settings: AppSettings = storage::load_or_default(files::APP);
    let endpoint = endpoint_for_channel(&settings.update_channel);
    let url = endpoint
        .parse()
        .map_err(|e: url::ParseError| e.to_string())?;

    let updater = app
        .updater_builder()
        .endpoints(vec![url])
        .map_err(|e| e.to_string())?
        .build()
        .map_err(|e| e.to_string())?;

    if let Some(update) = updater.check().await.map_err(|e| e.to_string())? {
        update
            .download_and_install(|_chunk_len, _total| {}, || {})
            .await
            .map_err(|e| e.to_string())?;
        app.restart();
    }
    Ok(())
}

#[tauri::command]
pub fn app_version(app: tauri::AppHandle) -> String {
    app.package_info().version.to_string()
}
