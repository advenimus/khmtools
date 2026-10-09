use super::{reap, Kind, OBS_VIRTUAL_CAM_ARG};
use std::path::{Path, PathBuf};
use std::process::Command;

pub fn default_path(kind: Kind) -> Option<PathBuf> {
    let candidates: &[&str] = match kind {
        Kind::Zoom => &["/usr/bin/zoom", "/snap/bin/zoom-client", "/opt/zoom/zoom"],
        Kind::Obs => &["/usr/bin/obs", "/snap/bin/obs-studio"],
        Kind::MediaManager => &[
            "/usr/bin/meeting-media-manager",
            "/opt/meeting-media-manager/meeting-media-manager",
            "/opt/Meeting Media Manager/meeting-media-manager",
        ],
    };
    candidates.iter().map(PathBuf::from).find(|p| p.exists())
}

pub fn launch_app(kind: Kind, path: &Path) -> std::io::Result<()> {
    let mut cmd = Command::new(path);
    if let Some(dir) = path.parent() {
        cmd.current_dir(dir);
    }
    if kind == Kind::Obs {
        cmd.arg(OBS_VIRTUAL_CAM_ARG);
    }
    reap(cmd.spawn()?);
    Ok(())
}
