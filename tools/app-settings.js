const fs = require('fs');
const path = require('path');
const { app, ipcMain } = require('electron');

// Path for app settings
const appSettingsPath = path.join(app.getPath('userData'), 'app-settings.json');

// Function to read app settings
function readAppSettings() {
  try {
    if (fs.existsSync(appSettingsPath)) {
      const settingsData = fs.readFileSync(appSettingsPath, 'utf8');
      return JSON.parse(settingsData);
    }
  } catch (error) {
    console.error('Error reading app settings:', error);
  }
  return { alwaysMaximize: false, defaultTool: 'welcome-screen', runAtLogon: false };
}

// Function to save app settings
function saveAppSettings(settings) {
  try {
    fs.writeFileSync(appSettingsPath, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving app settings:', error);
    return false;
  }
}

// Reset all settings to defaults
function resetAllSettings() {
  try {
    // Clear app settings
    saveAppSettings({ alwaysMaximize: false, defaultTool: 'welcome-screen', runAtLogon: false });
    
    // Disable auto-launch when resetting
    const { AutoLaunch } = require('./auto-launch');
    AutoLaunch.disable();
    
    // Add code to reset other tool settings if needed
    // This could call reset functions from other modules
    
    return { success: true, message: 'All settings reset successfully' };
  } catch (error) {
    console.error('Error resetting settings:', error);
    return { success: false, message: 'Failed to reset settings' };
  }
}

// Initialize app settings IPC handlers
function initAppSettings() {
  // Handle request to get app settings
  ipcMain.handle('get-app-settings', async () => {
    return readAppSettings();
  });

  // Handle request to save app settings
  ipcMain.handle('save-app-settings', async (event, settings) => {
    const success = saveAppSettings(settings);
    return { success, message: success ? 'Settings saved successfully' : 'Failed to save settings' };
  });

  // Handle request to reset all settings
  ipcMain.handle('reset-all-settings', async () => {
    return resetAllSettings();
  });
}

module.exports = {
  readAppSettings,
  saveAppSettings,
  resetAllSettings,
  initAppSettings
};