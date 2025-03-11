const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Keep a global reference of the window object to prevent it from being garbage collected
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    icon: path.join(__dirname, 'assets/logo.png'),
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    },
    // Make the window more responsive
    autoHideMenuBar: false,
    resizable: true,
    center: true
  });

  // Load the index.html of the app
  mainWindow.loadFile('index.html');

  // Open DevTools in development
  // mainWindow.webContents.openDevTools(); 

  // Emitted when the window is closed
  mainWindow.on('closed', function () {
    // Dereference the window object
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();
  
  // Check for updates after startup
  autoUpdater.checkForUpdatesAndNotify();

  // Setup auto-updater events
  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update-available', info);
  });

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send('update-downloaded', info);
  });

  autoUpdater.on('error', (err) => {
    mainWindow.webContents.send('update-error', err);
  });

  // Install update when requested by renderer
  ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall();
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