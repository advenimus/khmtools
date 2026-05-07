const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const path = require('path');

const DOWNLOAD_URL = 'https://github.com/advenimus/khmtools/releases/latest';

if (process.platform === 'win32') {
  app.setAppUserModelId('com.khmtools.app');
}

app.setName('KHM Tools');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 720,
    height: 560,
    minWidth: 520,
    minHeight: 460,
    icon: path.join(__dirname, process.platform === 'darwin' ? 'assets/mac_logo.icns' : 'assets/logo.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: process.platform !== 'darwin',
    resizable: true,
    show: false,
    backgroundColor: '#0f172a',
    title: 'KHM Tools',
    center: true
  });

  mainWindow.loadFile('index.html');

  if (process.platform !== 'darwin') {
    Menu.setApplicationMenu(null);
    mainWindow.removeMenu();
    mainWindow.setMenuBarVisibility(false);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.khmtools.app');
  }

  createWindow();

  ipcMain.handle('open-download-page', async () => {
    try {
      await shell.openExternal(DOWNLOAD_URL);
      return { success: true };
    } catch (error) {
      return { success: false, message: error && error.message ? error.message : 'Unknown error' };
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
