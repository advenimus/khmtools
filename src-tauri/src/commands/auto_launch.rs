use auto_launch::AutoLaunchBuilder;
use std::env::current_exe;

fn instance() -> Option<auto_launch::AutoLaunch> {
    let exe = current_exe().ok()?;
    AutoLaunchBuilder::new()
        .set_app_name("KHM Tools")
        .set_app_path(&exe.to_string_lossy())
        .build()
        .ok()
}

#[tauri::command]
pub fn auto_launch_enabled() -> bool {
    instance()
        .and_then(|al| al.is_enabled().ok())
        .unwrap_or(false)
}

#[tauri::command]
pub fn auto_launch_set(enabled: bool) -> bool {
    let Some(al) = instance() else {
        return false;
    };
    let res = if enabled { al.enable() } else { al.disable() };
    res.is_ok()
}
