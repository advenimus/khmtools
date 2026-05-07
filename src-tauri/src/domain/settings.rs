use serde::{Deserialize, Serialize};
use std::path::PathBuf;

// ---------- App ----------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Theme {
    System,
    Light,
    Dark,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum UpdateChannel {
    Stable,
    Beta,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DefaultTool {
    Dashboard,
    Attendance,
    Zoom,
    Media,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub theme: Theme,
    pub default_tool: DefaultTool,
    pub always_maximize: bool,
    pub run_at_logon: bool,
    pub update_channel: UpdateChannel,
    pub install_on_quit: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: Theme::System,
            default_tool: DefaultTool::Dashboard,
            always_maximize: false,
            run_at_logon: false,
            update_channel: UpdateChannel::Stable,
            install_on_quit: true,
        }
    }
}

// ---------- Meeting ----------

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MeetingDay {
    pub day: String,
    pub time: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MeetingSettings {
    pub meeting_id: String,
    pub midweek: MeetingDay,
    pub weekend: MeetingDay,
}

impl Default for MeetingSettings {
    fn default() -> Self {
        Self {
            meeting_id: String::new(),
            midweek: MeetingDay {
                day: "tuesday".into(),
                time: "19:30".into(),
            },
            weekend: MeetingDay {
                day: "sunday".into(),
                time: "10:00".into(),
            },
        }
    }
}

// ---------- Paths ----------

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct AppPaths {
    pub zoom: Option<PathBuf>,
    pub obs: Option<PathBuf>,
    pub media_manager: Option<PathBuf>,
}

// ---------- Media Launcher ----------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CustomMessageDisplay {
    None,
    Always,
    Weekend,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LaunchToggles {
    pub launch_obs: bool,
    pub launch_media_manager: bool,
    pub launch_zoom: bool,
}

impl Default for LaunchToggles {
    fn default() -> Self {
        Self {
            launch_obs: false,
            launch_media_manager: false,
            launch_zoom: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomMessage {
    pub display_when: CustomMessageDisplay,
    pub title: String,
    pub message: String,
    pub display_time_seconds: u32,
}

impl Default for CustomMessage {
    fn default() -> Self {
        Self {
            display_when: CustomMessageDisplay::None,
            title: "Pre-Meeting Checklist".into(),
            message: "Welcome to the meeting!".into(),
            display_time_seconds: 5,
        }
    }
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct MediaLauncherSettings {
    pub toggles: LaunchToggles,
    pub custom_message: CustomMessage,
}

// ---------- File names ----------

pub mod files {
    pub const APP: &str = "app.json";
    pub const MEETING: &str = "meeting.json";
    pub const PATHS: &str = "paths.json";
    pub const MEDIA: &str = "media_launcher.json";
    pub const ONBOARDING: &str = ".onboarding_done";

    pub const ALL: &[&str] = &[APP, MEETING, PATHS, MEDIA];
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn defaults_round_trip() {
        let app = AppSettings::default();
        let json = serde_json::to_string(&app).unwrap();
        let _: AppSettings = serde_json::from_str(&json).unwrap();

        let m = MeetingSettings::default();
        let json = serde_json::to_string(&m).unwrap();
        let _: MeetingSettings = serde_json::from_str(&json).unwrap();

        let p = AppPaths::default();
        let json = serde_json::to_string(&p).unwrap();
        let _: AppPaths = serde_json::from_str(&json).unwrap();

        let ml = MediaLauncherSettings::default();
        let json = serde_json::to_string(&ml).unwrap();
        let _: MediaLauncherSettings = serde_json::from_str(&json).unwrap();
    }

    #[test]
    fn channel_serialization() {
        let stable = serde_json::to_string(&UpdateChannel::Stable).unwrap();
        assert_eq!(stable, "\"stable\"");
        let beta: UpdateChannel = serde_json::from_str("\"beta\"").unwrap();
        assert_eq!(beta, UpdateChannel::Beta);
    }
}
