use crate::domain::settings::{files, AppSettings};
use crate::error::{AppError, AppResult};
use crate::platform::autostart;
use crate::storage;

pub fn set(enabled: bool) -> AppResult<()> {
    autostart::set(enabled).map_err(|e| {
        tracing::error!("run-at-login change failed: {e}");
        AppError::other(format!(
            "Your computer didn't allow the change to run at login: {e}"
        ))
    })
}

/// Brings the OS login entry in line with the saved setting, e.g. after
/// upgrading from a version that registered it differently.
pub fn reconcile_on_startup() {
    let app: AppSettings = storage::load_or_default(files::APP);
    if app.run_at_logon && autostart::is_enabled() == Ok(false) {
        autostart::remove_legacy_login_item();
        if let Err(e) = autostart::set(true) {
            tracing::warn!("couldn't restore run-at-login: {e}");
        }
    }
}

#[tauri::command(async)]
pub fn auto_launch_enabled() -> AppResult<bool> {
    autostart::is_enabled().map_err(AppError::other)
}

#[tauri::command(async)]
pub fn auto_launch_set(enabled: bool) -> AppResult<bool> {
    set(enabled)?;
    let actual = autostart::is_enabled().map_err(AppError::other)?;
    storage::update(files::APP, |app: AppSettings| AppSettings {
        run_at_logon: actual,
        ..app
    })?;
    Ok(actual)
}
