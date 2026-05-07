use super::Kind;
use std::path::{Path, PathBuf};
use std::process::Command;

pub fn default_path(kind: Kind) -> Option<PathBuf> {
    let p = match kind {
        Kind::Zoom => "/Applications/zoom.us.app",
        Kind::Obs => "/Applications/OBS.app",
        Kind::MediaManager => "/Applications/Meeting Media Manager.app",
    };
    Some(PathBuf::from(p))
}

pub fn launch_app(_kind: Kind, path: &Path) -> std::io::Result<()> {
    Command::new("open").arg("-a").arg(path).spawn().map(|_| ())
}
