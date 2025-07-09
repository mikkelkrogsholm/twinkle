import { query, type SDKMessage } from '@anthropic-ai/claude-code';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface FileClassification {
  category: string;
  confidence: number;
  suggestedFolder: string;
  reasoning: string;
}

export class AIService {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async initialize(): Promise<void> {
    // Claude Code SDK will use existing Claude Code authentication
    // No need to set API key when running through Claude Code
    if (this.apiKey) {
      process.env.ANTHROPIC_API_KEY = this.apiKey;
    }
  }
  
  async classifyFile(filePath: string): Promise<FileClassification> {
    const fileName = path.basename(filePath);
    const extension = path.extname(filePath).toLowerCase();
    
    // Read file metadata
    const stats = await fs.stat(filePath);
    const fileSize = stats.size;
    
    // For text files, read a sample of the content
    let contentSample = '';
    const textExtensions = ['.txt', '.md', '.csv', '.log', '.json', '.xml', '.html', '.js', '.ts', '.py', '.java', '.cpp', '.c', '.h'];
    
    if (textExtensions.includes(extension) && fileSize < 1024 * 1024) { // < 1MB
      try {
        const content = await fs.readFile(filePath, 'utf8');
        contentSample = content.substring(0, 500); // First 500 chars
      } catch (error) {
        console.error('Could not read file content:', error);
      }
    }
    
    const prompt = `Analyze this file and classify it into an appropriate folder category:

File Name: ${fileName}
Extension: ${extension}
File Size: ${this.formatFileSize(fileSize)}
${contentSample ? `Content Sample:\n${contentSample}\n` : ''}

Please provide:
1. A category name (e.g., "Documents", "Images", "Code", "Downloads", etc.)
2. A confidence score (0-1)
3. A suggested folder name for organization
4. Brief reasoning for the classification

Respond ONLY with valid JSON format (no markdown, no extra text):
{
  "category": "string",
  "confidence": number,
  "suggestedFolder": "string",
  "reasoning": "string"
}`;
    
    try {
      const messages: SDKMessage[] = [];
      const controller = new AbortController();
      
      // Set timeout
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      for await (const message of query({
        prompt,
        abortController: controller,
        options: {
          maxTurns: 1,
        },
      })) {
        messages.push(message);
      }
      
      clearTimeout(timeout);
      
      // Find the assistant's response
      const assistantMessage = messages.find(m => m.type === 'assistant') as any;
      if (!assistantMessage || !assistantMessage.message) {
        throw new Error('No response from Claude');
      }
      
      // Extract content from the assistant message
      const content = assistantMessage.message.content;
      if (!content || typeof content !== 'string') {
        throw new Error('Invalid response format');
      }
      
      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const result = JSON.parse(jsonMatch[0]);
      
      return {
        category: result.category || 'Uncategorized',
        confidence: result.confidence || 0.5,
        suggestedFolder: result.suggestedFolder || 'Misc',
        reasoning: result.reasoning || 'No specific reasoning provided'
      };
    } catch (error) {
      console.error('Failed to classify file:', error);
      
      // Fallback classification based on extension
      return this.getFallbackClassification(fileName, extension);
    }
  }
  
  private getFallbackClassification(fileName: string, extension: string): FileClassification {
    const extensionMap: Record<string, { category: string; folder: string }> = {
      // Images
      '.jpg': { category: 'Images', folder: 'Photos' },
      '.jpeg': { category: 'Images', folder: 'Photos' },
      '.png': { category: 'Images', folder: 'Images' },
      '.gif': { category: 'Images', folder: 'Images' },
      '.bmp': { category: 'Images', folder: 'Images' },
      '.svg': { category: 'Images', folder: 'Vectors' },
      
      // Documents
      '.pdf': { category: 'Documents', folder: 'PDFs' },
      '.doc': { category: 'Documents', folder: 'Word Documents' },
      '.docx': { category: 'Documents', folder: 'Word Documents' },
      '.txt': { category: 'Documents', folder: 'Text Files' },
      '.md': { category: 'Documents', folder: 'Markdown' },
      
      // Code
      '.js': { category: 'Code', folder: 'JavaScript' },
      '.ts': { category: 'Code', folder: 'TypeScript' },
      '.py': { category: 'Code', folder: 'Python' },
      '.java': { category: 'Code', folder: 'Java' },
      
      // Archives
      '.zip': { category: 'Archives', folder: 'Compressed Files' },
      '.rar': { category: 'Archives', folder: 'Compressed Files' },
      '.7z': { category: 'Archives', folder: 'Compressed Files' },
      '.tar': { category: 'Archives', folder: 'Compressed Files' },
      '.gz': { category: 'Archives', folder: 'Compressed Files' },
      
      // Media
      '.mp4': { category: 'Videos', folder: 'Videos' },
      '.avi': { category: 'Videos', folder: 'Videos' },
      '.mov': { category: 'Videos', folder: 'Videos' },
      '.mp3': { category: 'Audio', folder: 'Music' },
      '.wav': { category: 'Audio', folder: 'Audio Files' },
      '.flac': { category: 'Audio', folder: 'Music' }
    };
    
    const mapping = extensionMap[extension] || { category: 'Other', folder: 'Misc' };
    
    return {
      category: mapping.category,
      confidence: 0.8,
      suggestedFolder: mapping.folder,
      reasoning: `Classification based on file extension ${extension}`
    };
  }
  
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}