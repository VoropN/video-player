import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  getFolders: () => ipcRenderer.invoke('get-folders'),
  setFolder: () => ipcRenderer.invoke('set-folder'),
  getVideos: () => ipcRenderer.invoke('get-videos'),
  getVideoFile: (filename: string) =>
    ipcRenderer.invoke('get-video-file', filename),
});
