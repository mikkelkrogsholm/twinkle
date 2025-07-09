import * as chokidar from 'chokidar';
import * as path from 'path';
import { EventEmitter } from 'events';

export interface FileEvent {
  type: 'add' | 'change' | 'unlink';
  path: string;
  folder: string;
  timestamp: Date;
}

export class FileMonitor extends EventEmitter {
  private watchers: Map<string, chokidar.FSWatcher> = new Map();
  private monitoredFolders: Set<string> = new Set();
  
  constructor() {
    super();
  }
  
  addFolder(folderPath: string): void {
    if (this.monitoredFolders.has(folderPath)) {
      return;
    }
    
    const watcher = chokidar.watch(folderPath, {
      persistent: true,
      ignoreInitial: false, // Process existing files too
      depth: 0, // Only watch the top level
      ignored: [
        /(^|[\/\\])\../, // ignore dotfiles
        /node_modules/,
        /\.DS_Store/,
        /Thumbs\.db/,
        /_Organized$/, // Ignore our organized folders
        /.*_Organized\/.*/  // Ignore files already in organized folders
      ],
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100
      }
    });
    
    watcher.on('add', (filePath: string) => {
      console.log('File added:', filePath);
      this.handleFileEvent('add', filePath, folderPath);
    });
    
    watcher.on('change', (filePath: string) => {
      this.handleFileEvent('change', filePath, folderPath);
    });
    
    watcher.on('unlink', (filePath: string) => {
      this.handleFileEvent('unlink', filePath, folderPath);
    });
    
    watcher.on('error', (error: unknown) => {
      console.error(`Watcher error for ${folderPath}:`, error);
      this.emit('error', { folder: folderPath, error });
    });
    
    this.watchers.set(folderPath, watcher);
    this.monitoredFolders.add(folderPath);
    this.emit('folder-added', folderPath);
  }
  
  removeFolder(folderPath: string): void {
    const watcher = this.watchers.get(folderPath);
    if (watcher) {
      watcher.close();
      this.watchers.delete(folderPath);
      this.monitoredFolders.delete(folderPath);
      this.emit('folder-removed', folderPath);
    }
  }
  
  getFolders(): string[] {
    return Array.from(this.monitoredFolders);
  }
  
  private handleFileEvent(type: FileEvent['type'], filePath: string, folder: string): void {
    const event: FileEvent = {
      type,
      path: filePath,
      folder,
      timestamp: new Date()
    };
    
    this.emit('file-event', event);
  }
  
  destroy(): void {
    for (const watcher of this.watchers.values()) {
      watcher.close();
    }
    this.watchers.clear();
    this.monitoredFolders.clear();
    this.removeAllListeners();
  }
}