const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// Import all tools
const tools = require('./tools');

// Keep a global reference of the window object to prevent it from being garbage collected
let mainWindow;

function createWindow() {
  // Get app settings
  const appSettings = tools.appSettings.readAppSettings();
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    icon: path.join(__dirname, process.platform === 'darwin' ? 'assets/mac_logo.icns' : 'assets/logo.png'),
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
    title: 'KHM Tools',
    fullscreenable: true,
    center: true
  });

  // Load the index.html of the app
  mainWindow.loadFile('index.html');

  // Open DevTools only in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment) {
    mainWindow.webContents.openDevTools();
  }
  
  // Add keyboard shortcut for DevTools
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // F12 or Cmd+Option+I (Mac) / Ctrl+Shift+I (Windows/Linux)
    if (input.key === 'F12' || 
        (input.control && input.shift && input.key === 'I') ||
        (input.meta && input.alt && input.key === 'I')) {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });
  
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
  
  // Initialize all tools
  tools.initializeAllTools(mainWindow);
  
  // Handle open external link requests
  ipcMain.handle('open-external-link', async (event, url) => {
    if (typeof url === 'string') {
      try {
        await shell.openExternal(url);
        return { success: true };
      } catch (error) {
        console.error('Failed to open external link:', error);
        return { success: false, message: error.message };
      }
    }
    return { success: false, message: 'Invalid URL' };
  });
  
  // Handle window management features
  ipcMain.handle('maximize-window', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
        return false;
      } else {
        mainWindow.maximize();
        return true;
      }
    }
    return false;
  });
  
  // Handle dev tools toggle
  ipcMain.handle('toggle-dev-tools', () => {
    if (mainWindow) {
      mainWindow.webContents.toggleDevTools();
      return true;
    }
    return false;
  });
});

// Quit when all windows are closed
app.on('window-all-closed', function () {
  // On macOS, applications typically stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  // On macOS, re-create a window when the dock icon is clicked and no other windows are open
  if (mainWindow === null) createWindow();
});