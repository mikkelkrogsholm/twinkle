/// <reference path="./types/electron.d.ts" />

class TwinkleApp {
  private folders: string[] = [];
  private activityLog: any[] = [];
  
  constructor() {
    this.init();
  }
  
  async init() {
    await this.loadFolders();
    this.setupEventListeners();
    this.updateStats();
    
    // Listen for file events
    (window as any).electronAPI.onFileEvent((event: any) => {
      this.addActivity(`File ${event.type}: ${event.path}`);
    });
    
    // Listen for stats updates
    (window as any).electronAPI.onStatsUpdate((stats: any) => {
      this.displayStats(stats);
    });
    
    // Listen for folder added
    (window as any).electronAPI.onFolderAdded?.((folder: string) => {
      this.addActivity(`Started monitoring folder: ${folder}`);
      this.addActivity('Processing existing files...');
    });
  }
  
  async loadFolders() {
    try {
      this.folders = await window.electronAPI.getFolders();
      this.renderFolders();
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  }
  
  renderFolders() {
    const folderList = document.getElementById('folder-list');
    if (!folderList) return;
    
    if (this.folders.length === 0) {
      folderList.innerHTML = `
        <div class="empty-state">
          <p>No folders are being monitored yet.</p>
          <p>Click "Add Folder" to get started!</p>
        </div>
      `;
      return;
    }
    
    const foldersHtml = this.folders.map(folder => `
      <div class="folder-item">
        <span class="folder-path">${folder}</span>
        <button class="btn btn-danger btn-small" data-folder="${folder}">Remove</button>
      </div>
    `).join('');
    
    folderList.innerHTML = `<div class="folder-list">${foldersHtml}</div>`;
    
    // Add remove handlers
    folderList.querySelectorAll('.btn-danger').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const folder = (e.target as HTMLElement).getAttribute('data-folder');
        if (folder) {
          await this.removeFolder(folder);
        }
      });
    });
  }
  
  async addFolder() {
    try {
      const result = await window.electronAPI.selectFolder();
      if (result && result.length > 0) {
        await window.electronAPI.addFolder(result[0]);
        await this.loadFolders();
      }
    } catch (error) {
      console.error('Failed to add folder:', error);
    }
  }
  
  async removeFolder(path: string) {
    try {
      await window.electronAPI.removeFolder(path);
      await this.loadFolders();
    } catch (error) {
      console.error('Failed to remove folder:', error);
    }
  }
  
  setupEventListeners() {
    const addFolderBtn = document.getElementById('add-folder-btn');
    if (addFolderBtn) {
      addFolderBtn.addEventListener('click', () => this.addFolder());
    }
    
    // Listen for navigation events
    window.electronAPI.onNavigate((route) => {
      console.log('Navigate to:', route);
      // Handle navigation here
    });
  }
  
  async updateStats() {
    try {
      const stats = await (window as any).electronAPI.getStats();
      this.displayStats(stats);
    } catch (error) {
      console.error('Failed to get stats:', error);
    }
  }
  
  displayStats(stats: any) {
    const filesOrganizedEl = document.getElementById('files-organized');
    const foldersCreatedEl = document.getElementById('folders-created');
    const timeSavedEl = document.getElementById('time-saved');
    
    if (filesOrganizedEl) filesOrganizedEl.textContent = stats.filesOrganized.toString();
    if (foldersCreatedEl) foldersCreatedEl.textContent = stats.foldersCreated.toString();
    if (timeSavedEl) timeSavedEl.textContent = `${stats.timeSaved.toFixed(1)}h`;
  }
  
  addActivity(message: string) {
    const now = new Date().toLocaleTimeString();
    this.activityLog.unshift({ time: now, message });
    this.activityLog = this.activityLog.slice(0, 10); // Keep last 10
    
    const activityEl = document.getElementById('activity-log');
    if (activityEl) {
      activityEl.innerHTML = this.activityLog.map(log => 
        `<div class="activity-item" style="padding: 8px; margin-bottom: 4px; background: #f9f9f9; border-radius: 4px;">
          <span style="color: #666; font-size: 0.8em;">${log.time}</span>
          <span style="margin-left: 10px;">${log.message}</span>
        </div>`
      ).join('');
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new TwinkleApp();
});