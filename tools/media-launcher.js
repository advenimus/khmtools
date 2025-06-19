const fs = require('fs');
const path = require('path');
const { app, ipcMain } = require('electron');
const { exec } = require('child_process');

// Path for media configuration
const mediaConfigPath = path.join(app.getPath('userData'), 'media-config.json');

// Function to read the media configuration
function readMediaConfig() {
  try {
    if (fs.existsSync(mediaConfigPath)) {
      const configData = fs.readFileSync(mediaConfigPath, 'utf8');
      return JSON.parse(configData);
    }
  } catch (error) {
    console.error('Error reading media config:', error);
  }
  return { 
    obsPath: '',
    mediaManagerPath: '',
    mediaZoomPath: '',
    customMessageSettings: {
      enabled: false,
      displayWhen: 'none', // 'always', 'weekend', 'none'
      title: 'Display Custom Message',
      message: 'Welcome to the meeting!',
      displayTime: 5
    },
    toolToggles: {
      customMessage: false,
      launchOBS: true,
      launchMediaManager: true,
      launchZoom: true
    }
  };
}

// Function to save the media configuration
function saveMediaConfig(config) {
  try {
    fs.writeFileSync(mediaConfigPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving media config:', error);
    return false;
  }
}

// Get the default OBS path based on the platform
function getDefaultOBSPath() {
  if (process.platform === 'darwin') {
    return '/Applications/OBS.app'; // macOS OBS app bundle
  } else if (process.platform === 'win32') {
    return 'C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe';
  }
  return '';
}

// Get the default Media Manager path based on the platform
function getDefaultMediaManagerPath() {
  if (process.platform === 'darwin') {
    return '/Applications/Meeting Media Manager.app'; // macOS Meeting Media Manager app bundle
  } else if (process.platform === 'win32') {
    // Default path for Windows (adjust as needed)
    return 'C:\\Program Files\\Meeting Media Manager\\Meeting Media Manager.exe';
  }
  return '';
}

// Check if today is a weekend meeting day
function isWeekendMeetingDay() {
  const { readUniversalSettings } = require('./universal-settings');
  const universalSettings = readUniversalSettings();
  
  if (!universalSettings.meetingSchedule || !universalSettings.meetingSchedule.weekend) {
    return false;
  }
  
  const today = new Date();
  const todayDay = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const weekendDay = universalSettings.meetingSchedule.weekend.day.toLowerCase();
  
  return todayDay === weekendDay;
}

// Determine if custom message should be shown based on settings
function shouldShowCustomMessage() {
  const config = readMediaConfig();
  const customSettings = config.customMessageSettings;
  
  if (!customSettings || customSettings.displayWhen === 'none') {
    return false;
  }
  
  if (customSettings.displayWhen === 'always') {
    return true;
  }
  
  if (customSettings.displayWhen === 'weekend') {
    return isWeekendMeetingDay();
  }
  
  return false;
}

// Launch OBS function
function launchOBS() {
  return new Promise((resolve, reject) => {
    const config = readMediaConfig();
    const obsPath = config.obsPath || getDefaultOBSPath();
    
    if (!obsPath) {
      return resolve({ success: false, message: 'OBS application not found. Please install OBS Studio or configure the path manually in settings.' });
    }

    // Check if path exists
    const pathExists = () => {
      try {
        return fs.existsSync(obsPath);
      } catch (error) {
        console.error('Error checking if OBS path exists:', error);
        return false;
      }
    };

    if (!pathExists()) {
      return resolve({ success: false, message: 'OBS application not found' });
    }

    try {
      if (process.platform === 'darwin') {
        // macOS: Launch app via 'open' command
        exec(`open "${obsPath}"`, (error) => {
          if (error) {
            console.error('Error launching OBS:', error);
            resolve({ success: false, message: 'Failed to launch OBS: ' + error.message });
          } else {
            resolve({ success: true, message: 'OBS launched successfully' });
          }
        });
      } else if (process.platform === 'win32') {
        // Windows: Launch executable with start command and virtual camera flag
        const obsDir = path.dirname(obsPath);
        const obsExe = path.basename(obsPath);
        exec(`start /d "${obsDir}" "" ${obsExe} --startvirtualcam`, (error) => {
          if (error) {
            console.error('Error launching OBS:', error);
            resolve({ success: false, message: 'Failed to launch OBS: ' + error.message });
          } else {
            resolve({ success: true, message: 'OBS launched successfully with virtual camera' });
          }
        });
      } else {
        resolve({ success: false, message: 'Unsupported platform' });
      }
    } catch (error) {
      console.error('Error launching OBS:', error);
      resolve({ success: false, message: 'Failed to launch OBS: ' + error.message });
    }
  });
}

// Launch Media Manager function
function launchMediaManager() {
  return new Promise((resolve, reject) => {
    const config = readMediaConfig();
    const mediaManagerPath = config.mediaManagerPath || getDefaultMediaManagerPath();
    
    if (!mediaManagerPath) {
      return resolve({ success: false, message: 'Meeting Media Manager not found. Please install Meeting Media Manager or configure the path manually in settings.' });
    }

    // Check if path exists
    const pathExists = () => {
      try {
        return fs.existsSync(mediaManagerPath);
      } catch (error) {
        console.error('Error checking if Media Manager path exists:', error);
        return false;
      }
    };

    if (!pathExists()) {
      return resolve({ success: false, message: 'Media Manager application not found' });
    }

    try {
      if (process.platform === 'darwin') {
        // macOS: Launch app via 'open' command
        exec(`open "${mediaManagerPath}"`, (error) => {
          if (error) {
            console.error('Error launching Media Manager:', error);
            resolve({ success: false, message: 'Failed to launch Media Manager: ' + error.message });
          } else {
            resolve({ success: true, message: 'Media Manager launched successfully' });
          }
        });
      } else if (process.platform === 'win32') {
        // Windows: Launch executable with start command to avoid blocking
        const mediaManagerDir = path.dirname(mediaManagerPath);
        const mediaManagerExe = path.basename(mediaManagerPath);
        
        // Use start command with /b flag to run in background without waiting
        exec(`start /b /d "${mediaManagerDir}" "" "${mediaManagerExe}"`, (error) => {
          if (error) {
            console.error('Error launching Media Manager:', error);
            resolve({ success: false, message: 'Failed to launch Media Manager: ' + error.message });
          } else {
            resolve({ success: true, message: 'Media Manager launched successfully' });
          }
        });
      } else {
        resolve({ success: false, message: 'Unsupported platform' });
      }
    } catch (error) {
      console.error('Error launching Media Manager:', error);
      resolve({ success: false, message: 'Failed to launch Media Manager: ' + error.message });
    }
  });
}

// Launch Media Zoom function
function launchMediaZoom() {
  return new Promise((resolve, reject) => {
    // Use the same Zoom path as the zoom-launcher tool
    const { readZoomConfig, getDefaultZoomPath } = require('./zoom-launcher');
    const zoomConfig = readZoomConfig();
    const mediaZoomPath = zoomConfig.zoomPath || getDefaultZoomPath();
    
    // Get meeting ID from universal settings
    const { readUniversalSettings } = require('./universal-settings');
    const universalSettings = readUniversalSettings();
    const meetingId = universalSettings.meetingId;
    
    if (!mediaZoomPath) {
      return resolve({ success: false, message: 'Zoom application path not configured and no default found' });
    }

    // Check if path exists
    const pathExists = () => {
      try {
        return fs.existsSync(mediaZoomPath);
      } catch (error) {
        console.error('Error checking if Media Zoom path exists:', error);
        return false;
      }
    };

    if (!pathExists()) {
      return resolve({ success: false, message: 'Media Zoom application not found' });
    }

    // Function to launch Zoom meeting using hidden browser window
    const launchWithHiddenWindow = (meetingId) => {
      const { BrowserWindow } = require('electron');
      
      // Use the standard Zoom HTTP URL
      const zoomUrl = `https://zoom.us/j/${meetingId}`;
      
      try {
        // Create a hidden browser window to navigate to Zoom URL
        const hiddenWindow = new BrowserWindow({
          show: false,
          width: 1,
          height: 1,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
          }
        });

        // Navigate to the Zoom URL
        hiddenWindow.loadURL(zoomUrl);
        
        // Wait a bit for the page to load and trigger the app launch
        setTimeout(() => {
          // Close the hidden window after a delay
          if (!hiddenWindow.isDestroyed()) {
            hiddenWindow.close();
          }
        }, 3000); // 3 second delay to allow Zoom redirect to process

        console.log(`Launching Zoom meeting silently with URL: ${zoomUrl}`);
        return true;
      } catch (error) {
        console.error('Error launching Zoom with hidden window:', error);
        return false;
      }
    };

    try {
      if (meetingId && meetingId.trim() !== '') {
        // Clean the meeting ID (remove spaces, dashes, etc.)
        const cleanMeetingId = meetingId.replace(/[^0-9]/g, '');
        
        if (cleanMeetingId.length >= 9) { // Valid Zoom meeting IDs are at least 9 digits
          if (launchWithHiddenWindow(cleanMeetingId)) {
            resolve({ 
              success: true, 
              message: `Zoom meeting launched with ID ${cleanMeetingId}. The Zoom app should open shortly. If you're the host and signed in, you can start the meeting.` 
            });
          } else {
            // Fallback: Just open Zoom app
            if (process.platform === 'darwin') {
              exec(`open "${mediaZoomPath}"`, (error) => {
                if (error) {
                  resolve({ success: false, message: 'Failed to launch Zoom: ' + error.message });
                } else {
                  resolve({ success: true, message: `Zoom launched. Please manually start meeting ${meetingId}.` });
                }
              });
            } else if (process.platform === 'win32') {
              const mediaZoomDir = path.dirname(mediaZoomPath);
              const mediaZoomExe = path.basename(mediaZoomPath);
              const command = `start /b /d "${mediaZoomDir}" "" "${mediaZoomExe}"`;
              exec(command, (error) => {
                if (error) {
                  resolve({ success: false, message: 'Failed to launch Zoom: ' + error.message });
                } else {
                  resolve({ success: true, message: `Zoom launched. Please manually start meeting ${meetingId}.` });
                }
              });
            }
          }
        } else {
          resolve({ success: false, message: `Invalid meeting ID format: ${meetingId}. Please enter a valid meeting ID (at least 9 digits).` });
        }
      } else {
        // No meeting ID, just open Zoom app
        if (process.platform === 'darwin') {
          exec(`open "${mediaZoomPath}"`, (error) => {
            if (error) {
              resolve({ success: false, message: 'Failed to launch Zoom: ' + error.message });
            } else {
              resolve({ success: true, message: 'Zoom launched successfully' });
            }
          });
        } else if (process.platform === 'win32') {
          const mediaZoomDir = path.dirname(mediaZoomPath);
          const mediaZoomExe = path.basename(mediaZoomPath);
          const command = `start /b /d "${mediaZoomDir}" "" "${mediaZoomExe}"`;
          exec(command, (error) => {
            if (error) {
              resolve({ success: false, message: 'Failed to launch Zoom: ' + error.message });
            } else {
              resolve({ success: true, message: 'Zoom launched successfully' });
            }
          });
        } else {
          resolve({ success: false, message: 'Unsupported platform' });
        }
      }
    } catch (error) {
      console.error('Error launching Media Zoom:', error);
      resolve({ success: false, message: 'Failed to launch Media Zoom: ' + error.message });
    }
  });
}

// Initialize Media Launcher IPC handlers
function initMediaLauncher(mainWindow) {
  const { dialog } = require('electron');
  
  // Handle request to launch OBS
  ipcMain.handle('launch-obs', async () => {
    return await launchOBS();
  });

  // Handle request to get OBS path
  ipcMain.handle('get-obs-path', async () => {
    const config = readMediaConfig();
    return config.obsPath || getDefaultOBSPath();
  });

  // Handle request to browse for OBS
  ipcMain.handle('browse-for-obs', async () => {
    const defaultPath = getDefaultOBSPath();
    const defaultDir = path.dirname(defaultPath);
    
    const filters = process.platform === 'darwin' 
      ? [{ name: 'Applications', extensions: ['app'] }]
      : [{ name: 'Executables', extensions: ['exe'] }];
    
    const result = await dialog.showOpenDialog({
      title: 'Select OBS Application',
      defaultPath: fs.existsSync(defaultDir) ? defaultDir : app.getPath('home'),
      properties: ['openFile'],
      filters: filters
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      const obsPath = result.filePaths[0];
      const config = readMediaConfig();
      config.obsPath = obsPath;
      saveMediaConfig(config);
      return obsPath;
    }
    
    return null;
  });

  // Handle request to launch Media Manager
  ipcMain.handle('launch-media-manager', async () => {
    return await launchMediaManager();
  });

  // Handle request to get Media Manager path
  ipcMain.handle('get-media-manager-path', async () => {
    const config = readMediaConfig();
    return config.mediaManagerPath || getDefaultMediaManagerPath();
  });

  // Handle request to browse for Media Manager
  ipcMain.handle('browse-for-media-manager', async () => {
    const defaultPath = getDefaultMediaManagerPath();
    const defaultDir = path.dirname(defaultPath);
    
    const filters = process.platform === 'darwin' 
      ? [{ name: 'Applications', extensions: ['app'] }]
      : [{ name: 'Executables', extensions: ['exe'] }];
    
    const result = await dialog.showOpenDialog({
      title: 'Select Meeting Media Manager Application',
      defaultPath: fs.existsSync(defaultDir) ? defaultDir : app.getPath('home'),
      properties: ['openFile'],
      filters: filters
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      const mediaManagerPath = result.filePaths[0];
      const config = readMediaConfig();
      config.mediaManagerPath = mediaManagerPath;
      saveMediaConfig(config);
      return mediaManagerPath;
    }
    
    return null;
  });

  // Handle request to launch Media Zoom
  ipcMain.handle('launch-media-zoom', async () => {
    return await launchMediaZoom();
  });

  // Media Zoom now uses the same path as zoom-launcher tool

  // Handle request to get custom message settings
  ipcMain.handle('get-custom-message-settings', async () => {
    const config = readMediaConfig();
    return config.customMessageSettings || { 
      enabled: false, 
      displayWhen: 'none',
      title: 'Display Custom Message', 
      message: 'Welcome to the meeting!',
      displayTime: 5
    };
  });

  // Handle request to save custom message settings
  ipcMain.handle('save-custom-message-settings', async (event, settings) => {
    const config = readMediaConfig();
    config.customMessageSettings = settings;
    saveMediaConfig(config);
    return { success: true, message: 'Custom message settings saved successfully' };
  });

  // Handle request to get tool toggles
  ipcMain.handle('get-tool-toggles', async () => {
    const config = readMediaConfig();
    return config.toolToggles || { customMessage: false, launchOBS: true, launchMediaManager: true, launchZoom: true };
  });

  // Handle request to save tool toggles
  ipcMain.handle('save-tool-toggles', async (event, toggles) => {
    const config = readMediaConfig();
    config.toolToggles = toggles;
    saveMediaConfig(config);
    return { success: true, message: 'Tool toggles saved successfully' };
  });
  
  // Handle request to check if custom message should be shown
  ipcMain.handle('should-show-custom-message', async () => {
    return shouldShowCustomMessage();
  });

}

module.exports = {
  readMediaConfig,
  saveMediaConfig,
  getDefaultOBSPath,
  getDefaultMediaManagerPath,
  launchOBS,
  launchMediaManager,
  launchMediaZoom,
  initMediaLauncher
};