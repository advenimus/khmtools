# JW Tools - Tool Development Guide

This guide explains how to add new tools or modify existing tools in the JW Tools application. The application has been refactored to use a modular approach where each tool is in its own file.

## Directory Structure

The application now uses the following structure for tools:

```
khmtools/
  ├── main.js               # Main Electron application
  ├── preload.js            # Preload script for IPC
  ├── renderer.js           # Frontend JavaScript
  ├── index.html            # Main HTML file
  ├── styles.css            # Styles
  └── tools/                # Tools directory
      ├── index.js          # Exports all tools
      ├── app-settings.js   # App settings functionality
      ├── auto-updater.js   # Updates functionality
      ├── zoom-launcher.js  # Zoom launching functionality
      ├── zoom-attendance.js # Zoom attendance calculator
      ├── media-launcher.js # Media tools launcher
      ├── tool-template.js  # Template for new tools
      └── README.md         # Documentation for tools
```

## Creating a New Tool

To add a new tool to the application, follow these steps:

### 1. Create a new tool file

Copy the `tool-template.js` file to a new file with a descriptive name:

```bash
cp tools/tool-template.js tools/your-new-tool.js
```

### 2. Implement your tool

Edit your new file to implement the functionality you need. Follow the template structure:

```javascript
// Required imports
const { app, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

// Configuration path (if needed)
const configPath = path.join(app.getPath('userData'), 'your-tool-config.json');

// Configuration functions
function readToolConfig() { /* ... */ }
function saveToolConfig(config) { /* ... */ }

// Core functionality
function yourToolFunction() { /* ... */ }

// Initialize IPC handlers
function initYourTool() {
  // Register your IPC handlers here
  ipcMain.handle('your-tool-function', async () => {
    return await yourToolFunction();
  });
  
  // Add more handlers as needed
}

// Export the functions
module.exports = {
  initYourTool,
  // Other exports as needed
};
```

### 3. Update the tools/index.js file

Edit `tools/index.js` to include your new tool:

```javascript
// Add your import
const yourNewTool = require('./your-new-tool');

function initializeAllTools(mainWindow) {
  // Initialize existing tools
  appSettings.initAppSettings();
  zoomLauncher.initZoomLauncher();
  // ... other tools
  
  // Initialize your new tool
  yourNewTool.initYourTool();
  
  console.log('All tools initialized successfully');
}

module.exports = {
  // Existing exports
  appSettings,
  zoomLauncher,
  // ... other tools
  
  // Add your new tool
  yourNewTool,
  
  // Always export the initialization function
  initializeAllTools
};
```

### 4. Update preload.js (if needed)

If your tool needs to expose new functions to the renderer process, add them to `preload.js`:

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  // Existing functions...
  
  // Add your new functions
  yourNewFunction: () => ipcRenderer.invoke('your-tool-function'),
  anotherFunction: (param) => ipcRenderer.invoke('another-function', param),
});
```

### 5. Add UI components

Finally, add the necessary UI components to `index.html` and frontend logic to `renderer.js`.

## Modifying Existing Tools

To modify an existing tool:

1. Locate the appropriate file in the `tools/` directory
2. Make your changes
3. If you're adding new IPC functions, remember to update `preload.js`
4. If needed, update the UI in `index.html` and `renderer.js`

## Best Practices

1. **Isolation**: Keep each tool's functionality isolated to its own file
2. **Error Handling**: Always include proper error handling in your tool functions
3. **Code Style**: Follow the existing code style for consistency
4. **Documentation**: Add comments to your code to explain what it does
5. **Configuration**: Use the app's userData directory for persistent configuration
6. **IPC Naming**: Use consistent naming for IPC channels (e.g., 'tool-name-action')

## Testing Your Tool

1. Start the application in development mode:
   ```bash
   npm run dev
   ```
2. Use the Chrome DevTools (automatically opened in dev mode) to debug
3. Check the console for errors
4. Test all functionality of your tool

## Example Tool: Counter

Here's a simple example of a counter tool that demonstrates the pattern:

```javascript
// tools/counter.js
const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const configPath = path.join(app.getPath('userData'), 'counter-config.json');

function readCounterConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    }
  } catch (error) {
    console.error('Error reading counter config:', error);
  }
  return { count: 0 };
}

function saveCounterConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving counter config:', error);
    return false;
  }
}

function initCounter() {
  ipcMain.handle('get-counter', async () => {
    return readCounterConfig().count;
  });
  
  ipcMain.handle('increment-counter', async () => {
    const config = readCounterConfig();
    config.count += 1;
    saveCounterConfig(config);
    return config.count;
  });
  
  ipcMain.handle('reset-counter', async () => {
    saveCounterConfig({ count: 0 });
    return 0;
  });
}

module.exports = {
  initCounter
};
```

This example shows a simple tool that manages a counter with get, increment, and reset operations.