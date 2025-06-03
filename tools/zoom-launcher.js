const fs = require('fs');
const path = require('path');
const { app, ipcMain, shell } = require('electron');
const { exec } = require('child_process');

// Path for zoom configuration
const configPath = path.join(app.getPath('userData'), 'zoom-config.json');

// Function to read the Zoom configuration
function readZoomConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    }
  } catch (error) {
    console.error('Error reading Zoom config:', error);
  }
  return { zoomPath: '', meetingId: '' };
}

// Function to save the Zoom configuration
function saveZoomConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving Zoom config:', error);
    return false;
  }
}

// Get the default Zoom path based on the platform
function getDefaultZoomPath() {
  if (process.platform === 'darwin') {
    return '/Applications/zoom.us.app'; // macOS Zoom app bundle
  } else if (process.platform === 'win32') {
    return 'C:\\Program Files\\Zoom\\bin\\Zoom.exe';
  }
  return '';
}

// Launch Zoom with optional meeting ID
function launchZoom() {
  return new Promise((resolve, reject) => {
    const config = readZoomConfig();
    const zoomPath = config.zoomPath;
    const meetingId = config.meetingId;
    
    if (!zoomPath) {
      return resolve({ success: false, message: 'Zoom path not configured' });
    }

    const pathExists = () => {
      try {
        return fs.existsSync(zoomPath);
      } catch (error) {
        console.error('Error checking if Zoom path exists:', error);
        return false;
      }
    };

    if (!pathExists()) {
      return resolve({ success: false, message: 'Zoom application not found' });
    }

    try {
      if (process.platform === 'darwin') {
        // macOS: Launch Zoom app via 'open' command
        // If meeting ID is available, construct the meeting URL
        if (meetingId && meetingId.trim() !== '') {
          const zoomUrl = `zoommtg://zoom.us/join?confno=${meetingId}`;
          shell.openExternal(zoomUrl);
          resolve({ success: true, message: 'Zoom launched with meeting ID' });
        } else {
          exec(`open "${zoomPath}"`, (error) => {
            if (error) {
              console.error('Error launching Zoom:', error);
              resolve({ success: false, message: 'Failed to launch Zoom: ' + error.message });
            } else {
              resolve({ success: true, message: 'Zoom launched successfully' });
            }
          });
        }
      } else if (process.platform === 'win32') {
        // Windows: Launch Zoom executable with start command to avoid blocking
        const zoomDir = path.dirname(zoomPath);
        const zoomExe = path.basename(zoomPath);
        
        // Build command with start to run in background
        let command = `start /b /d "${zoomDir}" "" "${zoomExe}"`;
        if (meetingId && meetingId.trim() !== '') {
          command += ` --url="zoommtg://zoom.us/join?confno=${meetingId}"`;
        }
        
        exec(command, (error) => {
          if (error) {
            console.error('Error launching Zoom:', error);
            resolve({ success: false, message: 'Failed to launch Zoom: ' + error.message });
          } else {
            resolve({ success: true, message: 'Zoom launched successfully' });
          }
        });
      } else {
        resolve({ success: false, message: 'Unsupported platform' });
      }
    } catch (error) {
      console.error('Error launching Zoom:', error);
      resolve({ success: false, message: 'Failed to launch Zoom: ' + error.message });
    }
  });
}

// Initialize Zoom Launcher IPC handlers
function initZoomLauncher() {
  // Handle request to get the current Zoom path
  ipcMain.handle('get-zoom-path', async () => {
    const config = readZoomConfig();
    return config.zoomPath || '';
  });

  // Handle request to get the meeting ID
  ipcMain.handle('get-zoom-meeting-id', async () => {
    const config = readZoomConfig();
    return config.meetingId || '';
  });

  // Handle request to save the meeting ID
  ipcMain.handle('save-zoom-meeting-id', async (event, meetingId) => {
    const config = readZoomConfig();
    config.meetingId = meetingId;
    saveZoomConfig(config);
    return { success: true, message: 'Meeting ID saved successfully' };
  });
  
  // Handle request to browse for Zoom application
  ipcMain.handle('browse-for-zoom', async (event, mainWindow) => {
    const { dialog } = require('electron');
    const defaultPath = getDefaultZoomPath();
    const defaultDir = path.dirname(defaultPath);
    
    const filters = process.platform === 'darwin' 
      ? [{ name: 'Applications', extensions: ['app'] }]
      : [{ name: 'Executables', extensions: ['exe'] }];
    
    const result = await dialog.showOpenDialog({
      title: 'Select Zoom Application',
      defaultPath: fs.existsSync(defaultDir) ? defaultDir : app.getPath('home'),
      properties: ['openFile'],
      filters: filters
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      const zoomPath = result.filePaths[0];
      const config = readZoomConfig();
      config.zoomPath = zoomPath;
      saveZoomConfig(config);
      return zoomPath;
    }
    
    return null;
  });
  
  // Handle request to launch Zoom
  ipcMain.handle('launch-zoom', async () => {
    return await launchZoom();
  });
}

module.exports = {
  readZoomConfig,
  saveZoomConfig,
  getDefaultZoomPath,
  launchZoom,
  initZoomLauncher
};