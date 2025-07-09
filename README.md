# Twinkle ✨

An AI-powered file organizer for macOS that automatically organizes your files using Claude AI. Inspired by [Sparkle](https://makeitsparkle.co/), built with the [Claude Code SDK](https://docs.anthropic.com/en/docs/claude-code/sdk).

![Electron](https://img.shields.io/badge/Electron-37.2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![Claude Code SDK](https://img.shields.io/badge/Claude%20Code%20SDK-1.0.44-purple)

## Features

- 🤖 **AI-Powered Organization**: Uses Claude AI to intelligently categorize and organize your files
- 📁 **Automatic Folder Creation**: Creates organized folder structures based on file types and content
- 👁️ **File Monitoring**: Watches specified folders for new files and organizes them automatically
- 🔄 **Undo Support**: Easily undo file organization actions
- 📊 **Statistics Tracking**: Track how many files have been organized and time saved
- 🖥️ **System Tray App**: Runs quietly in the background with easy access from the menu bar

## Installation

### From Release
1. Download the latest release from the [Releases](https://github.com/mikkelkrogsholm/twinkle/releases) page
2. Open the DMG file and drag Twinkle to your Applications folder
3. Launch Twinkle from your Applications folder

### From Source

#### Prerequisites
- Node.js 18+ and npm
- macOS (Intel or Apple Silicon)
- Claude Code CLI installed (`npm install -g @anthropic-ai/claude-code`)

#### Build Steps
```bash
# Clone the repository
git clone https://github.com/mikkelkrogsholm/twinkle.git
cd twinkle

# Install dependencies
npm install

# Build the TypeScript files
npm run build

# Run in development mode
npm run dev

# Package for macOS
npm run package

# Create distributable
npm run make
```

## Usage

1. **Launch Twinkle**: The app runs in the system tray (menu bar)
2. **Add Folders**: Click the tray icon and select "Show App" to add folders to monitor
3. **Automatic Organization**: Files added to monitored folders are automatically organized
4. **View History**: Check the app to see organization history and statistics

### Default Behavior
- By default, Twinkle monitors your Downloads folder
- Files are organized into subfolders like:
  - `Downloads_Organized/Images/` for photos and graphics
  - `Downloads_Organized/Documents/` for PDFs, Word docs, etc.
  - `Downloads_Organized/Code/` for source code files
  - And more categories based on AI classification

## Architecture

```
twinkle/
├── src/
│   ├── main.ts           # Main Electron process
│   ├── preload.ts        # Preload script for IPC
│   ├── renderer.ts       # Renderer process (UI)
│   ├── index.html        # App UI
│   └── services/
│       ├── aiService.ts      # Claude AI integration
│       ├── fileMonitor.ts    # File system monitoring
│       ├── fileOrganizer.ts  # File organization logic
│       └── storageService.ts # Persistence layer
```

### Key Components

- **AIService**: Integrates with Claude Code SDK to classify files based on name, extension, and content
- **FileMonitor**: Uses Chokidar to watch folders for file system events
- **FileOrganizer**: Handles the logic of moving files to organized folders
- **StorageService**: Manages app configuration, history, and statistics

## Configuration

The app stores its configuration in:
```
~/Library/Application Support/twinkle/config.json
```

### Configuration Options
```json
{
  "folders": ["/Users/username/Downloads"],
  "stats": {
    "filesOrganized": 0,
    "foldersCreated": 0,
    "timeSaved": 0
  },
  "fileHistory": []
}
```

## Development

### Project Structure
- Built with Electron + TypeScript
- Uses Electron Forge for packaging and distribution
- Integrates Claude Code SDK for AI capabilities
- File system monitoring with Chokidar

### Scripts
- `npm run build` - Compile TypeScript
- `npm run start` - Run the packaged app
- `npm run dev` - Run in development mode
- `npm run package` - Create app bundle
- `npm run make` - Create distributable

### Environment Variables
Create a `.env` file for development:
```
ANTHROPIC_API_KEY=your_api_key_here  # Optional - uses Claude Code auth by default
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Inspired by [Sparkle](https://makeitsparkle.co/)
- Built with [Claude Code SDK](https://docs.anthropic.com/en/docs/claude-code/sdk)
- Powered by [Electron](https://www.electronjs.org/)

## Support

- Report issues on [GitHub Issues](https://github.com/mikkelkrogsholm/twinkle/issues)
- For Claude Code SDK issues, see [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)