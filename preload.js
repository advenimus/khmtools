const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('khmtools', {
  openDownloadPage: () => ipcRenderer.invoke('open-download-page')
});
