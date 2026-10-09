use super::{Kind, OBS_VIRTUAL_CAM_ARG};
use std::io;
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

pub fn launch_app(kind: Kind, path: &Path) -> io::Result<()> {
    let mut cmd = Command::new("open");
    cmd.arg("-a").arg(path);
    if kind == Kind::Obs {
        cmd.args(["--args", OBS_VIRTUAL_CAM_ARG]);
    }
    let status = cmd.status()?;
    if status.success() {
        Ok(())
    } else {
        Err(io::Error::other(format!(
            "macOS couldn't open {} (exit code {})",
            path.display(),
            status.code().unwrap_or(-1)
        )))
    }
}
