const { contextBridge, ipcRenderer } = require('electron');
const { webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFiles: () => ipcRenderer.invoke('select-files'),
  selectOutputFolder: () => ipcRenderer.invoke('select-output-folder'),
  getDefaultOutput: () => ipcRenderer.invoke('get-default-output'),
  compressPDF: (data) => ipcRenderer.invoke('compress-pdf', data),
  compressBatch: (data) => ipcRenderer.invoke('compress-batch', data),
  openFolder: (path) => ipcRenderer.invoke('open-folder', path),
  getFileSize: (path) => ipcRenderer.invoke('get-file-size', path),
  getPathForFile: (file) => {
    try {
      return webUtils.getPathForFile(file);
    } catch (error) {
      console.error('Error getting file path:', error);
      return null;
    }
  },
  onCompressionProgress: (callback) => {
    ipcRenderer.on('compression-progress', (event, data) => callback(data));
  },
  onCompressionStatus: (callback) => {
    ipcRenderer.on('compression-status', (event, data) => callback(data));
  },

  // Window controls (frameless titlebar)
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose: () => ipcRenderer.send('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onWindowMaximized: (callback) => {
    ipcRenderer.on('window-maximized', (event, isMax) => callback(isMax));
  },

  // Compression history
  getHistory: () => ipcRenderer.invoke('get-history'),
  addHistory: (entries) => ipcRenderer.invoke('add-history', entries),
  clearHistory: () => ipcRenderer.invoke('clear-history')
});
