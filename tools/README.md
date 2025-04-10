# JW Tools - Modular Tools System

This directory contains the individual tools for the JW Tools application. Each tool is organized into its own module to improve maintainability and make it easier to add new tools.

## Directory Structure

```
tools/
  ├── index.js                # Exports all tools for easy importing
  ├── app-settings.js         # Application settings functionality
  ├── auto-updater.js         # Application update functionality
  ├── zoom-launcher.js        # Zoom launching functionality
  ├── zoom-attendance.js      # Zoom attendance calculator
  ├── media-launcher.js       # Media tools launching functionality
  └── tool-template.js        # Template for creating new tools
```

## Adding a New Tool

To add a new tool to the application:

1. Copy `tool-template.js` to a new file with a descriptive name (e.g., `your-tool-name.js`)
2. Implement your tool's functionality in the new file
3. Export the necessary functions (especially the initialization function)
4. Add your tool to `index.js`:
   - Import your tool module
   - Add it to the exports
   - Include its initialization in the `initializeAllTools` function
5. Update `preload.js` to expose any necessary IPC functions to the renderer
6. Implement the UI for your tool in `renderer.js` and `index.html`

## Tool Module Structure

Each tool module should follow this general structure:

1. Configuration management (if needed)
   - Functions to read and save tool-specific settings
   
2. Core functionality
   - Implementation of the tool's main features
   
3. IPC handlers initialization
   - A function that sets up all the IPC handlers for the tool
   - This function should be exported and called from `initializeAllTools`

4. Module exports
   - Export all functions that need to be accessed from other files

## Example: Initializing a New Tool

In your tool file:

```javascript
function initYourTool() {
  // Set up IPC handlers
  ipcMain.handle('your-tool-function', async () => {
    // Implement your functionality
    return { success: true, result: 'some value' };
  });
}

module.exports = {
  initYourTool,
  // Other exports as needed
};
```

In `tools/index.js`, add:

```javascript
const yourTool = require('./your-tool-name');

function initializeAllTools(mainWindow) {
  // Other initializations...
  yourTool.initYourTool();
}

module.exports = {
  // Other exports...
  yourTool,
  initializeAllTools
};
```

## Preload API Functions

When adding a new tool, you'll often need to add new functions to the preload API to allow the renderer process to communicate with your tool. Add these functions to `preload.js` in the `contextBridge.exposeInMainWorld` section.

## Best Practices

1. Keep each tool module focused on a single responsibility
2. Maintain consistent error handling across all tools
3. Document your functions and IPC handlers
4. Follow the existing code style and patterns
5. Use the template as a starting point to ensure consistency