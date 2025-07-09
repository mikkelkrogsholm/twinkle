import * as fs from 'fs/promises';
import * as path from 'path';
import { AIService, FileClassification } from './aiService';
import { StorageService } from './storageService';
import { FileEvent } from './fileMonitor';

export class FileOrganizer {
  private aiService: AIService;
  private storageService: StorageService;
  private organizationRules: Map<string, string> = new Map();
  
  constructor(aiService: AIService, storageService: StorageService) {
    this.aiService = aiService;
    this.storageService = storageService;
    this.setupDefaultRules();
  }
  
  private setupDefaultRules() {
    // Default organization rules - can be customized by users later
    this.organizationRules.set('Desktop', 'Desktop_Organized');
    this.organizationRules.set('Downloads', 'Downloads_Organized');
    this.organizationRules.set('Documents', 'Documents_Organized');
  }
  
  async organizeFile(event: FileEvent): Promise<void> {
    if (event.type !== 'add') {
      return; // Only organize new/existing files
    }
    
    // Skip if file is already in an organized folder
    if (event.path.includes('_Organized')) {
      return;
    }
    
    try {
      // Get file classification from AI
      const classification = await this.aiService.classifyFile(event.path);
      
      // Determine target folder
      const baseFolder = path.dirname(event.path);
      const organizedFolder = this.organizationRules.get(path.basename(baseFolder)) || 'Organized';
      const targetFolder = path.join(baseFolder, organizedFolder, classification.suggestedFolder);
      
      // Create target folder if it doesn't exist
      await this.ensureFolder(targetFolder);
      
      // Move file to target folder
      const fileName = path.basename(event.path);
      const targetPath = path.join(targetFolder, fileName);
      
      // Handle duplicate files
      const finalPath = await this.getUniqueFilePath(targetPath);
      
      // Move the file
      await fs.rename(event.path, finalPath);
      
      // Record the action
      await this.storageService.addFileAction({
        type: 'move',
        from: event.path,
        to: finalPath,
        folder: event.folder
      });
      
      // Update stats
      await this.storageService.incrementFilesOrganized();
      
    } catch (error) {
      console.error('Error organizing file:', event.path, error);
      throw error;
    }
  }
  
  private async ensureFolder(folderPath: string): Promise<void> {
    try {
      await fs.access(folderPath);
    } catch {
      await fs.mkdir(folderPath, { recursive: true });
      await this.storageService.incrementFoldersCreated();
    }
  }
  
  private async getUniqueFilePath(filePath: string): Promise<string> {
    let uniquePath = filePath;
    let counter = 1;
    
    while (true) {
      try {
        await fs.access(uniquePath);
        // File exists, generate new name
        const ext = path.extname(filePath);
        const base = path.basename(filePath, ext);
        const dir = path.dirname(filePath);
        uniquePath = path.join(dir, `${base}_${counter}${ext}`);
        counter++;
      } catch {
        // File doesn't exist, we can use this path
        return uniquePath;
      }
    }
  }
  
  async undoLastAction(): Promise<boolean> {
    const action = await this.storageService.undoLastAction();
    
    if (!action || action.type !== 'move' || !action.from) {
      return false;
    }
    
    try {
      // Move file back to original location
      await fs.rename(action.to, action.from);
      console.log(`Undid file move: ${action.to} -> ${action.from}`);
      return true;
    } catch (error) {
      console.error('Failed to undo action:', error);
      return false;
    }
  }
}