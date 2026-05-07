use super::Kind;
use std::path::{Path, PathBuf};
use std::process::Command;

pub fn default_path(kind: Kind) -> Option<PathBuf> {
    let candidates: &[&str] = match kind {
        Kind::Zoom => &["/usr/bin/zoom", "/snap/bin/zoom-client", "/opt/zoom/zoom"],
        Kind::Obs => &["/usr/bin/obs", "/snap/bin/obs-studio"],
        Kind::MediaManager => &[
            "/usr/bin/meeting-media-manager",
            "/opt/meeting-media-manager/meeting-media-manager",
        ],
    };
    for c in candidates {
        let p = PathBuf::from(c);
        if p.exists() {
            return Some(p);
        }
    }
    None
}

pub fn launch_app(_kind: Kind, path: &Path) -> std::io::Result<()> {
    Command::new(path).spawn().map(|_| ())
}
