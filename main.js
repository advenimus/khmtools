const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');
const { exec } = require('child_process');

// Keep a global reference of the window object to prevent it from being garbage collected
let mainWindow;

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
  return { alwaysMaximize: false, defaultTool: 'welcome-screen' };
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

function createWindow() {
  // Get app settings
  const appSettings = readAppSettings();
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    icon: path.join(__dirname, 'assets/jw-tools-icon.png'),
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    // Hide menu bar on Windows, keep it on macOS
    autoHideMenuBar: process.platform !== 'darwin',
    resizable: true, 
    show: false,
    backgroundColor: '#f5f5f5',
    title: 'JW Tools',
    fullscreenable: true,
    center: true,
    center: true
  });

  // Load the index.html of the app
  mainWindow.loadFile('index.html');

  // Open DevTools only in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment) {
    mainWindow.webContents.openDevTools();
  }
  
  // Remove menu completely on Windows and other non-macOS platforms
  const removeWindowsMenu = () => {
    if (process.platform !== 'darwin') {
      console.log('Removing menu bar on Windows platform');
      // Set application menu to null
      Menu.setApplicationMenu(null);
      
      // Force remove menu bar with additional methods
      mainWindow.removeMenu();
      mainWindow.setMenu(null);
      mainWindow.setMenuBarVisibility(false);
    }
  };
  
  // Remove menu immediately
  removeWindowsMenu();
  
  // Also remove menu when window is ready to show (to ensure it's removed in production)
  mainWindow.once('ready-to-show', () => {
    // Remove menu again to ensure it's gone in production
    removeWindowsMenu();
    mainWindow.show();
    
    // Maximize window if setting is enabled
    if (appSettings.alwaysMaximize) {
      console.log('Opening window maximized based on user settings');
      mainWindow.maximize();
    }
    
    // Open the default tool if specified
    if (appSettings.defaultTool && appSettings.defaultTool !== 'welcome-screen') {
      console.log('Opening default tool:', appSettings.defaultTool);
      // Send a message to the renderer to open the default tool
      mainWindow.webContents.send('open-default-tool', appSettings.defaultTool);
    }
  });

  // Emitted when the window is closed
  mainWindow.on('closed', function () {
    // Dereference the window object
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();
  
  // Configure auto-updater
  autoUpdater.logger = require('electron-log');
  autoUpdater.logger.transports.file.level = 'info';

  // Set the GitHub repository details explicitly
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'advenimus',
    repo: 'jwtools'
  });
  
  autoUpdater.allowPrerelease = false;
  // Force update checks even in development mode
  autoUpdater.forceDevUpdateConfig = true;
  
  // Log what's happening
  console.log('App version:', app.getVersion());
  console.log('Checking for updates...');
  
  // Log the GitHub repository URL being used
  const repo = `https://github.com/advenimus/jwtools/releases`;
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

  // Zoom launcher functionality
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
    return { zoomPath: '' };
  }
  
  // Function to save the Zoom configuration
  function saveZoomConfig(config) {
    try {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Error saving Zoom config:', error);
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
  
  // Handle request to get the current Zoom path
  ipcMain.handle('get-zoom-path', async () => {
    const config = readZoomConfig();
    return config.zoomPath || '';
  });
  
  // Handle request to browse for Zoom application
  ipcMain.handle('browse-for-zoom', async () => {
    const defaultPath = getDefaultZoomPath();
    const defaultDir = path.dirname(defaultPath);
    
    const filters = process.platform === 'darwin' 
      ? [{ name: 'Applications', extensions: ['app'] }]
      : [{ name: 'Executables', extensions: ['exe'] }];
    
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Zoom Application',
      defaultPath: fs.existsSync(defaultDir) ? defaultDir : app.getPath('home'),
      properties: ['openFile'],
      filters: filters
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      const zoomPath = result.filePaths[0];
      saveZoomConfig({ zoomPath });
      return zoomPath;
    }
    
    return null;
  });
  
  // Handle request to launch Zoom
  ipcMain.handle('launch-zoom', async () => {
    const config = readZoomConfig();
    let zoomPath = config.zoomPath;
    
    if (!zoomPath || !fs.existsSync(zoomPath)) {
      // Open dialog to browse for Zoom
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select Zoom Application',
        defaultPath: getDefaultZoomPath(),
        properties: ['openFile']
      });
      if (result.canceled || result.filePaths.length === 0) return { success: false, message: 'Zoom path not selected' };
      zoomPath = result.filePaths[0];
      saveZoomConfig({ zoomPath });
    }
    
    // Platform-specific launch command
    let launchCommand;
    if (process.platform === 'darwin') {
      // On macOS, use the 'open' command to launch app bundles
      launchCommand = `open "${zoomPath}"`;
    } else {
      // On Windows, directly execute the .exe file
      launchCommand = `"${zoomPath}"`;
    }
    
    exec(launchCommand, (error) => {
      if (error) {
        console.error('Error launching Zoom:', error);
        return { success: false, message: `Error launching Zoom: ${error.message}` };
      }
    });
    return { success: true, message: 'Zoom launched successfully' };
  });
  
  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open
    if (mainWindow === null) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Handle IPC messages from renderer process
ipcMain.on('calculate-attendance', (event, pollResults) => {
  let total = 0;
  
  // Calculate total attendance
  for (let i = 0; i < pollResults.length; i++) {
    // For options 1-10, multiply count by its value
    if (i < 10) {
      total += pollResults[i] * (i + 1);
    } else {
      // For phone option (11th option), count as 1 person each
      total += pollResults[i];
    }
  }
  
  // Send the result back to the renderer process
  event.reply('attendance-calculated', total);
});

// Handle app settings
ipcMain.handle('save-app-settings', async (event, settings) => {
  const success = saveAppSettings(settings);
  return { success };
});

ipcMain.handle('get-app-settings', async () => {
  return readAppSettings();
});