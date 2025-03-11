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
  openExternal: (url) => shell.openExternal(url)
});