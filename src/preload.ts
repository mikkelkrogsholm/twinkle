import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  getFolders: () => ipcRenderer.invoke('get-folders'),
  addFolder: (path: string) => ipcRenderer.invoke('add-folder', path),
  removeFolder: (path: string) => ipcRenderer.invoke('remove-folder', path),
  getFileHistory: () => ipcRenderer.invoke('get-file-history'),
  undoLastAction: () => ipcRenderer.invoke('undo-last-action'),
  onNavigate: (callback: (route: string) => void) => {
    ipcRenderer.on('navigate', (_event, route) => callback(route));
  },
  onFileEvent: (callback: (event: any) => void) => {
    ipcRenderer.on('file-event', (_event, data) => callback(data));
  },
  onStatsUpdate: (callback: (stats: any) => void) => {
    ipcRenderer.on('stats-update', (_event, stats) => callback(stats));
  },
  getStats: () => ipcRenderer.invoke('get-stats'),
  onFolderAdded: (callback: (folder: string) => void) => {
    ipcRenderer.on('folder-added', (_event, folder) => callback(folder));
  }
});