const { app, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');

// Initialize auto-updater
function initAutoUpdater(mainWindow) {
  // Configure auto-updater
  autoUpdater.logger = require('electron-log');
  autoUpdater.logger.transports.file.level = 'info';

  // Set the GitHub repository details explicitly
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'advenimus',
    repo: 'khmtools'
  });
  
  autoUpdater.allowPrerelease = false;
  // Force update checks even in development mode
  autoUpdater.forceDevUpdateConfig = true;
  
  // Log what's happening
  console.log('App version:', app.getVersion());
  console.log('Checking for updates...');
  
  // Log the GitHub repository URL being used
  const repo = `https://github.com/advenimus/khmtools/releases`;
  console.log('Update repository:', repo);
  
  // Check for updates after a short delay to ensure window is ready
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify().catch(err => {
      console.error('Update check failed:', err);
    });
  }, 3000);

  // Setup auto-updater events
  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update-available', info);
  });

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send('update-downloaded', info);
  });

  autoUpdater.on('error', (err) => {
    mainWindow.webContents.send('update-error', err);
    console.error('Update error:', err);
  });

  // Install update when requested by renderer
  ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall();
  });
}

module.exports = {
  initAutoUpdater
};