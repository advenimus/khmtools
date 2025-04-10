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
      enabled: true,
      title: 'Display Custom Message',
      message: 'Welcome to the meeting!'
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
    return '/Applications/JWLibrary Media.app'; // macOS JW Media app bundle
  } else if (process.platform === 'win32') {
    // Default path for Windows (adjust as needed)
    return 'C:\\Program Files\\JWLibrary Media\\JWLibraryMedia.exe';
  }
  return '';
}

// Launch OBS function
function launchOBS() {
  return new Promise((resolve, reject) => {
    const config = readMediaConfig();
    const obsPath = config.obsPath;
    
    if (!obsPath) {
      return resolve({ success: false, message: 'OBS path not configured' });
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
        // Windows: Launch executable
        exec(`"${obsPath}"`, (error) => {
          if (error) {
            console.error('Error launching OBS:', error);
            resolve({ success: false, message: 'Failed to launch OBS: ' + error.message });
          } else {
            resolve({ success: true, message: 'OBS launched successfully' });
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
    const mediaManagerPath = config.mediaManagerPath;
    
    if (!mediaManagerPath) {
      return resolve({ success: false, message: 'Media Manager path not configured' });
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
        // Windows: Launch executable
        exec(`"${mediaManagerPath}"`, (error) => {
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
    const config = readMediaConfig();
    const mediaZoomPath = config.mediaZoomPath;
    
    if (!mediaZoomPath) {
      return resolve({ success: false, message: 'Media Zoom path not configured' });
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

    try {
      if (process.platform === 'darwin') {
        // macOS: Launch app via 'open' command
        exec(`open "${mediaZoomPath}"`, (error) => {
          if (error) {
            console.error('Error launching Media Zoom:', error);
            resolve({ success: false, message: 'Failed to launch Media Zoom: ' + error.message });
          } else {
            resolve({ success: true, message: 'Media Zoom launched successfully' });
          }
        });
      } else if (process.platform === 'win32') {
        // Windows: Launch executable
        exec(`"${mediaZoomPath}"`, (error) => {
          if (error) {
            console.error('Error launching Media Zoom:', error);
            resolve({ success: false, message: 'Failed to launch Media Zoom: ' + error.message });
          } else {
            resolve({ success: true, message: 'Media Zoom launched successfully' });
          }
        });
      } else {
        resolve({ success: false, message: 'Unsupported platform' });
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
    return config.obsPath || '';
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
    return config.mediaManagerPath || '';
  });

  // Handle request to browse for Media Manager
  ipcMain.handle('browse-for-media-manager', async () => {
    const defaultPath = getDefaultMediaManagerPath();
    const defaultDir = path.dirname(defaultPath);
    
    const filters = process.platform === 'darwin' 
      ? [{ name: 'Applications', extensions: ['app'] }]
      : [{ name: 'Executables', extensions: ['exe'] }];
    
    const result = await dialog.showOpenDialog({
      title: 'Select JW Library Media Application',
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

  // Handle request to get Media Zoom path
  ipcMain.handle('get-media-zoom-path', async () => {
    const config = readMediaConfig();
    return config.mediaZoomPath || '';
  });

  // Handle request to browse for Media Zoom
  ipcMain.handle('browse-for-media-zoom', async () => {
    const defaultPath = '';
    const defaultDir = app.getPath('home');
    
    const filters = process.platform === 'darwin' 
      ? [{ name: 'Applications', extensions: ['app'] }]
      : [{ name: 'Executables', extensions: ['exe'] }];
    
    const result = await dialog.showOpenDialog({
      title: 'Select Media Zoom Application',
      defaultPath: defaultDir,
      properties: ['openFile'],
      filters: filters
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      const mediaZoomPath = result.filePaths[0];
      const config = readMediaConfig();
      config.mediaZoomPath = mediaZoomPath;
      saveMediaConfig(config);
      return mediaZoomPath;
    }
    
    return null;
  });

  // Handle request to get custom message settings
  ipcMain.handle('get-custom-message-settings', async () => {
    const config = readMediaConfig();
    return config.customMessageSettings || { enabled: true, title: 'Display Custom Message', message: 'Welcome to the meeting!' };
  });

  // Handle request to save custom message settings
  ipcMain.handle('save-custom-message-settings', async (event, settings) => {
    const config = readMediaConfig();
    config.customMessageSettings = settings;
    saveMediaConfig(config);
    return { success: true, message: 'Custom message settings saved successfully' };
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