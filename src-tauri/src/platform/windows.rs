use super::{cmd_no_window, Kind};
use std::path::{Path, PathBuf};
use std::process::Command;

pub fn default_path(kind: Kind) -> Option<PathBuf> {
    match kind {
        Kind::Zoom => {
            let system = PathBuf::from("C:\\Program Files\\Zoom\\bin\\Zoom.exe");
            if system.exists() {
                return Some(system);
            }
            if let Ok(appdata) = std::env::var("APPDATA") {
                let user = PathBuf::from(appdata).join("Zoom\\bin\\Zoom.exe");
                if user.exists() {
                    return Some(user);
                }
            }
            Some(PathBuf::from("C:\\Program Files\\Zoom\\bin\\Zoom.exe"))
        }
        Kind::Obs => Some(PathBuf::from(
            "C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe",
        )),
        Kind::MediaManager => Some(PathBuf::from(
            "C:\\Program Files\\Meeting Media Manager\\Meeting Media Manager.exe",
        )),
    }
}

pub fn launch_app(kind: Kind, path: &Path) -> std::io::Result<()> {
    let dir = path.parent();
    let mut cmd = Command::new(path);
    if let Some(d) = dir {
        cmd.current_dir(d);
    }
    if matches!(kind, Kind::Obs) {
        cmd.arg("--startvirtualcam");
    }
    cmd_no_window(&mut cmd).spawn().map(|_| ())
}
