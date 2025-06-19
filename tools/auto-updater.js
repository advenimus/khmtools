const { app, ipcMain } = require('electron');

// Safely require electron-updater with fallback
let autoUpdater;
try {
  const updater = require('electron-updater');
  autoUpdater = updater.autoUpdater;
} catch (error) {
  console.warn('electron-updater not available:', error.message);
  autoUpdater = null;
}

// Initialize auto-updater
function initAutoUpdater(mainWindow) {
  // Check if auto-updater is available
  if (!autoUpdater) {
    console.warn('Auto-updater not available - skipping initialization');
    return;
  }

  // Configure auto-updater with enhanced logging
  const log = require('electron-log');
  autoUpdater.logger = log;
  autoUpdater.logger.transports.file.level = 'debug';
  
  // Log to both file and console for debugging
  log.info('Initializing auto-updater...');
  
  // Set the GitHub repository details explicitly
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'advenimus',
    repo: 'khmtools'
  });
  
  autoUpdater.allowPrerelease = false;
  autoUpdater.allowDowngrade = false;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  
  // Force update checks even in development mode for testing
  autoUpdater.forceDevUpdateConfig = true;
  
  // Log what's happening
  const currentVersion = app.getVersion();
  log.info('Current app version:', currentVersion);
  log.info('Update repository: https://github.com/advenimus/khmtools/releases');
  
  // Enhanced error handling for update checks
  const checkForUpdates = async () => {
    try {
      log.info('Starting update check...');
      const result = await autoUpdater.checkForUpdatesAndNotify();
      log.info('Update check result:', result);
    } catch (err) {
      log.error('Update check failed:', err);
      // Send error to renderer for user notification
      mainWindow.webContents.send('update-error', {
        message: 'Failed to check for updates',
        error: err.message,
        stack: err.stack
      });
    }
  };
  
  // Check for updates after a short delay to ensure window is ready
  setTimeout(checkForUpdates, 3000);

  // Setup auto-updater events with enhanced logging
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
  });

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info);
    mainWindow.webContents.send('update-available', info);
  });

  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available:', info);
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info);
    mainWindow.webContents.send('update-downloaded', info);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    log.info(`Download progress: ${Math.round(progressObj.percent)}%`);
  });

  autoUpdater.on('error', (err) => {
    log.error('Auto-updater error:', err);
    mainWindow.webContents.send('update-error', {
      message: err.message || 'Unknown auto-updater error',
      error: err.toString(),
      stack: err.stack
    });
  });

  // Install update when requested by renderer
  ipcMain.on('install-update', () => {
    if (!autoUpdater) {
      log.warn('Cannot install update - auto-updater not available');
      return;
    }
    log.info('Installing update and restarting...');
    autoUpdater.quitAndInstall();
  });

  // Manual update check for debugging
  ipcMain.handle('check-for-updates-manually', async () => {
    if (!autoUpdater) {
      return { success: false, error: 'Auto-updater not available' };
    }
    
    try {
      log.info('Manual update check requested');
      const result = await autoUpdater.checkForUpdatesAndNotify();
      return { success: true, result };
    } catch (err) {
      log.error('Manual update check failed:', err);
      return { success: false, error: err.message };
    }
  });
}

module.exports = {
  initAutoUpdater
};