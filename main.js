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
    let zoomPath = config.zoomPath || getDefaultZoomPath();
    
    // Check if the path exists, with special handling for macOS app bundles
    const pathExists = () => {
      if (!zoomPath) return false;
      
      // On macOS, .app files are directories (bundles)
      if (process.platform === 'darwin' && zoomPath.endsWith('.app')) {
        return fs.existsSync(zoomPath) && fs.statSync(zoomPath).isDirectory();
      }
      return fs.existsSync(zoomPath);
    };
    if (!zoomPath || !pathExists()) {
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

  // Media Launcher functionality
  const mediaConfigPath = path.join(app.getPath('userData'), 'media-config.json');
  
  // Function to read the Media configuration
  function readMediaConfig() {
    try {
      if (fs.existsSync(mediaConfigPath)) {
        const configData = fs.readFileSync(mediaConfigPath, 'utf8');
        return JSON.parse(configData);
      }
    } catch (error) {
      console.error('Error reading Media config:', error);
    }
    return { 
      obsPath: '',
      mediaManagerPath: '',
      customMessage: {
        enabled: false,
        title: '',
        message: '',
        displayTime: 5000
      }
    };
  }
  
  // Function to save the Media configuration
  function saveMediaConfig(config) {
    try {
      fs.writeFileSync(mediaConfigPath, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Error saving Media config:', error);
    }
  }
  
  // Get the default OBS path based on the platform
  function getDefaultOBSPath() {
    if (process.platform === 'darwin') {
      return '/Applications/OBS.app';
    } else if (process.platform === 'win32') {
      return 'C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe';
    }
    return '';
  }
  
  // Get the default Meeting Media Manager path based on the platform
  function getDefaultMediaManagerPath() {
    if (process.platform === 'darwin') {
      return '/Applications/Meeting Media Manager.app';
    } else if (process.platform === 'win32') {
      return 'C:\\Program Files\\Meeting Media Manager\\Meeting Media Manager.exe';
    }
    return '';
  }
  
  // Handle request to get the current OBS path
  ipcMain.handle('get-obs-path', async () => {
    const config = readMediaConfig();
    return config.obsPath || '';
  });
  
  // Handle request to browse for OBS application
  ipcMain.handle('browse-for-obs', async () => {
    const defaultPath = getDefaultOBSPath();
    const defaultDir = path.dirname(defaultPath);
    
    const filters = process.platform === 'darwin' 
      ? [{ name: 'Applications', extensions: ['app'] }]
      : [{ name: 'Executables', extensions: ['exe'] }];
    
    const result = await dialog.showOpenDialog(mainWindow, {
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
  
  // Handle request to get the current Media Manager path
  ipcMain.handle('get-media-manager-path', async () => {
    const config = readMediaConfig();
    return config.mediaManagerPath || '';
  });
  
  // Handle request to browse for Media Manager application
  ipcMain.handle('browse-for-media-manager', async () => {
    const defaultPath = getDefaultMediaManagerPath();
    const defaultDir = path.dirname(defaultPath);
    
    const filters = process.platform === 'darwin' 
      ? [{ name: 'Applications', extensions: ['app'] }]
      : [{ name: 'Executables', extensions: ['exe'] }];
    
    const result = await dialog.showOpenDialog(mainWindow, {
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
  
  // Handle request to get the current Media Zoom path
  ipcMain.handle('get-media-zoom-path', async () => {
    const config = readMediaConfig();
    return config.zoomPath || '';
  });
  
  // Handle request to browse for Media Zoom application
  ipcMain.handle('browse-for-media-zoom', async () => {
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
      const config = readMediaConfig();
      config.zoomPath = zoomPath;
      saveMediaConfig(config);
      return zoomPath;
    }
    
    return null;
  });
  
  // Handle request to launch OBS
  ipcMain.handle('launch-obs', async () => {
    const config = readMediaConfig();
    let obsPath = config.obsPath || getDefaultOBSPath();
    
    // Check if the path exists, with special handling for macOS app bundles
    const pathExists = () => {
      if (!obsPath) return false;
      
      // On macOS, .app files are directories (bundles)
      if (process.platform === 'darwin' && obsPath.endsWith('.app')) {
        return fs.existsSync(obsPath) && fs.statSync(obsPath).isDirectory();
      }
      return fs.existsSync(obsPath);
    };
    if (!pathExists()) {
      // Try to browse for OBS
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select OBS Application',
        defaultPath: getDefaultOBSPath(),
        properties: ['openFile']
      });
      if (result.canceled || result.filePaths.length === 0) return { success: false, message: 'OBS path not selected' };
      obsPath = result.filePaths[0];
      const config = readMediaConfig();
      config.obsPath = obsPath;
      saveMediaConfig(config);
    }
    
    // Platform-specific launch command with virtual camera flag
    let launchCommand;
    if (process.platform === 'darwin') {
      // On macOS, use the 'open' command with arguments
      launchCommand = `open -a "${obsPath}" --args --startvirtualcam --disable-shutdown-check`;
    } else {
      // On Windows, we need to set the working directory to the OBS directory
      // to ensure it can find its locale files
      const obsDir = path.dirname(obsPath);
      
      // Use 'cd' to change to OBS directory before launching
      // This ensures OBS can find its locale files
      launchCommand = `cd "${obsDir}" && "${obsPath}" --startvirtualcam --disable-shutdown-check`;
    }
    
    exec(launchCommand, (error) => {
      if (error) {
        console.error('Error launching OBS:', error);
        return { success: false, message: `Error launching OBS: ${error.message}` };
      }
    });
    
    return { success: true, message: 'OBS launched successfully' };
  });
  
  // Handle request to launch Meeting Media Manager
  ipcMain.handle('launch-media-manager', async () => {
    const config = readMediaConfig();
    let mediaManagerPath = config.mediaManagerPath || getDefaultMediaManagerPath();
    
    // Check if the path exists, with special handling for macOS app bundles
    const pathExists = () => {
      if (!mediaManagerPath) return false;
      
      // On macOS, .app files are directories (bundles)
      if (process.platform === 'darwin' && mediaManagerPath.endsWith('.app')) {
        return fs.existsSync(mediaManagerPath) && fs.statSync(mediaManagerPath).isDirectory();
      }
      return fs.existsSync(mediaManagerPath);
    };
    if (!pathExists()) {
      // Try to browse for Meeting Media Manager
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select Meeting Media Manager Application',
        defaultPath: getDefaultMediaManagerPath(),
        properties: ['openFile']
      });
      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, message: 'Meeting Media Manager path not selected' };
      }
      mediaManagerPath = result.filePaths[0];
      config.mediaManagerPath = mediaManagerPath;
      saveMediaConfig(config);
    }
    
    // Platform-specific launch command
    let launchCommand;
    if (process.platform === 'darwin') {
      // On macOS, use the 'open' command
      launchCommand = `open "${mediaManagerPath}"`;
    } else {
      // On Windows, directly execute the .exe file
      launchCommand = `"${mediaManagerPath}"`;
    }
    
    exec(launchCommand, (error) => {
      if (error) {
        console.error('Error launching Meeting Media Manager:', error);
        return { success: false, message: `Error launching Meeting Media Manager: ${error.message}` };
      }
    });
    
    return { success: true, message: 'Meeting Media Manager launched successfully' };
  });

  // Handle request to launch Zoom from media launcher
  ipcMain.handle('launch-media-zoom', async () => {
    const config = readMediaConfig();
    let zoomPath = config.zoomPath || getDefaultZoomPath();
    
    // Check if the path exists, with special handling for macOS app bundles
    const pathExists = () => {
      if (!zoomPath) return false;
      
      // On macOS, .app files are directories (bundles)
      if (process.platform === 'darwin' && zoomPath.endsWith('.app')) {
        return fs.existsSync(zoomPath) && fs.statSync(zoomPath).isDirectory();
      }
      return fs.existsSync(zoomPath);
    };
    
    if (!zoomPath || !pathExists()) {
      // Try to browse for Zoom
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select Zoom Application',
        defaultPath: getDefaultZoomPath(),
        properties: ['openFile']
      });
      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, message: 'Zoom path not selected' };
      }
      zoomPath = result.filePaths[0];
      config.zoomPath = zoomPath;
      saveMediaConfig(config);
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
  
  // Handle request to get custom message settings
  ipcMain.handle('get-custom-message-settings', async () => {
    const config = readMediaConfig();
    return config.customMessage || {
      enabled: false,
      title: '',
      message: '',
      displayTime: 5000
    };
  });
  
  // Handle request to save custom message settings
  ipcMain.handle('save-custom-message-settings', async (event, settings) => {
    const config = readMediaConfig();
    config.customMessage = settings;
    saveMediaConfig(config);
    console.log('Custom message settings saved:', settings);
    return { success: true };
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

// Handle resetting all settings to defaults
ipcMain.handle('reset-all-settings', async () => {
  try {
    // Default app settings
    const defaultAppSettings = { 
      alwaysMaximize: false, 
      defaultTool: 'welcome-screen' 
    };
    
    // Default Zoom settings
    const defaultZoomConfig = { zoomPath: '' };
    
    // Default Media settings
    const defaultMediaConfig = { 
      obsPath: '',
      mediaManagerPath: '',
      zoomPath: '',
      customMessage: {
        enabled: false,
        title: '',
        message: '',
        displayTime: 5000
      }
    };
    
    // Reset all settings files
    fs.writeFileSync(appSettingsPath, JSON.stringify(defaultAppSettings, null, 2));
    fs.writeFileSync(path.join(app.getPath('userData'), 'zoom-config.json'), JSON.stringify(defaultZoomConfig, null, 2));
    fs.writeFileSync(path.join(app.getPath('userData'), 'media-config.json'), JSON.stringify(defaultMediaConfig, null, 2));
    
    console.log('All settings reset to defaults');
    return { success: true, message: 'All settings reset to defaults' };
  } catch (error) {
    console.error('Error resetting settings:', error);
    return { success: false, message: `Error resetting settings: ${error.message}` };
  }
});