// CommonJS because Electron's sandboxed preload scripts can't be ES modules.
const { contextBridge, ipcRenderer } = require('electron');

const call =
  (name) =>
  (...args) =>
    ipcRenderer.invoke(name, ...args);

contextBridge.exposeInMainWorld('files', {
  chooseFolder: call('chooseFolder'),
  openFolder: call('openFolder'),
  readMaps: call('readMaps'),
  writeMap: call('writeMap'),
  renameMap: call('renameMap'),
  trashMap: call('trashMap'),
  showFolder: call('showFolder'),
  aiSetup: call('aiSetup'),
  // Returns a function that stops listening.
  onMapsChanged(listener) {
    const forward = () => listener();
    ipcRenderer.on('mapsChanged', forward);
    return () => ipcRenderer.removeListener('mapsChanged', forward);
  },
});
