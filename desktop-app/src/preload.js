const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('api', {
  checkAdb: () => ipcRenderer.invoke('check-adb'),
  installAdb: () => ipcRenderer.invoke('install-adb'),
  selectApk: () => ipcRenderer.invoke('select-apk'),
  listDevices: () => ipcRenderer.invoke('list-devices'),
  installApk: (deviceId, apkPath) => ipcRenderer.invoke('install-apk', { deviceId, apkPath }),
  getPackageName: (apkPath) => ipcRenderer.invoke('get-package-name', { apkPath }),
  uninstallApp: (deviceId, packageName) => ipcRenderer.invoke('uninstall-app', { deviceId, packageName }),
  getApkHistory: () => ipcRenderer.invoke('get-apk-history'),
  saveApkToHistory: (entry) => ipcRenderer.invoke('save-apk-to-history', entry),
  removeFromHistory: (filePath) => ipcRenderer.invoke('remove-from-history', { filePath }),
  deleteApkFile: (filePath) => ipcRenderer.invoke('delete-apk-file', { filePath }),
  downloadApk: (url) => ipcRenderer.invoke('download-apk', { url }),
  getPathForFile: (file) => webUtils.getPathForFile(file),
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (_e, data) => callback(data));
  },
  removeDownloadProgress: () => {
    ipcRenderer.removeAllListeners('download-progress');
  },
});
