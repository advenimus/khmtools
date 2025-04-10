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
  
  // Media Launcher functions
  launchOBS: () => ipcRenderer.invoke('launch-obs'),
  getOBSPath: () => ipcRenderer.invoke('get-obs-path'),
  browseForOBS: () => ipcRenderer.invoke('browse-for-obs'),
  launchMediaManager: () => ipcRenderer.invoke('launch-media-manager'),
  getMediaManagerPath: () => ipcRenderer.invoke('get-media-manager-path'),
  browseForMediaManager: () => ipcRenderer.invoke('browse-for-media-manager'),
  getMediaZoomPath: () => ipcRenderer.invoke('get-media-zoom-path'),
  browseForMediaZoom: () => ipcRenderer.invoke('browse-for-media-zoom'),
  launchMediaZoom: () => ipcRenderer.invoke('launch-media-zoom'),
  getCustomMessageSettings: () => ipcRenderer.invoke('get-custom-message-settings'),
  saveCustomMessageSettings: (settings) => ipcRenderer.invoke('save-custom-message-settings', settings),
  getPlatform: () => process.platform
});