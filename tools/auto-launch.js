const { app, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

class AutoLaunch {
  static init() {
    // Handle IPC requests for auto-launch functionality
    ipcMain.handle('auto-launch-enable', () => this.enable());
    ipcMain.handle('auto-launch-disable', () => this.disable());
    ipcMain.handle('auto-launch-is-enabled', () => this.isEnabled());
    ipcMain.handle('auto-launch-set', (event, enabled) => this.set(enabled));
  }

  static enable() {
    return this.set(true);
  }

  static disable() {
    return this.set(false);
  }

  static set(enabled) {
    try {
      if (process.platform === 'win32') {
        // Check if we're using a packaged app with updater
        const appFolder = path.dirname(process.execPath);
        const exeName = path.basename(process.execPath);
        const updateExe = path.resolve(appFolder, '..', 'Update.exe');
        
        // Check if Update.exe exists (Squirrel installer)
        if (fs.existsSync(updateExe)) {
          app.setLoginItemSettings({
            openAtLogin: enabled,
            path: updateExe,
            args: enabled ? ['--processStart', `"${exeName}"`] : undefined
          });
        } else {
          // Direct executable (development or portable)
          app.setLoginItemSettings({
            openAtLogin: enabled,
            path: enabled ? app.getPath('exe') : undefined
          });
        }
      } else {
        // macOS and Linux
        app.setLoginItemSettings({
          openAtLogin: enabled
        });
      }
      
      console.log(`Auto-launch ${enabled ? 'enabled' : 'disabled'}`);
      return { success: true, enabled };
    } catch (error) {
      console.error('Failed to set auto-launch:', error);
      return { success: false, error: error.message };
    }
  }

  static isEnabled() {
    try {
      const settings = app.getLoginItemSettings();
      return {
        success: true,
        enabled: settings.openAtLogin,
        wasOpenedAtLogin: settings.wasOpenedAtLogin || false
      };
    } catch (error) {
      console.error('Failed to check auto-launch status:', error);
      return { success: false, error: error.message, enabled: false };
    }
  }
}

module.exports = { AutoLaunch };