export interface ElectronAPI {
  selectFolder: () => Promise<string[]>;
  getFolders: () => Promise<string[]>;
  addFolder: (path: string) => Promise<void>;
  removeFolder: (path: string) => Promise<void>;
  getFileHistory: () => Promise<any[]>;
  undoLastAction: () => Promise<void>;
  onNavigate: (callback: (route: string) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}