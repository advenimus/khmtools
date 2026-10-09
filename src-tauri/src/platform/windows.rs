use super::{cmd_no_window, reap, Kind, OBS_VIRTUAL_CAM_ARG};
use std::path::{Path, PathBuf};
use std::process::Command;

fn env_dirs(vars: &[&str]) -> Vec<PathBuf> {
    vars.iter()
        .filter_map(std::env::var_os)
        .map(PathBuf::from)
        .collect()
}

fn candidates(kind: Kind) -> Vec<PathBuf> {
    let program_files = env_dirs(&["ProgramFiles", "ProgramW6432", "ProgramFiles(x86)"]);
    let local = env_dirs(&["LOCALAPPDATA"]);
    let roaming = env_dirs(&["APPDATA"]);

    let join_all = |bases: &[PathBuf], rel: &str| -> Vec<PathBuf> {
        bases.iter().map(|b| b.join(rel)).collect()
    };

    match kind {
        Kind::Zoom => [
            join_all(&program_files, "Zoom\\bin\\Zoom.exe"),
            join_all(&roaming, "Zoom\\bin\\Zoom.exe"),
        ]
        .concat(),
        Kind::Obs => join_all(&program_files, "obs-studio\\bin\\64bit\\obs64.exe"),
        Kind::MediaManager => [
            join_all(
                &local,
                "Programs\\Meeting Media Manager\\Meeting Media Manager.exe",
            ),
            join_all(
                &program_files,
                "Meeting Media Manager\\Meeting Media Manager.exe",
            ),
        ]
        .concat(),
    }
}

/// Returns the first candidate that exists, or the first one so error
/// messages can still say where we looked.
pub fn default_path(kind: Kind) -> Option<PathBuf> {
    let all = candidates(kind);
    all.iter()
        .find(|p| p.exists())
        .cloned()
        .or_else(|| all.into_iter().next())
}

pub fn launch_app(kind: Kind, path: &Path) -> std::io::Result<()> {
    let mut cmd = Command::new(path);
    if let Some(dir) = path.parent() {
        cmd.current_dir(dir);
    }
    if kind == Kind::Obs {
        cmd.arg(OBS_VIRTUAL_CAM_ARG);
    }
    reap(cmd_no_window(&mut cmd).spawn()?);
    Ok(())
}
