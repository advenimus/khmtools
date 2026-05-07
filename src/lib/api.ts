import { invoke } from "@tauri-apps/api/core";

export type ThemeMode = "system" | "light" | "dark";
export type UpdateChannel = "stable" | "beta";
export type DefaultTool =
  | "dashboard"
  | "attendance"
  | "zoom"
  | "media";

export interface AppSettings {
  theme: ThemeMode;
  default_tool: DefaultTool;
  always_maximize: boolean;
  run_at_logon: boolean;
  update_channel: UpdateChannel;
  install_on_quit: boolean;
}

export interface MeetingDay {
  day: string;
  time: string;
}
export interface MeetingSettings {
  meeting_id: string;
  midweek: MeetingDay;
  weekend: MeetingDay;
}

export interface AppPaths {
  zoom: string | null;
  obs: string | null;
  media_manager: string | null;
}

export type CustomMessageDisplay = "none" | "always" | "weekend";

export interface CustomMessage {
  display_when: CustomMessageDisplay;
  title: string;
  message: string;
  display_time_seconds: number;
}

export interface MediaLauncherSettings {
  toggles: {
    launch_obs: boolean;
    launch_media_manager: boolean;
    launch_zoom: boolean;
  };
  custom_message: CustomMessage;
}

export interface LaunchResult {
  success: boolean;
  message: string;
}

export interface UpdateInfo {
  available: boolean;
  current_version: string;
  latest_version: string | null;
  notes: string | null;
}

export const api = {
  // Settings
  getAppSettings: () => invoke<AppSettings>("get_app_settings"),
  saveAppSettings: (settings: AppSettings) =>
    invoke<void>("save_app_settings", { settings }),
  resetAllSettings: () => invoke<void>("reset_all_settings"),

  // Meeting
  getMeetingSettings: () => invoke<MeetingSettings>("get_meeting_settings"),
  saveMeetingSettings: (settings: MeetingSettings) =>
    invoke<void>("save_meeting_settings", { settings }),

  // Paths
  getPaths: () => invoke<AppPaths>("get_paths"),
  savePaths: (paths: AppPaths) => invoke<void>("save_paths", { paths }),
  defaultZoomPath: () => invoke<string | null>("default_zoom_path"),
  defaultObsPath: () => invoke<string | null>("default_obs_path"),
  defaultMediaManagerPath: () =>
    invoke<string | null>("default_media_manager_path"),
  browseFor: (kind: "zoom" | "obs" | "media_manager") =>
    invoke<string | null>("browse_for_app", { kind }),

  // Media launcher
  getMediaLauncherSettings: () =>
    invoke<MediaLauncherSettings>("get_media_launcher_settings"),
  saveMediaLauncherSettings: (settings: MediaLauncherSettings) =>
    invoke<void>("save_media_launcher_settings", { settings }),
  shouldShowCustomMessage: () => invoke<boolean>("should_show_custom_message"),

  // Launchers
  launchZoom: () => invoke<LaunchResult>("launch_zoom"),
  launchObs: () => invoke<LaunchResult>("launch_obs"),
  launchMediaManager: () => invoke<LaunchResult>("launch_media_manager"),

  // Attendance
  calculateAttendance: (poll: number[]) =>
    invoke<number>("calculate_attendance", { poll }),

  // Auto-launch
  autoLaunchEnabled: () => invoke<boolean>("auto_launch_enabled"),
  autoLaunchSet: (enabled: boolean) =>
    invoke<boolean>("auto_launch_set", { enabled }),

  // Onboarding
  onboardingNeeded: () => invoke<boolean>("onboarding_needed"),
  onboardingComplete: () => invoke<void>("onboarding_complete"),

  // Updates
  checkForUpdate: () => invoke<UpdateInfo>("check_for_update"),
  installUpdate: () => invoke<void>("install_update"),
  setUpdateChannel: (channel: UpdateChannel) =>
    invoke<void>("set_update_channel", { channel }),
  appVersion: () => invoke<string>("app_version"),

  // External
  openUrl: (url: string) => invoke<void>("open_url", { url }),

  // Logs
  openLogsDir: () => invoke<void>("open_logs_dir"),
  resetReturnInfo: () =>
    invoke<{ requires_restart: boolean }>("reset_return_info"),
};
