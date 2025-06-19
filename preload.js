// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type]);
  }
});

// Expose ipcRenderer to the renderer process
const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  calculateAttendance: (pollResults) => ipcRenderer.send('calculate-attendance', pollResults),
  onAttendanceCalculated: (callback) => ipcRenderer.on('attendance-calculated', (_, value) => callback(value)),
  
  // Auto-update functions
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (_, info) => callback(info)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (_, info) => callback(info)),
  onUpdateError: (callback) => ipcRenderer.on('update-error', (_, err) => callback(err)),
  installUpdate: () => ipcRenderer.send('install-update'),
  onOpenDefaultTool: (callback) => ipcRenderer.on('open-default-tool', (_, toolId) => callback(toolId)),
  openExternal: (url) => shell.openExternal(url),
  
  // Zoom launcher functions
  getZoomPath: () => ipcRenderer.invoke('get-zoom-path'),
  browseForZoom: () => ipcRenderer.invoke('browse-for-zoom'),
  launchZoom: () => ipcRenderer.invoke('launch-zoom'),
  getZoomMeetingId: () => ipcRenderer.invoke('get-zoom-meeting-id'),
  saveZoomMeetingId: (meetingId) => ipcRenderer.invoke('save-zoom-meeting-id', meetingId),
  
  // App settings functions
  saveAppSettings: (settings) => ipcRenderer.invoke('save-app-settings', settings),
  getAppSettings: () => ipcRenderer.invoke('get-app-settings'),
  resetAllSettings: () => ipcRenderer.invoke('reset-all-settings'),
  
  // Developer tools
  toggleDevTools: () => ipcRenderer.invoke('toggle-dev-tools'),
  
  // Auto-launch functions
  autoLaunchEnable: () => ipcRenderer.invoke('auto-launch-enable'),
  autoLaunchDisable: () => ipcRenderer.invoke('auto-launch-disable'),
  autoLaunchIsEnabled: () => ipcRenderer.invoke('auto-launch-is-enabled'),
  autoLaunchSet: (enabled) => ipcRenderer.invoke('auto-launch-set', enabled),
  
  // Media Launcher functions
  launchOBS: () => ipcRenderer.invoke('launch-obs'),
  getOBSPath: () => ipcRenderer.invoke('get-obs-path'),
  browseForOBS: () => ipcRenderer.invoke('browse-for-obs'),
  launchMediaManager: () => ipcRenderer.invoke('launch-media-manager'),
  getMediaManagerPath: () => ipcRenderer.invoke('get-media-manager-path'),
  browseForMediaManager: () => ipcRenderer.invoke('browse-for-media-manager'),
  // Media Zoom now uses the same path as zoom-launcher
  launchMediaZoom: () => ipcRenderer.invoke('launch-media-zoom'),
  getCustomMessageSettings: () => ipcRenderer.invoke('get-custom-message-settings'),
  saveCustomMessageSettings: (settings) => ipcRenderer.invoke('save-custom-message-settings', settings),
  getToolToggles: () => ipcRenderer.invoke('get-tool-toggles'),
  saveToolToggles: (toggles) => ipcRenderer.invoke('save-tool-toggles', toggles),
  shouldShowCustomMessage: () => ipcRenderer.invoke('should-show-custom-message'),
  getMeetingId: () => ipcRenderer.invoke('get-meeting-id'),
  saveMeetingId: (meetingId) => ipcRenderer.invoke('save-meeting-id', meetingId),
  
  // Universal settings functions
  getUniversalSettings: () => ipcRenderer.invoke('get-universal-settings'),
  saveUniversalSettings: (settings) => ipcRenderer.invoke('save-universal-settings', settings),
  getUniversalMeetingId: () => ipcRenderer.invoke('get-universal-meeting-id'),
  saveUniversalMeetingId: (meetingId) => ipcRenderer.invoke('save-universal-meeting-id', meetingId),
  getMeetingSchedule: () => ipcRenderer.invoke('get-meeting-schedule'),
  saveMeetingSchedule: (schedule) => ipcRenderer.invoke('save-meeting-schedule', schedule),
  
  getPlatform: () => process.platform,
  
  // Console redirection
  onConsoleMessage: (callback) => ipcRenderer.on('console-message', (_, data) => callback(data)),
  
  // Onboarding functions
  onboardingCheckFirstLaunch: () => ipcRenderer.invoke('onboarding-check-first-launch'),
  onboardingApplySettings: (settings) => ipcRenderer.invoke('onboarding-apply-settings', settings),
  onboardingCheckPaths: (settings) => ipcRenderer.invoke('onboarding-check-paths', settings),
  onboardingBrowsePath: (appName) => ipcRenderer.invoke('onboarding-browse-path', appName),
  onboardingSavePath: (appName, appPath) => ipcRenderer.invoke('onboarding-save-path', appName, appPath)
});