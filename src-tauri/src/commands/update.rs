use crate::updates;
use serde::Serialize;

#[derive(Serialize)]
pub struct UpdateInfo {
    pub available: bool,
    pub current_version: String,
    pub latest_version: Option<String>,
    pub notes: Option<String>,
}

#[tauri::command]
pub async fn check_for_update(app: tauri::AppHandle) -> Result<UpdateInfo, String> {
    let current_version = app.package_info().version.to_string();
    let update = updates::find(&app).await.map_err(|e| {
        tracing::warn!("update check error: {e}");
        "Couldn't check for updates. Check your internet connection and try again.".to_string()
    })?;
    Ok(UpdateInfo {
        available: update.is_some(),
        current_version,
        latest_version: update.as_ref().map(|u| u.version.clone()),
        notes: update.and_then(|u| u.body),
    })
}

#[tauri::command]
pub async fn install_update(app: tauri::AppHandle) -> Result<(), String> {
    let update = updates::find(&app)
        .await?
        .ok_or("There's no update to install any more. You're on the latest version.")?;
    update
        .download_and_install(|_, _| {}, || {})
        .await
        .map_err(|e| format!("The update couldn't be installed: {e}"))?;
    app.restart();
}

#[tauri::command]
pub fn app_version(app: tauri::AppHandle) -> String {
    app.package_info().version.to_string()
}
