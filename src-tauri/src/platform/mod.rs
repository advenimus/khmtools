use std::path::{Path, PathBuf};
#[cfg(not(target_os = "macos"))]
use std::process::Child;
use std::process::Command;

pub mod autostart;

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

pub const OBS_VIRTUAL_CAM_ARG: &str = "--startvirtualcam";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Kind {
    Zoom,
    Obs,
    MediaManager,
}

impl Kind {
    pub fn label(self) -> &'static str {
        match self {
            Kind::Zoom => "Zoom",
            Kind::Obs => "OBS",
            Kind::MediaManager => "Meeting Media Manager",
        }
    }
}

pub fn default_path(kind: Kind) -> Option<PathBuf> {
    imp::default_path(kind)
}

pub fn launch_app(kind: Kind, path: &Path) -> std::io::Result<()> {
    imp::launch_app(kind, path)
}

pub fn open_url(url: &str) -> Result<(), opener::OpenError> {
    opener::open(url)
}

pub fn open_path(path: &Path) -> Result<(), opener::OpenError> {
    opener::open(path)
}

/// Waits on the child in the background so it doesn't linger as a zombie.
#[cfg(not(target_os = "macos"))]
pub fn reap(child: Child) {
    std::thread::spawn(move || {
        let mut child = child;
        let _ = child.wait();
    });
}

pub fn cmd_no_window(cmd: &mut Command) -> &mut Command {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    cmd
}
