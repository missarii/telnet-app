import { contextBridge, ipcRenderer } from 'electron';

export interface SourceInfo {
  id: string;
  name: string;
  thumbnail: string;
}

export interface ElectronAPI {
  getSources: () => Promise<SourceInfo[]>;
  startCapture: (sourceId: string) => Promise<{ success: boolean; sourceId: string }>;
  stopCapture: () => Promise<{ success: boolean }>;
  onShareStarted: (cb: (data: { sourceId: string }) => void) => () => void;
  onShareStopped: (cb: () => void) => () => void;
  platform: NodeJS.Platform;
}

const electronAPI: ElectronAPI = {
  getSources: () => ipcRenderer.invoke('get-sources'),

  startCapture: (sourceId: string) =>
    ipcRenderer.invoke('start-capture', sourceId),

  stopCapture: () => ipcRenderer.invoke('stop-capture'),

  onShareStarted: (cb: (data: { sourceId: string }) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: { sourceId: string }) =>
      cb(data);
    ipcRenderer.on('share-started', listener);
    return () => {
      ipcRenderer.removeListener('share-started', listener);
    };
  },

  onShareStopped: (cb: () => void) => {
    const listener = () => cb();
    ipcRenderer.on('share-stopped', listener);
    return () => {
      ipcRenderer.removeListener('share-stopped', listener);
    };
  },

  platform: process.platform,
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Expose type declaration for TypeScript in renderer
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
