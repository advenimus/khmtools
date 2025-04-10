/**
 * Tools Index - Exports all tools for easy importing in main.js
 */

const appSettings = require('./app-settings');
const zoomLauncher = require('./zoom-launcher');
const mediaLauncher = require('./media-launcher');
const zoomAttendance = require('./zoom-attendance');
const autoUpdater = require('./auto-updater');

/**
 * Initialize all tools
 * @param {BrowserWindow} mainWindow - The main application window
 */
function initializeAllTools(mainWindow) {
  // Initialize each tool
  appSettings.initAppSettings();
  zoomLauncher.initZoomLauncher();
  mediaLauncher.initMediaLauncher(mainWindow);
  zoomAttendance.initZoomAttendance();
  autoUpdater.initAutoUpdater(mainWindow);
  
  console.log('All tools initialized successfully');
}

module.exports = {
  appSettings,
  zoomLauncher,
  mediaLauncher,
  zoomAttendance,
  autoUpdater,
  initializeAllTools
};