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
    const userDataPath = app.getPath('userData');
    
    // List of all settings files to delete
    const settingsFiles = [
      'app-settings.json',
      'zoom-config.json',
      'media-config.json',
      'universal-settings.json',
      '.onboarding-complete'
    ];
    
    // Delete all settings files
    settingsFiles.forEach(file => {
      const filePath = path.join(userDataPath, file);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted ${file}`);
        } catch (error) {
          console.error(`Error deleting ${file}:`, error);
        }
      }
    });
    
    // Disable auto-launch when resetting
    const { AutoLaunch } = require('./auto-launch');
    AutoLaunch.disable();
    
    // Reset onboarding status
    const { resetOnboardingStatus } = require('./onboarding');
    resetOnboardingStatus();
    
    return { success: true, message: 'All settings reset successfully', requiresRestart: true };
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