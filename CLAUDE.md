# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KHM Tools is a cross-platform Electron desktop application for Kingdom Hall media operations. It provides utilities for hybrid meetings using Zoom, OBS Studio, and Meeting Media Manager (M³).

## Development Commands

```bash
# Install dependencies
npm install

# Development mode (with DevTools)
npm run dev

# Production mode
npm start

# Build for current platform
npm run build

# Platform-specific builds
npm run build-mac     # macOS ARM64
npm run build-win     # Windows x64  
npm run build-linux   # Linux
```

## Architecture

### Electron Process Structure
- **Main Process** (`main.js`): Window management, tool initialization, native OS integration
- **Renderer Process** (`renderer.js`): UI logic and user interactions  
- **Preload Script** (`preload.js`): Secure IPC bridge using contextBridge API

### Modular Tool System (`/tools/`)
All tools are organized as separate modules in the `tools/` directory:

- **`index.js`**: Central orchestrator that exports all tools and `initializeAllTools()`
- **Individual tool files**: Each tool has its own file (e.g., `zoom-launcher.js`, `zoom-attendance.js`)
- **`tool-template.js`**: Template for creating new tools

### Key Application Features
1. **Zoom Attendance Calculator**: Processes Zoom poll results for hybrid meeting attendance
2. **Smart Application Launcher**: Sequential launcher for OBS → M³ → Zoom  
3. **Zoom Meeting Launcher**: Direct Zoom meeting launch with pre-configured settings
4. **Auto-Updates**: GitHub releases-based automatic updates via electron-updater

## Creating New Tools

1. Copy `tools/tool-template.js` to a new descriptive filename
2. Implement your tool following the established pattern:
   - Configuration management (if needed)
   - Core functionality 
   - IPC handlers initialization function
   - Module exports
3. Add your tool to `tools/index.js`:
   - Import the module
   - Add to exports
   - Include in `initializeAllTools()`
4. Update `preload.js` to expose any new IPC functions to renderer
5. Implement UI in `renderer.js` and `index.html`

## IPC Communication Pattern

Tools communicate between main and renderer processes using IPC handlers:

```javascript
// In tool file
function initYourTool() {
  ipcMain.handle('your-tool-function', async (event, param) => {
    // Implementation
    return result;
  });
}

// In preload.js
contextBridge.exposeInMainWorld('electronAPI', {
  yourToolFunction: (param) => ipcRenderer.invoke('your-tool-function', param)
});

// In renderer.js
const result = await window.electronAPI.yourToolFunction(param);
```

## Build System

Uses electron-builder with comprehensive cross-platform configuration:
- **Output**: `dist/` directory
- **Code Signing**: macOS hardened runtime with entitlements
- **Auto-Updates**: GitHub provider with semantic versioning
- **Package Formats**: DMG/ZIP (Mac), NSIS installer (Windows), AppImage/DEB (Linux)

## Configuration Storage

Application settings are stored in the user data directory:
- Path: `app.getPath('userData')`
- Format: JSON files for each tool's configuration
- Auto-created on first run

## Recent Changes

The project was recently rebranded from "JW Tools" to "KHM Tools" and migrated repositories. Some legacy references may still exist in documentation files.