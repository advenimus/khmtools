const fs = require('fs');
const path = require('path');
const { app, ipcMain } = require('electron');

// Path for universal settings configuration
const universalConfigPath = path.join(app.getPath('userData'), 'universal-settings.json');

// Function to read the universal settings configuration
function readUniversalSettings() {
  try {
    if (fs.existsSync(universalConfigPath)) {
      const configData = fs.readFileSync(universalConfigPath, 'utf8');
      return JSON.parse(configData);
    }
  } catch (error) {
    console.error('Error reading universal settings:', error);
  }
  return getDefaultUniversalSettings();
}

// Function to get default universal settings
function getDefaultUniversalSettings() {
  return {
    meetingId: '',
    meetingSchedule: {
      midweek: {
        day: 'tuesday',
        time: '19:30'
      },
      weekend: {
        day: 'sunday', 
        time: '10:00'
      }
    }
  };
}

// Function to save the universal settings configuration
function saveUniversalSettings(config) {
  try {
    fs.writeFileSync(universalConfigPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving universal settings:', error);
    return false;
  }
}

// Initialize Universal Settings IPC handlers
function initUniversalSettings() {
  // Handle request to get universal settings
  ipcMain.handle('get-universal-settings', async () => {
    return readUniversalSettings();
  });

  // Handle request to save universal settings
  ipcMain.handle('save-universal-settings', async (event, settings) => {
    const success = saveUniversalSettings(settings);
    return { success, message: success ? 'Universal settings saved successfully' : 'Failed to save universal settings' };
  });

  // Handle request to get universal meeting ID
  ipcMain.handle('get-universal-meeting-id', async () => {
    const settings = readUniversalSettings();
    return settings.meetingId || '';
  });

  // Handle request to save universal meeting ID
  ipcMain.handle('save-universal-meeting-id', async (event, meetingId) => {
    const settings = readUniversalSettings();
    settings.meetingId = meetingId;
    const success = saveUniversalSettings(settings);
    return { success, message: success ? 'Meeting ID saved successfully' : 'Failed to save meeting ID' };
  });

  // Handle request to get meeting schedule
  ipcMain.handle('get-meeting-schedule', async () => {
    const settings = readUniversalSettings();
    return settings.meetingSchedule || getDefaultUniversalSettings().meetingSchedule;
  });

  // Handle request to save meeting schedule
  ipcMain.handle('save-meeting-schedule', async (event, schedule) => {
    const settings = readUniversalSettings();
    settings.meetingSchedule = schedule;
    const success = saveUniversalSettings(settings);
    return { success, message: success ? 'Meeting schedule saved successfully' : 'Failed to save meeting schedule' };
  });
}

module.exports = {
  readUniversalSettings,
  saveUniversalSettings,
  getDefaultUniversalSettings,
  initUniversalSettings
};