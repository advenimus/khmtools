use std::path::{Path, PathBuf};
use std::process::Command;

#[cfg(target_os = "macos")]
pub mod macos;
#[cfg(target_os = "macos")]
use macos as imp;

#[cfg(target_os = "windows")]
pub mod windows;
#[cfg(target_os = "windows")]
use windows as imp;

#[cfg(target_os = "linux")]
pub mod linux;
#[cfg(target_os = "linux")]
use linux as imp;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Kind {
    Zoom,
    Obs,
    MediaManager,
}

pub fn default_path(kind: Kind) -> Option<PathBuf> {
    imp::default_path(kind)
}

pub fn launch_app(kind: Kind, path: &Path) -> std::io::Result<()> {
    imp::launch_app(kind, path)
}

pub fn launch_zoom_meeting(meeting_id: &str) -> Result<(), opener::OpenError> {
    let url = format!("zoommtg://zoom.us/join?confno={meeting_id}");
    opener::open(url)
}

pub fn open_url(url: &str) -> Result<(), opener::OpenError> {
    opener::open(url)
}

pub fn open_path(path: &Path) -> Result<(), opener::OpenError> {
    opener::open(path)
}

pub fn cmd_no_window(cmd: &mut Command) -> &mut Command {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }
    cmd
}
