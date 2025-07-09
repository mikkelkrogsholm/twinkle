import { app } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

interface AppConfig {
  folders: string[];
  stats: {
    filesOrganized: number;
    foldersCreated: number;
    timeSaved: number;
  };
  fileHistory: FileAction[];
}

interface FileAction {
  id: string;
  timestamp: Date;
  type: 'move' | 'create-folder';
  from?: string;
  to: string;
  folder?: string;
}

export class StorageService {
  private configPath: string;
  private config: AppConfig;
  
  constructor() {
    // Initialize with empty path, will be set in init()
    this.configPath = '';
    this.config = {
      folders: [],
      stats: {
        filesOrganized: 0,
        foldersCreated: 0,
        timeSaved: 0
      },
      fileHistory: []
    };
  }
  
  async init(): Promise<void> {
    // Set the config path after app is ready
    const userDataPath = app.getPath('userData');
    this.configPath = path.join(userDataPath, 'config.json');
    
    try {
      const data = await fs.readFile(this.configPath, 'utf8');
      this.config = JSON.parse(data);
    } catch (error) {
      // Config doesn't exist yet, use defaults
      await this.save();
    }
  }
  
  async save(): Promise<void> {
    await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
  }
  
  // Folder management
  getFolders(): string[] {
    return [...this.config.folders];
  }
  
  async addFolder(folderPath: string): Promise<void> {
    if (!this.config.folders.includes(folderPath)) {
      this.config.folders.push(folderPath);
      await this.save();
    }
  }
  
  async removeFolder(folderPath: string): Promise<void> {
    this.config.folders = this.config.folders.filter(f => f !== folderPath);
    await this.save();
  }
  
  // Stats management
  getStats() {
    return { ...this.config.stats };
  }
  
  async incrementFilesOrganized(count: number = 1): Promise<void> {
    this.config.stats.filesOrganized += count;
    this.config.stats.timeSaved += count * 0.05; // Assume 3 minutes saved per file
    await this.save();
  }
  
  async incrementFoldersCreated(count: number = 1): Promise<void> {
    this.config.stats.foldersCreated += count;
    await this.save();
  }
  
  // File history management
  async addFileAction(action: Omit<FileAction, 'id' | 'timestamp'>): Promise<void> {
    const newAction: FileAction = {
      ...action,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    
    this.config.fileHistory.unshift(newAction);
    
    // Keep only last 100 actions
    if (this.config.fileHistory.length > 100) {
      this.config.fileHistory = this.config.fileHistory.slice(0, 100);
    }
    
    await this.save();
  }
  
  getFileHistory(): FileAction[] {
    return [...this.config.fileHistory];
  }
  
  async undoLastAction(): Promise<FileAction | null> {
    if (this.config.fileHistory.length === 0) {
      return null;
    }
    
    const lastAction = this.config.fileHistory.shift();
    await this.save();
    
    return lastAction || null;
  }
}