const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  checkAdb: () => ipcRenderer.invoke('check-adb'),
  installAdb: () => ipcRenderer.invoke('install-adb'),
  selectApk: () => ipcRenderer.invoke('select-apk'),
  listDevices: () => ipcRenderer.invoke('list-devices'),
  installApk: (deviceId, apkPath) => ipcRenderer.invoke('install-apk', { deviceId, apkPath }),
});
