import { app, BrowserWindow, Tray, Menu, nativeImage, dialog, ipcMain } from 'electron';
import * as path from 'path';
import { FileMonitor } from './services/fileMonitor';
import { StorageService } from './services/storageService';
import { AIService } from './services/aiService';
import { FileOrganizer } from './services/fileOrganizer';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
try {
  if (require('electron-squirrel-startup')) {
    app.quit();
  }
} catch (e) {
  // electron-squirrel-startup not needed in dev mode
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let fileMonitor: FileMonitor | null = null;
let storageService: StorageService | null = null;
let aiService: AIService | null = null;
let fileOrganizer: FileOrganizer | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: true // Show window on start for debugging
  });

  // In production, files might be in different locations
  let htmlPath = path.join(__dirname, 'index.html');
  
  // Check if we're in production (app.asar)
  if (!require('fs').existsSync(htmlPath)) {
    // Try the app resources directory
    htmlPath = path.join(process.resourcesPath, 'index.html');
  }
  
  mainWindow.loadFile(htmlPath).catch(err => {
    console.error('Failed to load index.html:', err);
    // Fallback to URL
    mainWindow?.loadURL(`file://${__dirname}/index.html`);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('minimize', () => {
    mainWindow?.hide();
  });
  
  // Remove DevTools for production
  // mainWindow.webContents.openDevTools();
};

const createTray = () => {
  // Create a simple icon if file doesn't exist
  const icon = nativeImage.createEmpty();
  const size = { width: 16, height: 16 };
  icon.addRepresentation({
    width: size.width,
    height: size.height,
    buffer: Buffer.from(new Array(size.width * size.height * 4).fill(255))
  });
  
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        mainWindow?.show();
      }
    },
    {
      label: 'Settings',
      click: () => {
        mainWindow?.show();
        mainWindow?.webContents.send('navigate', '/settings');
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Twinkle - AI File Organizer');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow?.isVisible() ? mainWindow.hide() : mainWindow?.show();
  });
};

const setupIpcHandlers = () => {
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    return result.filePaths;
  });
  
  ipcMain.handle('get-folders', async () => {
    return storageService?.getFolders() || [];
  });
  
  ipcMain.handle('add-folder', async (_event, folderPath: string) => {
    await storageService?.addFolder(folderPath);
    fileMonitor?.addFolder(folderPath);
    
    // Send notification to UI
    if (mainWindow) {
      mainWindow.webContents.send('folder-added', folderPath);
    }
  });
  
  ipcMain.handle('remove-folder', async (_event, folderPath: string) => {
    await storageService?.removeFolder(folderPath);
    fileMonitor?.removeFolder(folderPath);
  });
  
  ipcMain.handle('get-file-history', async () => {
    return storageService?.getFileHistory() || [];
  });
  
  ipcMain.handle('undo-last-action', async () => {
    const action = await storageService?.undoLastAction();
    if (action && action.type === 'move' && action.from) {
      // TODO: Implement file move reversal
    }
    return action;
  });
  
  ipcMain.handle('get-stats', async () => {
    return storageService?.getStats() || { filesOrganized: 0, foldersCreated: 0, timeSaved: 0 };
  });
};

const initializeServices = async () => {
  storageService = new StorageService();
  await storageService.init();
  
  // Initialize AI service - will use Claude Code's existing auth
  try {
    aiService = new AIService(''); // Empty key - will use Claude Code's auth
    await aiService.initialize();
    fileOrganizer = new FileOrganizer(aiService, storageService);
  } catch (error) {
    console.warn('Could not initialize AI service:', error);
  }
  
  fileMonitor = new FileMonitor();
  
  // Restore monitored folders
  const folders = storageService.getFolders();
  
  // If no folders are configured, add Downloads folder by default
  if (folders.length === 0) {
    const downloadsPath = path.join(app.getPath('home'), 'Downloads');
    console.log('No folders configured, adding Downloads folder:', downloadsPath);
    await storageService.addFolder(downloadsPath);
    folders.push(downloadsPath);
  }
  
  for (const folder of folders) {
    console.log('Monitoring folder:', folder);
    fileMonitor.addFolder(folder);
  }
  
  // Listen for file events
  fileMonitor.on('file-event', async (event) => {
    console.log('File event detected:', event);
    
    // Send update to renderer
    if (mainWindow) {
      mainWindow.webContents.send('file-event', event);
    }
    
    if (fileOrganizer && event.type === 'add') {
      console.log('Organizing new file:', event.path);
      try {
        await fileOrganizer.organizeFile(event);
        console.log('File organized successfully');
        
        // Update stats in UI
        const stats = storageService?.getStats();
        if (mainWindow && stats) {
          mainWindow.webContents.send('stats-update', stats);
        }
      } catch (error) {
        console.error('Failed to organize file:', error);
      }
    }
  });
};

app.whenReady().then(async () => {
  console.log('App is ready, initializing...');
  try {
    console.log('Initializing services...');
    await initializeServices();
    console.log('Setting up IPC handlers...');
    setupIpcHandlers();
    console.log('Creating window...');
    createWindow();
    console.log('Creating tray...');
    createTray();
    console.log('App initialized successfully');
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  fileMonitor?.destroy();
});