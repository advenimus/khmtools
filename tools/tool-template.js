/**
 * Tool Template - Use this as a starting point for new tools
 * 
 * This file provides a standard structure for creating new tools in the JW Tools application.
 * Each tool should follow this pattern for consistency and ease of maintenance.
 */

const { app, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

// Path for tool configuration (if needed)
const configPath = path.join(app.getPath('userData'), 'your-tool-config.json');

/**
 * Read the tool's configuration
 * @returns {Object} The tool configuration
 */
function readToolConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    }
  } catch (error) {
    console.error('Error reading tool config:', error);
  }
  return { /* default configuration */ };
}

/**
 * Save the tool's configuration
 * @param {Object} config - The configuration to save
 * @returns {boolean} Success or failure
 */
function saveToolConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving tool config:', error);
    return false;
  }
}

/**
 * Main tool functionality 
 * @returns {Promise<Object>} Result of the operation
 */
function yourToolMainFunction() {
  return new Promise((resolve, reject) => {
    // Tool implementation goes here
    try {
      // Do something useful
      resolve({ success: true, message: 'Operation completed successfully' });
    } catch (error) {
      console.error('Error in tool operation:', error);
      resolve({ success: false, message: 'Operation failed: ' + error.message });
    }
  });
}

/**
 * Initialize the tool's IPC handlers
 * This function should be exported and called from main.js
 */
function initYourTool() {
  // Register IPC handlers for this tool
  
  // Example handler for a function
  ipcMain.handle('your-tool-function', async () => {
    return await yourToolMainFunction();
  });

  // Example handler to get configuration
  ipcMain.handle('get-your-tool-config', async () => {
    return readToolConfig();
  });

  // Example handler to save configuration
  ipcMain.handle('save-your-tool-config', async (event, config) => {
    const success = saveToolConfig(config);
    return { success, message: success ? 'Settings saved successfully' : 'Failed to save settings' };
  });
}

// Export functions that should be available to main.js
module.exports = {
  readToolConfig,
  saveToolConfig,
  yourToolMainFunction,
  initYourTool
};