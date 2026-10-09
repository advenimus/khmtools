use auto_launch::{AutoLaunch, AutoLaunchBuilder};
use std::path::PathBuf;

const APP_NAME: &str = "KHM Tools";

fn launch_target() -> std::io::Result<PathBuf> {
    // Inside an AppImage, current_exe() is a temporary mount that changes on
    // every run; APPIMAGE holds the real file.
    #[cfg(target_os = "linux")]
    if let Some(appimage) = std::env::var_os("APPIMAGE") {
        return Ok(PathBuf::from(appimage));
    }
    std::env::current_exe()
}

fn registered_path() -> std::io::Result<String> {
    let path = launch_target()?.to_string_lossy().into_owned();
    // The Windows registry value is a command line, so a path with spaces
    // must be quoted or Windows may run the wrong program.
    if cfg!(target_os = "windows") {
        Ok(format!("\"{path}\""))
    } else {
        Ok(path)
    }
}

fn instance() -> Result<AutoLaunch, String> {
    let path = registered_path().map_err(|e| e.to_string())?;
    AutoLaunchBuilder::new()
        .set_app_name(APP_NAME)
        .set_app_path(&path)
        .set_use_launch_agent(true)
        .build()
        .map_err(|e| e.to_string())
}

pub fn is_enabled() -> Result<bool, String> {
    instance()?.is_enabled().map_err(|e| e.to_string())
}

pub fn set(enabled: bool) -> Result<(), String> {
    let al = instance()?;
    let result = if enabled { al.enable() } else { al.disable() };
    match result {
        Ok(()) => Ok(()),
        Err(_) if al.is_enabled().ok() == Some(enabled) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

/// Versions up to 2.0.1 registered a macOS login item through AppleScript,
/// pointing at the inner binary. Remove it so the app doesn't start twice.
pub fn remove_legacy_login_item() {
    #[cfg(target_os = "macos")]
    {
        let Ok(exe) = std::env::current_exe() else {
            return;
        };
        let Some(name) = exe.file_name().map(|n| n.to_string_lossy().into_owned()) else {
            return;
        };
        let script = format!(
            "tell application \"System Events\" to if exists login item \"{name}\" then delete login item \"{name}\""
        );
        if let Err(e) = std::process::Command::new("osascript")
            .args(["-e", &script])
            .output()
        {
            tracing::warn!("couldn't remove old login item: {e}");
        }
    }
}
