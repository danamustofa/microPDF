const { contextBridge, ipcRenderer } = require('electron');
const { webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFiles: () => ipcRenderer.invoke('select-files'),
  selectOutputFolder: () => ipcRenderer.invoke('select-output-folder'),
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
  }
});
