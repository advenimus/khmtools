const fs = require('fs');
const path = require('path');
const { app, ipcMain, dialog } = require('electron');

// Check if this is the first launch by looking for any saved settings
function isFirstLaunch() {
  const settingsPath = app.getPath('userData');
  
  // Check for existence of any settings files
  const settingsFiles = [
    'app-settings.json',
    'zoom-config.json',
    'media-config.json',
    'universal-settings.json'
  ];
  
  // If any settings file exists, it's not the first launch
  for (const file of settingsFiles) {
    if (fs.existsSync(path.join(settingsPath, file))) {
      return false;
    }
  }
  
  return true;
}

// Mark onboarding as completed
function markOnboardingComplete() {
  const onboardingPath = path.join(app.getPath('userData'), '.onboarding-complete');
  try {
    fs.writeFileSync(onboardingPath, new Date().toISOString());
  } catch (error) {
    console.error('Error marking onboarding complete:', error);
  }
}

// Check if onboarding has been completed
function isOnboardingComplete() {
  const onboardingPath = path.join(app.getPath('userData'), '.onboarding-complete');
  return fs.existsSync(onboardingPath);
}

// Reset onboarding status (called when resetting to defaults)
function resetOnboardingStatus() {
  const onboardingPath = path.join(app.getPath('userData'), '.onboarding-complete');
  try {
    if (fs.existsSync(onboardingPath)) {
      fs.unlinkSync(onboardingPath);
    }
  } catch (error) {
    console.error('Error resetting onboarding status:', error);
  }
}

// Apply onboarding settings
async function applyOnboardingSettings(settings) {
  console.log('=== ONBOARDING APPLY SETTINGS START ===');
  console.log('Received settings object:', JSON.stringify(settings, null, 2));
  console.log('Meeting ID received:', settings.meetingId);
  
  try {
    // Import required modules
    const { saveUniversalSettings, readUniversalSettings } = require('./universal-settings');
    const { saveAppSettings } = require('./app-settings');
    const { saveMediaConfig, readMediaConfig } = require('./media-launcher');
    const { AutoLaunch } = require('./auto-launch');
    
    // 1. Set Meeting ID in universal settings
    const existingUniversalSettings = readUniversalSettings();
    
    console.log('Onboarding: Received meeting ID:', settings.meetingId);
    
    // Merge with existing settings
    const universalSettings = {
      ...existingUniversalSettings,
      meetingId: settings.meetingId || '',
      meetingSchedule: {
        midweek: {
          day: settings.midweekDay || 'tuesday',
          time: settings.midweekTime || '19:30'
        },
        weekend: {
          day: settings.weekendDay || 'sunday',
          time: settings.weekendTime || '10:00'
        }
      }
    };
    
    console.log('Onboarding: Saving universal settings:', universalSettings);
    const saveResult = saveUniversalSettings(universalSettings);
    console.log('Onboarding: Save result:', saveResult);
    
    // Force a synchronous delay to ensure file write completes
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify the settings were saved
    const verifySettings = readUniversalSettings();
    console.log('Onboarding: Verification - Meeting ID after save:', verifySettings.meetingId);
    
    // 2. Configure Media Launcher toggles and custom message
    const mediaConfig = readMediaConfig();
    mediaConfig.toolToggles = {
      customMessage: false, // Default to off
      launchOBS: settings.useOBS || false,
      launchMediaManager: settings.useMediaManager || false,
      launchZoom: true // Always enable Zoom
    };
    
    // Configure custom message settings if PC is zoom-host and reminder is enabled
    if (settings.pcPurpose === 'zoom-host' && settings.useReminder) {
      mediaConfig.customMessageSettings = {
        enabled: true,
        displayWhen: settings.reminderWhen || 'weekend',
        title: settings.reminderTitle || 'Pre-Meeting Checklist',
        message: settings.reminderMessage || 'Remember to check all meeting preparations',
        displayTime: 5
      };
    }
    
    saveMediaConfig(mediaConfig);
    
    // 3. Set default tool based on PC purpose
    let defaultTool = 'welcome-screen';
    if (settings.pcPurpose === 'zoom-host') {
      defaultTool = 'media-launcher';
    } else if (settings.pcPurpose === 'zoom-attendant') {
      defaultTool = 'start-zoom';
    }
    
    // 4. Configure app settings
    const appSettings = {
      alwaysMaximize: settings.autoLaunch || false,
      defaultTool: defaultTool,
      runAtLogon: settings.autoLaunch || false
    };
    saveAppSettings(appSettings);
    
    // 5. Enable auto-launch if requested
    if (settings.autoLaunch) {
      await AutoLaunch.enable();
    }
    
    // 6. Mark onboarding as complete
    markOnboardingComplete();
    
    return { success: true };
  } catch (error) {
    console.error('Error applying onboarding settings:', error);
    return { success: false, error: error.message };
  }
}

// Check application paths and prompt for missing ones
async function checkApplicationPaths(settings) {
  const missingPaths = [];
  
  // Check Zoom path
  const { getDefaultZoomPath } = require('./zoom-launcher');
  const zoomPath = getDefaultZoomPath();
  if (!fs.existsSync(zoomPath)) {
    missingPaths.push({ app: 'Zoom', defaultPath: zoomPath });
  }
  
  // Check OBS path if needed
  if (settings.useOBS) {
    const { getDefaultOBSPath } = require('./media-launcher');
    const obsPath = getDefaultOBSPath();
    if (!fs.existsSync(obsPath)) {
      missingPaths.push({ app: 'OBS Studio', defaultPath: obsPath });
    }
  }
  
  // Check Media Manager path if needed
  if (settings.useMediaManager) {
    const { getDefaultMediaManagerPath } = require('./media-launcher');
    const mediaManagerPath = getDefaultMediaManagerPath();
    if (!fs.existsSync(mediaManagerPath)) {
      missingPaths.push({ app: 'Meeting Media Manager', defaultPath: mediaManagerPath });
    }
  }
  
  return missingPaths;
}

// Initialize onboarding IPC handlers
function initOnboarding() {
  // Check if first launch
  ipcMain.handle('onboarding-check-first-launch', () => {
    return isFirstLaunch() && !isOnboardingComplete();
  });
  
  // Apply onboarding settings
  ipcMain.handle('onboarding-apply-settings', async (event, settings) => {
    console.log('IPC Handler - onboarding-apply-settings called');
    console.log('IPC Handler - Received settings:', JSON.stringify(settings, null, 2));
    const result = await applyOnboardingSettings(settings);
    console.log('IPC Handler - Result:', result);
    return result;
  });
  
  // Check application paths
  ipcMain.handle('onboarding-check-paths', async (event, settings) => {
    return await checkApplicationPaths(settings);
  });
  
  // Browse for application path
  ipcMain.handle('onboarding-browse-path', async (event, appName) => {
    const filters = process.platform === 'darwin' 
      ? [{ name: 'Applications', extensions: ['app'] }]
      : [{ name: 'Executables', extensions: ['exe'] }];
    
    const result = await dialog.showOpenDialog({
      title: `Select ${appName} Application`,
      properties: ['openFile'],
      filters: filters
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    
    return null;
  });
  
  // Save application path
  ipcMain.handle('onboarding-save-path', async (event, appName, appPath) => {
    try {
      if (appName === 'Zoom') {
        const { saveZoomConfig, readZoomConfig } = require('./zoom-launcher');
        const config = readZoomConfig();
        config.zoomPath = appPath;
        saveZoomConfig(config);
      } else if (appName === 'OBS Studio') {
        const { saveMediaConfig, readMediaConfig } = require('./media-launcher');
        const config = readMediaConfig();
        config.obsPath = appPath;
        saveMediaConfig(config);
      } else if (appName === 'Meeting Media Manager') {
        const { saveMediaConfig, readMediaConfig } = require('./media-launcher');
        const config = readMediaConfig();
        config.mediaManagerPath = appPath;
        saveMediaConfig(config);
      }
      return { success: true };
    } catch (error) {
      console.error(`Error saving ${appName} path:`, error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  isFirstLaunch,
  markOnboardingComplete,
  isOnboardingComplete,
  resetOnboardingStatus,
  initOnboarding
};