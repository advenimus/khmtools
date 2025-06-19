// DOM Elements
const zoomAttendanceBtn = document.getElementById('zoom-attendance-btn');
const welcomeScreen = document.getElementById('welcome-screen');
const zoomAttendanceCalculator = document.getElementById('zoom-attendance-calculator');
const resultView = document.getElementById('result-view');
const startZoom = document.getElementById('start-zoom');
const startZoomBtn = document.getElementById('start-zoom-btn');
const zoomSettingsPanel = document.getElementById('zoom-settings-panel');
const attendanceForm = document.getElementById('attendance-form');
const attendanceResult = document.getElementById('attendance-result');

const backButton = document.getElementById('back-button');
const calculateAgainButton = document.getElementById('calculate-again-button');

const toolPanels = document.querySelectorAll('.tool-panel');
const toolButtons = document.querySelectorAll('.tool-button');
const mediaLauncherBtn = document.getElementById('media-launcher-btn');
const updateNotification = document.getElementById('update-notification');
const updateMessage = document.getElementById('update-message');
const updateButton = document.getElementById('update-button');
const dismissUpdateButton = document.getElementById('dismiss-update');
const helpButton = document.getElementById('help-button');
const logoLink = document.getElementById('logo-link');
const helpPopup = document.getElementById('help-popup');
const appSettingsBtn = document.getElementById('app-settings-btn');
const appSettingsPopup = document.getElementById('app-settings-popup');
const closeAppSettings = document.getElementById('close-app-settings');
const saveAppSettings = document.getElementById('save-unified-settings');
const resetSettingsBtn = document.getElementById('reset-settings-btn');
const resetConfirmation = document.getElementById('reset-confirmation');
const defaultToolSelect = document.getElementById('default-tool');
const alwaysMaximizeCheckbox = document.getElementById('always-maximize');
const runAtLogonCheckbox = document.getElementById('run-at-logon');
const toggleDevToolsBtn = document.getElementById('toggle-dev-tools-btn');

// Unified Settings Elements (will be populated after DOM loads)
let settingsNavBtns = null;
let settingsPanels = null;
let saveUnifiedSettingsBtn = null;
let settingsStatus = null;
let universalMeetingId = null;
let midweekDay = null;
let midweekTime = null;
let weekendDay = null;
let weekendTime = null;

// Media Launcher Settings Elements
let customMessageDisplayWhen = null;
let toggleOBS = null;
let toggleMediaManager = null;
let toggleZoom = null;
let customMessageTitle = null;
let customMessageText = null;
let customMessageTime = null;

// Path browsing elements
let browseOBSPathBtn = null;
let browseMediaManagerPathBtn = null;
let browseZoomPathBtn = null;
let currentOBSPath = null;
let currentMediaManagerPath = null;
let currentZoomPath = null;

// Show the selected tool panel and hide others
function showToolPanel(panelId) {
  // Hide all tool panels
  toolPanels.forEach(panel => {
    panel.classList.add('hidden');
  });
  
  // Hide welcome screen and result view
  welcomeScreen.classList.add('hidden');
  resultView.classList.add('hidden');
  
  // Show the selected panel
  document.getElementById(panelId).classList.remove('hidden');
  
  // Update active button styling
  toolButtons.forEach(button => {
    button.classList.remove('active');
  });
}

// Tool navigation
zoomAttendanceBtn.addEventListener('click', () => {
  zoomAttendanceBtn.classList.add('active');
  showToolPanel('zoom-attendance-calculator');
});

// Start Zoom button
if (startZoomBtn) {
  startZoomBtn.addEventListener('click', () => {
    startZoomBtn.classList.add('active');
    showToolPanel('start-zoom');
  });
}
// Media Launcher button
if (mediaLauncherBtn) {
  mediaLauncherBtn.addEventListener('click', () => {
    mediaLauncherBtn.classList.add('active');
    showToolPanel('media-launcher');
    
    // Use setTimeout to ensure DOM elements are available
    setTimeout(async () => {
      // Load all settings and update UI when Media Launcher is opened
      if (window.electronAPI) {
        Promise.all([
          window.electronAPI.getCustomMessageSettings(),
          window.electronAPI.getToolToggles(),
          window.electronAPI.getUniversalMeetingId(),
          window.electronAPI.shouldShowCustomMessage()
        ]).then(([customSettings, toggles, meetingId, shouldShowCustomMsg]) => {
          // Update step visibility based on toggles
          const custommsgStepElement = document.getElementById('custommsg-step');
          const obsStepElement = document.getElementById('obs-step');
          const mediaManagerStepElement = document.getElementById('media-manager-step');
          const zoomStepElement = document.getElementById('zoom-step');
          
          if (custommsgStepElement) {
            custommsgStepElement.style.display = shouldShowCustomMsg ? '' : 'none';
          }
          if (obsStepElement) {
            obsStepElement.style.display = toggles.launchOBS ? '' : 'none';
          }
          if (mediaManagerStepElement) {
            mediaManagerStepElement.style.display = toggles.launchMediaManager ? '' : 'none';
          }
          if (zoomStepElement) {
            zoomStepElement.style.display = toggles.launchZoom ? '' : 'none';
          }
          
          // Update the step text to use the title value
          if (shouldShowCustomMsg && customSettings.title && custommsgStepElement) {
            const stepTextElement = custommsgStepElement.querySelector('.step-text');
            if (stepTextElement) {
              stepTextElement.textContent = customSettings.title;
            }
          }
        }).catch(error => {
          console.error('Error loading media launcher settings:', error);
        });
      }
    }, 0);
  });
}

// Logo click handler - open GitHub repository
if (logoLink && window.electronAPI) {
  logoLink.addEventListener('click', (e) => {
    e.preventDefault();
    // This opens the URL in the user's default browser in a new window
    window.electronAPI.openExternal('https://github.com/advenimus/khmtools');
  });
}

// Handle external links in help popup
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('external-link')) {
    e.preventDefault();
    if (window.electronAPI) {
      window.electronAPI.openExternal(e.target.href);
    }
  }
});

// Function to return to calculator view
function returnToCalculator() {
  resultView.classList.add('hidden');
  zoomAttendanceCalculator.classList.remove('hidden');
}

// Back button handler
backButton.addEventListener('click', returnToCalculator);

// Calculate Again button handler (resets the form values)
calculateAgainButton.addEventListener('click', () => {
  // Reset the form
  attendanceForm.reset();
  
  // Return to calculator view
  returnToCalculator();
});

// Add event listeners to number inputs to handle Enter key
const numberInputs = document.querySelectorAll('input[type="number"]');
numberInputs.forEach(input => {
  input.addEventListener('keypress', (e) => {
    // If Enter key is pressed
    if (e.key === 'Enter') {
      // Prevent the default form submission
      e.preventDefault();
      // Submit the form programmatically
      attendanceForm.dispatchEvent(new Event('submit'));
    }
  });
});

// Zoom Attendance Calculator functionality
attendanceForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  // Get values from all inputs
  const pollResults = [
    parseInt(document.getElementById('option1').value) || 0,
    parseInt(document.getElementById('option2').value) || 0,
    parseInt(document.getElementById('option3').value) || 0,
    parseInt(document.getElementById('option4').value) || 0,
    parseInt(document.getElementById('option5').value) || 0,
    parseInt(document.getElementById('option6').value) || 0,
    parseInt(document.getElementById('option7').value) || 0,
    parseInt(document.getElementById('option8').value) || 0,
    parseInt(document.getElementById('option9').value) || 0,
    parseInt(document.getElementById('option10').value) || 0,
    parseInt(document.getElementById('optionPhone').value) || 0
  ];
  
  // Calculate attendance directly in renderer
  let total = 0;
  
  // For options 1-10, multiply count by its value
  for (let i = 0; i < 10; i++) {
    total += pollResults[i] * (i + 1);
  }
  
  // For phone option (11th option), count as 1 person each
  total += pollResults[10];
  
  // Set the result
  attendanceResult.textContent = total;
  
  // Hide calculator, show result view
  zoomAttendanceCalculator.classList.add('hidden');
  resultView.classList.remove('hidden');
});

// Reset form when switching tools
toolButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Reset form and hide results
    attendanceForm.reset();
    
    // Reset views
    resultView.classList.add('hidden');
  });
});

// Help button functionality
if (helpButton) {
  helpButton.addEventListener('click', () => {
    helpPopup.classList.toggle('hidden');
  });
}

// Close help button
const closeHelpButton = document.getElementById('close-help');
if (closeHelpButton) {
  closeHelpButton.addEventListener('click', () => {
    helpPopup.classList.add('hidden');
  });
}

// Media Launcher Help button functionality
const mediaLauncherHelpButton = document.getElementById('media-launcher-help-button');
const mediaLauncherHelpPopup = document.getElementById('media-launcher-help-popup');
const closeMediaLauncherHelp = document.getElementById('close-media-launcher-help');

if (mediaLauncherHelpButton) {
  mediaLauncherHelpButton.addEventListener('click', () => {
    mediaLauncherHelpPopup.classList.remove('hidden');
  });
}

if (closeMediaLauncherHelp) {
  closeMediaLauncherHelp.addEventListener('click', () => {
    mediaLauncherHelpPopup.classList.add('hidden');
  });
}

// Close Media Launcher help popup when clicking outside
if (mediaLauncherHelpPopup) {
  mediaLauncherHelpPopup.addEventListener('click', (e) => {
    if (e.target === mediaLauncherHelpPopup) {
      mediaLauncherHelpPopup.classList.add('hidden');
    }
  });
}

// Zoom Launcher Help button functionality
const zoomLauncherHelpButton = document.getElementById('zoom-launcher-help-button');
const zoomLauncherHelpPopup = document.getElementById('zoom-launcher-help-popup');
const closeZoomLauncherHelp = document.getElementById('close-zoom-launcher-help');

if (zoomLauncherHelpButton) {
  zoomLauncherHelpButton.addEventListener('click', () => {
    zoomLauncherHelpPopup.classList.remove('hidden');
  });
}

if (closeZoomLauncherHelp) {
  closeZoomLauncherHelp.addEventListener('click', () => {
    zoomLauncherHelpPopup.classList.add('hidden');
  });
}

// Close Zoom Launcher help popup when clicking outside
if (zoomLauncherHelpPopup) {
  zoomLauncherHelpPopup.addEventListener('click', (e) => {
    if (e.target === zoomLauncherHelpPopup) {
      zoomLauncherHelpPopup.classList.add('hidden');
    }
  });
}

// Console redirection functionality
if (window.electronAPI && window.electronAPI.onConsoleMessage) {
  window.electronAPI.onConsoleMessage((data) => {
    // Format message for console output
    const timestamp = new Date(data.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${data.level.toUpperCase()}]`;
    
    // Output to browser console with appropriate level
    switch (data.level) {
      case 'error':
        console.error(prefix, data.message);
        break;
      case 'warn':
        console.warn(prefix, data.message);
        break;
      case 'info':
        console.info(prefix, data.message);
        break;
      case 'debug':
        console.debug(prefix, data.message);
        break;
      default:
        console.log(prefix, data.message);
    }
  });
}

// Auto-update functionality
if (window.electronAPI) {
  // When an update is available
  window.electronAPI.onUpdateAvailable((info) => {
    console.log('Update available:', info);
    updateMessage.textContent = `Version ${info.version} is available!`;
    updateNotification.classList.remove('hidden');
  });

  // When an update has been downloaded
  window.electronAPI.onUpdateDownloaded((info) => {
    updateMessage.textContent = `Version ${info.version} is ready to install`;
    console.log('Update downloaded:', info);
    updateButton.textContent = 'Restart and Install';
    updateNotification.classList.remove('hidden');
  });

  // When there's an update error
  window.electronAPI.onUpdateError((err) => {
    console.error('Update error:', err);
    
    // Show a notification with a link to the releases page
    updateMessage.innerHTML = `Unable to download automatic update. <a href="#" id="releases-link" style="color: #fff; text-decoration: underline;">Visit releases page</a>`;
    updateButton.style.display = 'none';
    updateNotification.classList.remove('hidden');
    
    // Add event listener to the releases link after a short delay to ensure the element exists
    setTimeout(() => {
      const releasesLink = document.getElementById('releases-link');
      if (releasesLink) {
        releasesLink.addEventListener('click', (e) => {
          e.preventDefault();
          // This opens the URL in the user's default browser in a new window
          window.electronAPI.openExternal('https://github.com/advenimus/khmtools/releases');
        });
      }
    }, 100);
    // You could also show this to the user if desired
    
    // Make sure the dismiss button works
    if (dismissUpdateButton) {
      dismissUpdateButton.style.display = 'block';
    }
  });

  // Install update when button is clicked
  updateButton.addEventListener('click', () => {
    window.electronAPI.installUpdate();
  });

  // Dismiss update notification
  document.getElementById('dismiss-update').addEventListener('click', () => {
    updateNotification.classList.add('hidden');
  });
}

// Start Zoom Tool Functionality
if (window.electronAPI) {
  console.log('electronAPI is available');
  const launchZoomBtn = document.getElementById('launch-zoom-btn');
  const zoomSettingsBtn = document.getElementById('zoom-settings-btn');
  const browseZoomPathBtn = document.getElementById('browse-zoom-path-btn');
  const currentZoomPath = document.getElementById('current-zoom-path');
  const zoomStatus = document.getElementById('zoom-status');
  const zoomMeetingIdInput = document.getElementById('zoom-meeting-id');
  const saveZoomSettingsBtn = document.getElementById('save-zoom-settings');
  const meetingIdStatus = document.getElementById('meeting-id-status');
  const zoomSettingsPopup = document.getElementById('zoom-settings-popup');
  const closeZoomSettings = document.getElementById('close-zoom-settings');

  console.log('Launch Zoom Button:', launchZoomBtn);
  // console.log('Settings Button:', zoomSettingsBtn);
  // console.log('Browse Button:', browseZoomPathBtn);
  
  // Function to update the displayed Zoom path and meeting ID
  async function updateZoomSettings() {
    try {
      // Update Zoom path
      const zoomPath = await window.electronAPI.getZoomPath();
      if (currentZoomPath) {
        if (zoomPath) {
          currentZoomPath.textContent = zoomPath;
        } else {
          currentZoomPath.textContent = 'No path configured';
        }
      }
      
      // Update Meeting ID - Now using universal settings
      // const meetingId = await window.electronAPI.getZoomMeetingId();
      // if (meetingId && zoomMeetingIdInput) {
      //   zoomMeetingIdInput.value = meetingId;
      // } else if (zoomMeetingIdInput) {
      //   zoomMeetingIdInput.value = '';
      // }
    } catch (error) {
      console.error('Error getting Zoom settings:', error);
      if (currentZoomPath) {
        currentZoomPath.textContent = 'Error getting Zoom path';
      }
    }
  }
  
  // Initialize the Zoom settings display when the tool is shown
  if (startZoomBtn) {
    startZoomBtn.addEventListener('click', updateZoomSettings);
  }
  
  // Settings button functionality removed - now using unified settings
  // if (zoomSettingsBtn) {
  //   zoomSettingsBtn.addEventListener('click', () => {
  //     console.log('Settings button clicked, opening popup');
  //     zoomSettingsPopup.classList.remove('hidden');
  //     updateZoomSettings();
  //   });
  // }
  
  // if (closeZoomSettings) {
  //   closeZoomSettings.addEventListener('click', () => {
  //     zoomSettingsPopup.classList.add('hidden');
  //   });
  // }
  
  // if (zoomSettingsPopup) {
  //   zoomSettingsPopup.addEventListener('click', (e) => {
  //     if (e.target === zoomSettingsPopup) {
  //       zoomSettingsPopup.classList.add('hidden');
  //     }
  //   });
  // }
  
  // Browse for Zoom application - Moved to unified settings
  if (browseZoomPathBtn) {
    browseZoomPathBtn.addEventListener('click', async () => {
    try {
      console.log('Browse button clicked');
      const zoomPath = await window.electronAPI.browseForZoom();
      if (zoomPath) {
        currentZoomPath.textContent = zoomPath;
        if (meetingIdStatus) {
          meetingIdStatus.textContent = 'Zoom path updated successfully';
          meetingIdStatus.style.color = '#4a6da7';
          
          // Clear status after 3 seconds
          setTimeout(() => {
            meetingIdStatus.textContent = '';
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Error browsing for Zoom:', error);
      if (meetingIdStatus) {
        meetingIdStatus.textContent = 'Error selecting Zoom application';
        meetingIdStatus.style.color = 'red';
      }
    }
    });
  }
  
  // Save Settings button - Removed (now using unified settings)
  // if (saveZoomSettingsBtn) {
  //   saveZoomSettingsBtn.addEventListener('click', async () => {
  //     const meetingId = zoomMeetingIdInput.value.trim();
  //     try {
  //       const result = await window.electronAPI.saveZoomMeetingId(meetingId);
  //       if (result.success) {
  //         meetingIdStatus.textContent = 'Settings saved successfully';
  //         meetingIdStatus.style.color = '#4a6da7';
  //         
  //         // Clear status after 3 seconds
  //         setTimeout(() => {
  //           meetingIdStatus.textContent = '';
  //           // Close the popup
  //           zoomSettingsPopup.classList.add('hidden');
  //         }, 1500);
  //       }
  //     } catch (error) {
  //       console.error('Error saving meeting ID:', error);
  //       meetingIdStatus.textContent = 'Error saving settings';
  //       meetingIdStatus.style.color = 'red';
  //     }
  //   });
  // }
  
  // Launch Zoom
  if (launchZoomBtn) {
    launchZoomBtn.addEventListener('click', async () => {
      console.log('Launch Zoom button clicked');
      
      // Check if there's a meeting ID
      const meetingId = await window.electronAPI.getZoomMeetingId();
      
      if (!meetingId) {
        // If no meeting ID is set, notify user to set it in unified settings
        if (zoomStatus) {
          zoomStatus.textContent = 'Please set a meeting ID in the main settings';
          zoomStatus.style.color = 'orange';
        }
        return;
      }
      
      // Launch Zoom with the existing meeting ID
      if (zoomStatus) {
        zoomStatus.textContent = 'Launching Zoom meeting...';
      }
      const result = await window.electronAPI.launchZoom();
      if (zoomStatus) {
        zoomStatus.textContent = result.message;
        zoomStatus.style.color = result.success ? '#4a6da7' : 'red';
      }
    });
  }
} else {
  console.error('electronAPI is not available');
}

// Unified Settings Functions
async function loadUnifiedSettings() {
  try {
    // Load app settings
    const appSettings = await window.electronAPI.getAppSettings();
    if (alwaysMaximizeCheckbox) alwaysMaximizeCheckbox.checked = appSettings.alwaysMaximize || false;
    if (defaultToolSelect) defaultToolSelect.value = appSettings.defaultTool || 'welcome-screen';
    
    // Load auto-launch status
    const autoLaunchStatus = await window.electronAPI.autoLaunchIsEnabled();
    if (runAtLogonCheckbox && autoLaunchStatus.success) {
      runAtLogonCheckbox.checked = autoLaunchStatus.enabled;
    }

    // Load universal settings
    const universalSettings = await window.electronAPI.getUniversalSettings();
    if (universalMeetingId) universalMeetingId.value = universalSettings.meetingId || '';
    
    // Load meeting schedule
    const schedule = universalSettings.meetingSchedule || {};
    if (schedule.midweek) {
      if (midweekDay) midweekDay.value = schedule.midweek.day || 'tuesday';
      if (midweekTime) midweekTime.value = schedule.midweek.time || '19:30';
    }
    if (schedule.weekend) {
      if (weekendDay) weekendDay.value = schedule.weekend.day || 'sunday';
      if (weekendTime) weekendTime.value = schedule.weekend.time || '10:00';
    }

    // Load media launcher settings
    const customSettings = await window.electronAPI.getCustomMessageSettings();
    const toggles = await window.electronAPI.getToolToggles();
    
    if (customMessageDisplayWhen) customMessageDisplayWhen.value = customSettings.displayWhen || 'none';
    if (toggleOBS) toggleOBS.checked = toggles.launchOBS || false;
    if (toggleMediaManager) toggleMediaManager.checked = toggles.launchMediaManager || false;
    if (toggleZoom) toggleZoom.checked = toggles.launchZoom || false;
    
    if (customMessageTitle) customMessageTitle.value = customSettings.title || '';
    if (customMessageText) customMessageText.value = customSettings.message || '';
    if (customMessageTime) customMessageTime.value = customSettings.displayTime || 5;

    // Load application paths
    await updatePathDisplaysGlobal();
    
  } catch (error) {
    console.error('Error loading unified settings:', error);
    showSettingsStatus('Error loading settings', 'error');
  }
}

async function saveUnifiedSettings() {
  try {
    // Save app settings
    const appSettingsData = {
      alwaysMaximize: alwaysMaximizeCheckbox.checked,
      defaultTool: defaultToolSelect.value,
      runAtLogon: runAtLogonCheckbox ? runAtLogonCheckbox.checked : false
    };
    await window.electronAPI.saveAppSettings(appSettingsData);
    
    // Set auto-launch based on checkbox
    if (runAtLogonCheckbox) {
      const autoLaunchResult = await window.electronAPI.autoLaunchSet(runAtLogonCheckbox.checked);
      if (!autoLaunchResult.success) {
        console.error('Failed to set auto-launch:', autoLaunchResult.error);
        showSettingsStatus('Warning: Auto-launch setting may not have been applied correctly', 'error');
      }
    }

    // Save universal meeting ID
    await window.electronAPI.saveUniversalMeetingId(universalMeetingId.value);

    // Save meeting schedule
    const scheduleData = {
      midweek: {
        day: midweekDay.value,
        time: midweekTime.value
      },
      weekend: {
        day: weekendDay.value,
        time: weekendTime.value
      }
    };
    await window.electronAPI.saveMeetingSchedule(scheduleData);

    // Save tool toggles with validation (removing customMessage toggle)
    const togglesData = {
      customMessage: false, // Deprecated - using displayWhen instead
      launchOBS: toggleOBS.checked,
      launchMediaManager: toggleMediaManager.checked,
      launchZoom: toggleZoom.checked
    };

    // Ensure at least one tool is enabled
    const hasEnabledTool = togglesData.launchOBS || togglesData.launchMediaManager || togglesData.launchZoom;
    if (!hasEnabledTool) {
      showSettingsStatus('Error: At least one tool must be enabled', 'error');
      return false;
    }

    await window.electronAPI.saveToolToggles(togglesData);

    // Save custom message settings with new displayWhen field
    const customSettingsData = {
      enabled: customMessageDisplayWhen.value !== 'none', // For backward compatibility
      displayWhen: customMessageDisplayWhen.value,
      title: customMessageTitle.value,
      message: customMessageText.value,
      displayTime: parseInt(customMessageTime.value)
    };
    await window.electronAPI.saveCustomMessageSettings(customSettingsData);

    showSettingsStatus('Settings saved successfully!', 'success');
    
    // Update step visibility in media launcher if it's open
    updateStepVisibilityGlobal();
    
    return true;
  } catch (error) {
    console.error('Error saving unified settings:', error);
    showSettingsStatus('Error saving settings', 'error');
    return false;
  }
}

function showSettingsStatus(message, type = 'info') {
  if (settingsStatus) {
    settingsStatus.textContent = message;
    settingsStatus.style.color = type === 'error' ? '#DC2626' : 
                                 type === 'success' ? '#059669' : '#2563EB';
    
    // Clear status after 3 seconds
    setTimeout(() => {
      settingsStatus.textContent = '';
    }, 3000);
  }
}

// Global function to update path displays in unified settings
async function updatePathDisplaysGlobal() {
  try {
    // Update OBS path
    const obsPath = await window.electronAPI.getOBSPath();
    const currentOBSPathEl = document.getElementById('current-obs-path');
    if (currentOBSPathEl) {
      if (obsPath) {
        currentOBSPathEl.textContent = obsPath;
      } else {
        currentOBSPathEl.textContent = 'Using default path';
      }
    }
    
    // Update Media Manager path
    const mediaManagerPath = await window.electronAPI.getMediaManagerPath();
    const currentMediaManagerPathEl = document.getElementById('current-media-manager-path');
    if (currentMediaManagerPathEl) {
      if (mediaManagerPath) {
        currentMediaManagerPathEl.textContent = mediaManagerPath;
      } else {
        currentMediaManagerPathEl.textContent = 'Using default path';
      }
    }
    
    // Update Zoom path (used by all Zoom tools)
    const zoomPath = await window.electronAPI.getZoomPath();
    const currentZoomPathEl = document.getElementById('current-zoom-path');
    if (currentZoomPathEl) {
      if (zoomPath) {
        currentZoomPathEl.textContent = zoomPath;
      } else {
        currentZoomPathEl.textContent = 'Using default path';
      }
    }
  } catch (error) {
    console.error('Error updating path displays:', error);
  }
}

// Global function to update step visibility in media launcher
async function updateStepVisibilityGlobal() {
  try {
    const custommsgStepEl = document.getElementById('custommsg-step');
    const obsStepEl = document.getElementById('obs-step');
    const mediaManagerStepEl = document.getElementById('media-manager-step');
    const zoomStepEl = document.getElementById('zoom-step');
    
    // Check if custom message should be shown
    const shouldShowCustomMessage = await window.electronAPI.shouldShowCustomMessage();
    
    if (custommsgStepEl) {
      custommsgStepEl.style.display = shouldShowCustomMessage ? '' : 'none';
    }
    if (obsStepEl && toggleOBS) {
      obsStepEl.style.display = toggleOBS.checked ? '' : 'none';
    }
    if (mediaManagerStepEl && toggleMediaManager) {
      mediaManagerStepEl.style.display = toggleMediaManager.checked ? '' : 'none';
    }
    if (zoomStepEl && toggleZoom) {
      zoomStepEl.style.display = toggleZoom.checked ? '' : 'none';
    }
    
    // Update custom message step text
    if (custommsgStepEl && shouldShowCustomMessage && customMessageTitle && customMessageTitle.value) {
      const stepTextEl = custommsgStepEl.querySelector('.step-text');
      if (stepTextEl) {
        stepTextEl.textContent = customMessageTitle.value;
      }
    }
  } catch (error) {
    console.error('Error updating step visibility:', error);
  }
}

// App Settings Functionality
if (window.electronAPI) {
  // Load app settings when the page loads
  window.addEventListener('DOMContentLoaded', async () => {
    try {
      const appSettings = await window.electronAPI.getAppSettings();
      
      // Initialize custom message step visibility when the page loads
      if (custommsgStep) {
        const customSettings = await window.electronAPI.getCustomMessageSettings();
        // Update the visibility of the custom message step based only on enabled setting
        custommsgStep.style.display = customSettings.enabled ? '' : 'none';
        
        // Update the step text to use the title value
        if (customSettings.enabled && customSettings.title) {
          custommsgStep.querySelector('.step-text').textContent = customSettings.title;
        }
      }
      
      alwaysMaximizeCheckbox.checked = appSettings.alwaysMaximize || false;
      defaultToolSelect.value = appSettings.defaultTool || 'welcome-screen';
      if (runAtLogonCheckbox) runAtLogonCheckbox.checked = appSettings.runAtLogon || false;
    } catch (error) {
      console.error('Error loading app settings:', error);
    }
  });
  
  // Initialize Unified Settings Variables
  settingsNavBtns = document.querySelectorAll('.settings-nav-btn');
  settingsPanels = document.querySelectorAll('.settings-panel');
  saveUnifiedSettingsBtn = document.getElementById('save-unified-settings');
  settingsStatus = document.getElementById('settings-status');
  
  // Initialize Universal meeting settings
  universalMeetingId = document.getElementById('universal-meeting-id');
  midweekDay = document.getElementById('midweek-day');
  midweekTime = document.getElementById('midweek-time');
  weekendDay = document.getElementById('weekend-day');
  weekendTime = document.getElementById('weekend-time');
  
  // Initialize Media Launcher Settings Elements
  customMessageDisplayWhen = document.getElementById('custom-message-display-when');
  toggleOBS = document.getElementById('toggle-obs');
  toggleMediaManager = document.getElementById('toggle-media-manager');
  toggleZoom = document.getElementById('toggle-zoom');
  customMessageTitle = document.getElementById('custom-message-title');
  customMessageText = document.getElementById('custom-message-text');
  customMessageTime = document.getElementById('custom-message-time');

  // Open unified settings popup
  if (appSettingsBtn && appSettingsPopup) {
    appSettingsBtn.addEventListener('click', async () => {
      console.log('Settings button clicked');
      appSettingsPopup.classList.remove('hidden');
      await loadUnifiedSettings();
    });
  } else {
    console.error('Settings button or popup not found:', { appSettingsBtn, appSettingsPopup });
  }
  
  // Close settings popup
  if (closeAppSettings) {
    closeAppSettings.addEventListener('click', () => {
      appSettingsPopup.classList.add('hidden');
    });
  }

  // Settings navigation
  settingsNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all nav buttons and panels
      settingsNavBtns.forEach(navBtn => navBtn.classList.remove('active'));
      settingsPanels.forEach(panel => panel.classList.remove('active'));
      
      // Add active class to clicked button
      btn.classList.add('active');
      
      // Show corresponding panel
      let targetPanel = btn.id.replace('nav-', '') + '-settings';
      // Handle special case for meetings -> meeting-settings
      if (targetPanel === 'meetings-settings') {
        targetPanel = 'meeting-settings';
      }
      const panel = document.getElementById(targetPanel);
      if (panel) {
        panel.classList.add('active');
      } else {
        console.error('Panel not found:', targetPanel);
      }
    });
  });

  // Toggle Developer Tools
  if (toggleDevToolsBtn) {
    toggleDevToolsBtn.addEventListener('click', async () => {
      try {
        await window.electronAPI.toggleDevTools();
      } catch (error) {
        console.error('Error toggling dev tools:', error);
      }
    });
  }
  
  // Save unified settings
  if (saveUnifiedSettingsBtn) {
    saveUnifiedSettingsBtn.addEventListener('click', async () => {
      const success = await saveUnifiedSettings();
      // Settings saved - window stays open for further editing
      // User can manually close by clicking X or clicking outside
    });
  }

  // Reset settings functionality
  let resetClickTimer = null;
  let resetClickCount = 0;

  resetSettingsBtn.addEventListener('click', async () => {
    resetClickCount++;
    
    if (resetClickCount === 1) {
      // First click - show confirmation
      resetSettingsBtn.classList.add('confirm');
      resetConfirmation.classList.remove('hidden');
      
      // Reset after 3 seconds if no second click
      resetClickTimer = setTimeout(() => {
        resetClickCount = 0;
        resetSettingsBtn.classList.remove('confirm');
        resetConfirmation.classList.add('hidden');
      }, 3000);
    } else if (resetClickCount === 2) {
      // Second click - perform reset
      clearTimeout(resetClickTimer);
      resetClickCount = 0;
      resetSettingsBtn.classList.remove('confirm');
      resetConfirmation.classList.add('hidden');
      
      try {
        const result = await window.electronAPI.resetAllSettings();
        if (result.success) {
          showSettingsStatus('All settings have been reset to defaults. Restarting app...', 'success');
          
          // Reload the app after a short delay to show the message
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } catch (error) {
        console.error('Error resetting settings:', error);
        showSettingsStatus('Error resetting settings', 'error');
      }
    }
  });
  
  // Close settings popup when clicking outside
  appSettingsPopup.addEventListener('click', (e) => {
    if (e.target === appSettingsPopup) {
      appSettingsPopup.classList.add('hidden');
    }
  });
  
  // Listen for the open-default-tool event from the main process
  window.electronAPI.onOpenDefaultTool((toolId) => {
    console.log('Opening default tool:', toolId);
    
    // Find the corresponding tool button
    let toolButton;
    if (toolId === 'zoom-attendance-calculator') {
      toolButton = zoomAttendanceBtn;
    } else if (toolId === 'start-zoom') {
      toolButton = startZoomBtn;
    } else if (toolId === 'media-launcher') {
      toolButton = mediaLauncherBtn;
    }
    
    // Click the tool button to open the tool
    if (toolButton) {
      toolButton.click();
    }
  });
  
  // Media Launcher Tool Functionality
  const launchMediaBtn = document.getElementById('launch-media-btn');
  const launchProgressContainer = document.getElementById('launch-progress-container');
  const launchProgressBar = document.getElementById('launch-progress-bar');
  const launchStatus = document.getElementById('launch-status');
  const custommsgPopup = document.getElementById('custommsg-popup');
  const custommsgPopupTitle = document.querySelector('.custommsg-popup-content h3');
  const custommsgPopupMessage = document.querySelector('.custommsg-popup-content p:first-of-type');
  const custommsgStep = document.getElementById('custommsg-step');
  
  // Media settings elements - Removed, now using unified settings
  // const mediaSettingsBtn = document.getElementById('media-settings-btn');
  // const mediaSettingsPopup = document.getElementById('media-settings-popup');
  // const saveMediaSettingsBtn = document.getElementById('save-media-settings-btn');
  // const closeMediaSettingsBtn = document.getElementById('close-media-settings-btn');
  // const mediaHelpBtn = document.getElementById('media-help-btn');
  // const mediaHelpPopup = document.getElementById('media-help-popup');
  // const closeMediaHelpBtn = document.getElementById('close-media-help-btn');
  // const closeMediaHelpFooterBtn = document.getElementById('close-media-help-footer-btn');
  const browseOBSPathBtn = document.getElementById('browse-obs-path-btn');
  const browseMediaManagerPathBtn = document.getElementById('browse-media-manager-path-btn');
  const browseZoomPathBtn = document.getElementById('browse-zoom-path-btn');
  const currentOBSPath = document.getElementById('current-obs-path');
  const currentMediaManagerPath = document.getElementById('current-media-manager-path');
  const currentZoomPath = document.getElementById('current-zoom-path');
  // Using global variables defined above
  const customMessageSettings = document.getElementById('custom-message-settings');
  // customMessageTitle, customMessageText, customMessageTime are defined globally
  // toggleOBS, toggleMediaManager, toggleZoom are defined globally
  const meetingIdInput = document.getElementById('meeting-id');
  
  // Platform detection
  const platform = window.electronAPI.getPlatform();
  console.log('Detected platform:', platform);
  
  // Function to update progress bar
  function updateProgress(percent, statusText) {
    launchProgressBar.style.width = `${percent}%`;
    launchStatus.textContent = statusText;
  }
  
  // Function to mark a step as completed
  function markStepCompleted(stepId) {
    const step = document.getElementById(stepId);
    if (step) {
      step.classList.add('completed');
    }
  }
  
  // Function to show the custom message popup
  async function showcustommsgPopup() {
    // Get custom message settings
    const customSettings = await window.electronAPI.getCustomMessageSettings();
    const displayTimeSeconds = customSettings.displayTime || 5;
    const displayTimeMs = displayTimeSeconds * 1000;
    
    // We're already in this function because shouldShowCustomMessage returned true
    // So we know we should show the popup
    
    // Set popup content based on settings
    custommsgPopupTitle.textContent = customSettings.title || 'Custom Message';
    // Convert newlines to <br> tags for proper HTML rendering
    const messageWithBreaks = (customSettings.message || '').replace(/\n/g, '<br>');
    custommsgPopupMessage.innerHTML = messageWithBreaks;
    
    // Update step text if custommsgStep exists
    if (custommsgStep) {
      const stepText = custommsgStep.querySelector('.step-text');
      if (stepText) {
        stepText.textContent = customSettings.title || 'Custom Message';
      }
    }
    
    return new Promise(resolve => {
      custommsgPopup.classList.remove('hidden');
      
      const progressBar = document.querySelector('.custommsg-popup-progress-bar');
      progressBar.style.width = '0%';
      
      // Animate progress bar
      setTimeout(() => {
        progressBar.style.width = '100%';
      }, 100);

      // Set transition duration to match the display time
      progressBar.style.transition = `width ${displayTimeSeconds}s linear`;
      
      // Close popup and resolve promise after the specified time
      setTimeout(() => {
        custommsgPopup.classList.add('hidden');
        resolve();
      }, displayTimeMs);
    });
  }
  
  // Function to launch OBS
  async function launchOBS() {
    console.log('launchOBS function called');
    updateProgress(40, 'Launching OBS with virtual camera...');
    
    try {
      console.log('Calling window.electronAPI.launchOBS()');
      const result = await window.electronAPI.launchOBS();
      console.log('OBS launch result:', result);
      if (!result.success) {
        console.error('OBS launch failed:', result.message);
        updateProgress(40, `OBS Error: ${result.message}`);
        return false;
      }
      markStepCompleted('obs-step');
      return true;
    } catch (error) {
      console.error('Error launching OBS:', error);
      updateProgress(40, 'Error launching OBS');
      return false;
    }
  }
  
  // Function to launch Meeting Media Manager
  async function launchMediaManager() {
    console.log('launchMediaManager function called');
    updateProgress(70, 'Launching Meeting Media Manager...');
    
    try {
      console.log('Calling window.electronAPI.launchMediaManager()');
      const result = await window.electronAPI.launchMediaManager();
      console.log('Media Manager launch result:', result);
      if (!result.success) {
        console.error('Media Manager launch failed:', result.message);
        updateProgress(70, `Media Manager Error: ${result.message}`);
        return false;
      }
      markStepCompleted('media-manager-step');
      return true;
    } catch (error) {
      console.error('Error launching Meeting Media Manager:', error);
      updateProgress(70, 'Error launching Meeting Media Manager');
      return false;
    }
  }
  
  // Function to launch Zoom
  async function launchZoom() {
    console.log('launchZoom function called');
    updateProgress(90, 'Launching Zoom...');
    
    try {
      console.log('Calling window.electronAPI.launchMediaZoom()');
      const result = await window.electronAPI.launchMediaZoom();
      console.log('Zoom launch result:', result);
      if (!result.success) {
        console.error('Zoom launch failed:', result.message);
        updateProgress(90, `Zoom Error: ${result.message}`);
        return false;
      }
      markStepCompleted('zoom-step');
      return true;
    } catch (error) {
      console.error('Error launching Zoom:', error);
      updateProgress(90, 'Error launching Zoom');
      return false;
    }
  }
  
  // Media Settings Panel Functionality
  
  // Function to update the displayed paths
  async function updatePathDisplays() {
    try {
      // Update OBS path
      const obsPath = await window.electronAPI.getOBSPath();
      const currentOBSPathEl = document.getElementById('current-obs-path');
      if (currentOBSPathEl) {
        if (obsPath) {
          currentOBSPathEl.textContent = obsPath;
        } else {
          currentOBSPathEl.textContent = 'Using default path';
        }
      }
      
      // Update Media Manager path
      const mediaManagerPath = await window.electronAPI.getMediaManagerPath();
      const currentMediaManagerPathEl = document.getElementById('current-media-manager-path');
      if (currentMediaManagerPathEl) {
        if (mediaManagerPath) {
          currentMediaManagerPathEl.textContent = mediaManagerPath;
        } else {
          currentMediaManagerPathEl.textContent = 'Using default path';
        }
      }
      
      // Update Zoom path (used by all Zoom tools)
      const zoomPath = await window.electronAPI.getZoomPath();
      const currentZoomPathEl = document.getElementById('current-zoom-path');
      if (currentZoomPathEl) {
        if (zoomPath) {
          currentZoomPathEl.textContent = zoomPath;
        } else {
          currentZoomPathEl.textContent = 'Using default path';
        }
      }
    } catch (error) {
      console.error('Error updating path displays:', error);
    }
  }
  
  // Function to load custom message settings
  async function loadCustomMessageSettings() {
    try {
      const settings = await window.electronAPI.getCustomMessageSettings();
      
      // Update UI with settings
      if (customMessageDisplayWhen) customMessageDisplayWhen.value = settings.displayWhen || 'none';
      if (customMessageTitle) customMessageTitle.value = settings.title || '';
      if (customMessageText) customMessageText.value = settings.message || '';
      if (customMessageTime) customMessageTime.value = settings.displayTime || 5;

      // Check if custom message should be shown
      const shouldShow = await window.electronAPI.shouldShowCustomMessage();
      
      // Update the visibility of the custom message step in the launch steps list
      custommsgStep.style.display = shouldShow ? '' : 'none';
      
      // Update the step text to use the title value
      if (shouldShow && settings.title) {
        custommsgStep.querySelector('.step-text').textContent = settings.title;
      }
      
      // Remove old enabled-based visibility logic
    } catch (error) {
      console.error('Error loading custom message settings:', error);
    }
  }
  
  // Function to load tool toggle settings
  async function loadToolToggleSettings() {
    try {
      const toggles = await window.electronAPI.getToolToggles();
      
      // Update UI with toggle settings
      // customMessage toggle is deprecated - using displayWhen dropdown instead
      if (toggleOBS) toggleOBS.checked = toggles.launchOBS || false;
      if (toggleMediaManager) toggleMediaManager.checked = toggles.launchMediaManager || false;
      if (toggleZoom) toggleZoom.checked = toggles.launchZoom || false;
      
      // Update step visibility
      updateStepVisibility();
    } catch (error) {
      console.error('Error loading tool toggle settings:', error);
    }
  }
  
  // Function to load meeting ID
  async function loadMeetingId() {
    try {
      const meetingId = await window.electronAPI.getUniversalMeetingId();
      if (meetingIdInput) meetingIdInput.value = meetingId || '';
    } catch (error) {
      console.error('Error loading meeting ID:', error);
    }
  }
  
  // Function to save all media settings
  async function saveAllMediaSettings() {
    try {
      // Save tool toggles
      const toggles = {
        customMessage: false, // Deprecated - using displayWhen instead
        launchOBS: toggleOBS.checked,
        launchMediaManager: toggleMediaManager.checked,
        launchZoom: toggleZoom.checked
      };
      
      // Ensure at least one tool is enabled
      const hasEnabledTool = Object.values(toggles).some(enabled => enabled);
      if (!hasEnabledTool) {
        document.getElementById('media-settings-status').textContent = 'Error: At least one tool must be enabled';
        document.getElementById('media-settings-status').style.color = 'red';
        return false;
      }
      
      await window.electronAPI.saveToolToggles(toggles);
      
      // Save meeting ID
      if (meetingIdInput) await window.electronAPI.saveMeetingId(meetingIdInput.value);
      
      // Save custom message settings
      const customSettings = {
        enabled: customMessageDisplayWhen ? customMessageDisplayWhen.value !== 'none' : false,
        displayWhen: customMessageDisplayWhen ? customMessageDisplayWhen.value : 'none',
        title: customMessageTitle ? customMessageTitle.value : '',
        message: customMessageText ? customMessageText.value : '',
        displayTime: customMessageTime ? parseInt(customMessageTime.value) : 5
      };
      await window.electronAPI.saveCustomMessageSettings(customSettings);
      
      updateStepVisibility();
      
      document.getElementById('media-settings-status').textContent = 'Settings saved successfully';
      document.getElementById('media-settings-status').style.color = '#2563EB';
      return true;
    } catch (error) {
      console.error('Error saving media settings:', error);
      document.getElementById('media-settings-status').textContent = 'Error saving settings';
      document.getElementById('media-settings-status').style.color = 'red';
      return false;
    }
  }
  
  // Function to update step visibility based on toggle settings
  async function updateStepVisibility() {
    // Check if custom message should be shown
    const shouldShowCustomMessage = await window.electronAPI.shouldShowCustomMessage();
    custommsgStep.style.display = shouldShowCustomMessage ? '' : 'none';
    
    document.getElementById('obs-step').style.display = toggleOBS.checked ? '' : 'none';
    document.getElementById('media-manager-step').style.display = toggleMediaManager.checked ? '' : 'none';
    document.getElementById('zoom-step').style.display = toggleZoom.checked ? '' : 'none';
    
    // Update custom message step text
    if (custommsgStep && shouldShowCustomMessage && customMessageTitle && customMessageTitle.value) {
      custommsgStep.querySelector('.step-text').textContent = customMessageTitle.value;
    }
  }
  
  // Toggle settings panel when settings button is clicked - Moved to unified settings
  // if (mediaSettingsBtn) {
  //   mediaSettingsBtn.addEventListener('click', () => {
  //     mediaSettingsPopup.classList.toggle('hidden');
  //     updatePathDisplays(); 
  //     
  //     // Load all settings and update UI
  //     Promise.all([
  //       loadCustomMessageSettings(),
  //       loadToolToggleSettings(),
  //       loadMeetingId()
  //     ]).then(() => {
  //       updateStepVisibility();
  //     });
  //   });
  // }
  
  // Show media help popup when help button is clicked - Removed with old settings
  // if (mediaHelpBtn) {
  //   mediaHelpBtn.addEventListener('click', () => {
  //     mediaHelpPopup.classList.remove('hidden');
  //   });
  // }
  
  // Close media help popup when close button is clicked - Removed with old settings
  // if (closeMediaHelpBtn) {
  //   closeMediaHelpBtn.addEventListener('click', () => {
  //     mediaHelpPopup.classList.add('hidden');
  //   });
  // }
  // 
  // // Close media help popup when footer close button is clicked
  // if (closeMediaHelpFooterBtn) {
  //   closeMediaHelpFooterBtn.addEventListener('click', () => {
  //     mediaHelpPopup.classList.add('hidden');
  //   });
  // }

  // Function to update UI based on current settings
  async function updateCustomMessageUI() {
    const shouldShow = await window.electronAPI.shouldShowCustomMessage();
    if (shouldShow) {
      custommsgStep.style.display = '';
      if (customMessageTitle.value) {
        custommsgStep.querySelector('.step-text').textContent = customMessageTitle.value;
      }
    } else {
      custommsgStep.style.display = 'none';
    }
  }

  // Close settings popup with close button - Removed with old settings
  // if (closeMediaSettingsBtn) {
  //   closeMediaSettingsBtn.addEventListener('click', async () => {
  //     await saveAllMediaSettings();
  //     mediaSettingsPopup.classList.add('hidden');
  //   });
  // }
  // 
  // // Close settings popup with save button
  // if (saveMediaSettingsBtn) {
  //   saveMediaSettingsBtn.addEventListener('click', async () => {
  //     await saveAllMediaSettings();
  //     mediaSettingsPopup.classList.add('hidden');
  //   });
  // }
  // 
  // // Close settings popup when clicking outside
  // if (mediaSettingsPopup) {
  //   mediaSettingsPopup.addEventListener('click', async (e) => {
  //     if (e.target === mediaSettingsPopup) {
  //       await saveAllMediaSettings();
  //       mediaSettingsPopup.classList.add('hidden');
  //     }
  //   });
  // }
  
  // Make help popup close when clicking outside - Removed with old settings
  // if (mediaHelpPopup) {
  //   mediaHelpPopup.addEventListener('click', (e) => {
  //     if (e.target === mediaHelpPopup) {
  //       mediaHelpPopup.classList.add('hidden');
  //     }
  //   });
  // }
  
  // Add event listener for custom message display when dropdown
  if (customMessageDisplayWhen) {
    customMessageDisplayWhen.addEventListener('change', () => {
      updateStepVisibility();
    });
  }
  
  // Add event listeners for all toggle checkboxes
  if (toggleOBS) {
    toggleOBS.addEventListener('change', () => {
      updateStepVisibility();
    });
  }
  
  if (toggleMediaManager) {
    toggleMediaManager.addEventListener('change', () => {
      updateStepVisibility();
    });
  }
  
  if (toggleZoom) {
    toggleZoom.addEventListener('change', () => {
      updateStepVisibility();
    });
  }
  
  // Browse for OBS application
  if (browseOBSPathBtn) {
    browseOBSPathBtn.addEventListener('click', async () => {
      try {
        const obsPath = await window.electronAPI.browseForOBS();
        if (obsPath && currentOBSPath) {
          currentOBSPath.textContent = obsPath;
          showSettingsStatus('OBS path updated successfully', 'success');
        }
      } catch (error) {
        console.error('Error browsing for OBS:', error);
        showSettingsStatus('Error selecting OBS application', 'error');
      }
    });
  }
  
  // Browse for Media Manager application
  if (browseMediaManagerPathBtn) {
    browseMediaManagerPathBtn.addEventListener('click', async () => {
      try {
        const mediaManagerPath = await window.electronAPI.browseForMediaManager();
        if (mediaManagerPath && currentMediaManagerPath) {
          currentMediaManagerPath.textContent = mediaManagerPath;
          showSettingsStatus('Media Manager path updated successfully', 'success');
        }
      } catch (error) {
        console.error('Error browsing for Media Manager:', error);
        showSettingsStatus('Error selecting Media Manager application', 'error');
      }
    });
  }
  
  // Browse for Zoom application
  if (browseZoomPathBtn) {
    browseZoomPathBtn.addEventListener('click', async () => {
      try {
        const zoomPath = await window.electronAPI.browseForZoom();
        if (zoomPath && currentZoomPath) {
          currentZoomPath.textContent = zoomPath;
          showSettingsStatus('Zoom path updated successfully', 'success');
        }
      } catch (error) {
        console.error('Error browsing for Zoom:', error);
        showSettingsStatus('Error selecting Zoom application', 'error');
      }
    });
  }
  
  // Launch Media button click handler
  console.log('Launch Media Button found:', launchMediaBtn);
  if (launchMediaBtn) {
    launchMediaBtn.addEventListener('click', async () => {
      console.log('Launch Media button clicked!');
    try {
      // Get current tool toggle settings
      const toggles = await window.electronAPI.getToolToggles();
      const customSettings = await window.electronAPI.getCustomMessageSettings();
      
      // Check if at least one tool is enabled
      const hasEnabledTool = Object.values(toggles).some(enabled => enabled);
      if (!hasEnabledTool) {
        alert('Error: At least one tool must be enabled in settings.');
        return;
      }
      
      // Show progress container
      launchProgressContainer.classList.remove('hidden');
      updateProgress(10, 'Starting meeting launch sequence...');
      
      // Reset step indicators
      document.querySelectorAll('.launch-steps li').forEach(step => {
        step.classList.remove('completed');
      });
      
      // Check if custom message should be shown
      const shouldShowCustomMessage = await window.electronAPI.shouldShowCustomMessage();
      
      let currentProgress = 20;
      // Count enabled tools (excluding deprecated customMessage)
      const enabledToolsCount = (toggles.launchOBS ? 1 : 0) + 
                               (toggles.launchMediaManager ? 1 : 0) + 
                               (toggles.launchZoom ? 1 : 0) +
                               (shouldShowCustomMessage ? 1 : 0);
      const progressStep = enabledToolsCount > 0 ? 80 / enabledToolsCount : 80;
      
      // Launch tools in sequence based on toggles
      let allSuccessful = true;
      
      // 1. Show custom message if it should be shown
      if (shouldShowCustomMessage) {
        updateProgress(currentProgress, `Showing ${customSettings.title}...`);
        await showcustommsgPopup();
        markStepCompleted('custommsg-step');
        currentProgress += progressStep;
      }
      
      // 2. Launch OBS if enabled
      if (toggles.launchOBS && allSuccessful) {
        updateProgress(currentProgress, 'Launching OBS Studio...');
        if (await launchOBS()) {
          markStepCompleted('obs-step');
          currentProgress += progressStep;
          await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
        } else {
          allSuccessful = false;
        }
      }
      
      // 3. Launch Media Manager if enabled
      if (toggles.launchMediaManager && allSuccessful) {
        updateProgress(currentProgress, 'Launching Meeting Media Manager...');
        if (await launchMediaManager()) {
          markStepCompleted('media-manager-step');
          currentProgress += progressStep;
          await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
        } else {
          allSuccessful = false;
        }
      }
      
      // 4. Launch Zoom if enabled
      if (toggles.launchZoom && allSuccessful) {
        updateProgress(currentProgress, 'Launching Zoom...');
        if (await launchZoom()) {
          markStepCompleted('zoom-step');
          currentProgress += progressStep;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        } else {
          allSuccessful = false;
        }
      }
      
      // Complete the process
      if (allSuccessful) {
        updateProgress(100, 'Meeting launch completed successfully!');
      } else {
        updateProgress(currentProgress, 'Launch completed with some errors. Check the logs for details.');
      }
      
      // Hide progress bar after 3 seconds
      setTimeout(() => {
        launchProgressContainer.classList.add('hidden');
      }, 3000);
      
    } catch (error) {
      console.error('Error during launch sequence:', error);
      updateProgress(0, 'Error occurred during launch sequence');
      setTimeout(() => {
        launchProgressContainer.classList.add('hidden');
      }, 3000);
    }
    });
  } else {
    console.error('Launch Media button not found!');
  }
}

// Onboarding Wizard Implementation
const onboardingWizard = document.getElementById('onboarding-wizard');
const onboardingBackBtn = document.getElementById('onboarding-back');
const onboardingNextBtn = document.getElementById('onboarding-next');
const onboardingSkipBtn = document.getElementById('onboarding-skip');
const onboardingFinishBtn = document.getElementById('onboarding-finish');
const onboardingProgressBar = document.querySelector('.onboarding-progress-bar');

let currentOnboardingStep = 1;
const totalOnboardingSteps = 8;
let onboardingData = {
  meetingId: '',
  midweekDay: 'tuesday',
  midweekTime: '19:30',
  weekendDay: 'sunday',
  weekendTime: '10:00',
  useMediaManager: false,
  useOBS: false,
  pcPurpose: 'other',
  useReminder: false,
  reminderWhen: 'weekend',
  reminderTitle: 'Pre-Meeting Checklist',
  reminderMessage: 'Remember to:\n• Add speaker\'s opening song and photo\n• Wait for media files to sync\n• Check with AV servant for any special items',
  autoLaunch: false,
  missingPaths: []
};

// Show/hide onboarding steps
function showOnboardingStep(stepNumber) {
  // Hide all steps by removing active class
  document.querySelectorAll('.onboarding-step').forEach(step => {
    step.classList.remove('active');
  });
  
  // Show current step
  const currentStepElement = document.getElementById(`onboarding-step-${stepNumber}`);
  if (currentStepElement) {
    currentStepElement.classList.add('active');
  }
  
  // Show complete step if we're done
  if (stepNumber > totalOnboardingSteps) {
    document.getElementById('onboarding-complete').classList.add('active');
    onboardingNextBtn.classList.add('hidden');
    onboardingSkipBtn.classList.add('hidden');
    onboardingFinishBtn.classList.remove('hidden');
  }
  
  // Update progress bar
  const progressPercent = (stepNumber / totalOnboardingSteps) * 100;
  onboardingProgressBar.style.width = `${progressPercent}%`;
  
  // Enable/disable back button
  onboardingBackBtn.disabled = stepNumber <= 1;
  
  // Update button text for step 8
  if (stepNumber === 8 && onboardingData.missingPaths.length > 0) {
    onboardingNextBtn.textContent = 'Next';
  } else if (stepNumber === totalOnboardingSteps) {
    onboardingNextBtn.textContent = 'Complete Setup';
  } else {
    onboardingNextBtn.textContent = 'Next';
  }
  
  // Setup reminder settings visibility toggle
  if (stepNumber === 6) {
    const useReminderRadios = document.querySelectorAll('input[name="use-reminder"]');
    const reminderSettings = document.getElementById('reminder-settings');
    
    useReminderRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.value === 'yes') {
          reminderSettings.style.display = 'block';
        } else {
          reminderSettings.style.display = 'none';
        }
      });
    });
    
    // Set initial state
    const checkedRadio = document.querySelector('input[name="use-reminder"]:checked');
    if (checkedRadio) {
      reminderSettings.style.display = checkedRadio.value === 'yes' ? 'block' : 'none';
    }
  }
}

// Collect data from current step
function collectOnboardingData() {
  switch (currentOnboardingStep) {
    case 1: // Meeting ID
      onboardingData.meetingId = document.getElementById('onboarding-meeting-id').value;
      console.log('Onboarding Step 1 - Meeting ID collected:', onboardingData.meetingId);
      break;
    case 2: // Meeting Times
      onboardingData.midweekDay = document.getElementById('onboarding-midweek-day').value;
      onboardingData.midweekTime = document.getElementById('onboarding-midweek-time').value;
      onboardingData.weekendDay = document.getElementById('onboarding-weekend-day').value;
      onboardingData.weekendTime = document.getElementById('onboarding-weekend-time').value;
      break;
    case 3: // Media Manager
      onboardingData.useMediaManager = document.querySelector('input[name="use-media-manager"]:checked')?.value === 'yes';
      break;
    case 4: // OBS
      onboardingData.useOBS = document.querySelector('input[name="use-obs"]:checked')?.value === 'yes';
      break;
    case 5: // PC Purpose
      onboardingData.pcPurpose = document.getElementById('onboarding-pc-purpose').value;
      break;
    case 6: // Reminder settings (only shown for zoom-host)
      onboardingData.useReminder = document.querySelector('input[name="use-reminder"]:checked')?.value === 'yes';
      if (onboardingData.useReminder) {
        onboardingData.reminderWhen = document.getElementById('onboarding-reminder-when').value;
        onboardingData.reminderTitle = document.getElementById('onboarding-reminder-title').value;
        onboardingData.reminderMessage = document.getElementById('onboarding-reminder-message').value;
      }
      break;
    case 7: // Auto Launch
      onboardingData.autoLaunch = document.querySelector('input[name="auto-launch"]:checked')?.value === 'yes';
      break;
  }
}

// Populate step 8 with missing paths
async function populatePathsStep() {
  const pathsList = document.getElementById('onboarding-paths-list');
  pathsList.innerHTML = '';
  
  if (onboardingData.missingPaths.length === 0) {
    pathsList.innerHTML = '<p class="onboarding-success">✓ All applications found!</p>';
    onboardingNextBtn.textContent = 'Complete Setup';
  } else {
    onboardingData.missingPaths.forEach(({ app, defaultPath }) => {
      const pathItem = document.createElement('div');
      pathItem.className = 'onboarding-path-item';
      pathItem.innerHTML = `
        <div class="path-info">
          <strong>${app}</strong>
          <span class="path-status" id="status-${app.replace(/\s+/g, '-')}">Not found at default location</span>
        </div>
        <button class="browse-btn" data-app="${app}">Browse</button>
      `;
      pathsList.appendChild(pathItem);
      
      // Add browse button handler
      pathItem.querySelector('.browse-btn').addEventListener('click', async (e) => {
        const appName = e.target.dataset.app;
        try {
          const appPath = await window.electronAPI.onboardingBrowsePath(appName);
          if (appPath) {
            // Save the path
            const result = await window.electronAPI.onboardingSavePath(appName, appPath);
            if (result.success) {
              // Update UI
              const statusElement = document.getElementById(`status-${appName.replace(/\s+/g, '-')}`);
              statusElement.textContent = '✓ Found';
              statusElement.style.color = 'var(--success-color)';
              e.target.disabled = true;
              e.target.textContent = 'Set';
              
              // Check if all paths are now set
              const allSet = Array.from(pathsList.querySelectorAll('.browse-btn')).every(btn => btn.disabled);
              if (allSet) {
                onboardingNextBtn.textContent = 'Complete Setup';
              }
            }
          }
        } catch (error) {
          console.error('Error browsing for path:', error);
        }
      });
    });
  }
}

// Handle next button
onboardingNextBtn.addEventListener('click', async () => {
  collectOnboardingData();
  
  // Handle step transitions
  if (currentOnboardingStep === 5) {
    // After PC purpose, skip step 6 if not zoom-host
    if (onboardingData.pcPurpose !== 'zoom-host') {
      currentOnboardingStep = 7; // Skip to auto-launch
    } else {
      currentOnboardingStep++;
    }
  } else if (currentOnboardingStep === 7) {
    // After auto-launch, check for missing application paths
    try {
      onboardingData.missingPaths = await window.electronAPI.onboardingCheckPaths(onboardingData);
      
      if (onboardingData.missingPaths.length === 0) {
        // Skip step 8 if all paths are found, but still need to apply settings
        currentOnboardingStep = totalOnboardingSteps; // Go to apply settings step
      } else {
        // Show step 8 to configure missing paths
        currentOnboardingStep++;
        await populatePathsStep();
      }
    } catch (error) {
      console.error('Error checking paths:', error);
      currentOnboardingStep++;
    }
  } else if (currentOnboardingStep === totalOnboardingSteps || currentOnboardingStep === 8) {
    // Apply settings and complete onboarding
    try {
      // Collect data from all previous steps one more time to ensure we have everything
      console.log('Final step - Collecting all onboarding data...');
      
      // Re-collect meeting ID to ensure it's not lost
      const meetingIdValue = document.getElementById('onboarding-meeting-id').value;
      if (meetingIdValue) {
        onboardingData.meetingId = meetingIdValue;
      }
      
      console.log('Onboarding - Sending data to backend:', onboardingData);
      console.log('Onboarding - Meeting ID being sent:', onboardingData.meetingId);
      
      let result;
      try {
        console.log('Calling IPC: onboardingApplySettings...');
        result = await window.electronAPI.onboardingApplySettings(onboardingData);
        console.log('Onboarding - Apply settings result:', result);
      } catch (ipcError) {
        console.error('IPC Error when applying settings:', ipcError);
        throw ipcError;
      }
      
      if (result && result.success) {
        currentOnboardingStep = totalOnboardingSteps + 1; // Go to completion step
      } else {
        console.error('Error applying settings:', result ? result.error : 'Unknown error');
        alert('Error applying settings. Please try again.');
      }
    } catch (error) {
      console.error('Error during onboarding completion:', error);
      alert('Error completing setup. Please try again.');
    }
  } else {
    currentOnboardingStep++;
  }
  
  showOnboardingStep(currentOnboardingStep);
});

// Handle back button
onboardingBackBtn.addEventListener('click', () => {
  if (currentOnboardingStep > 1) {
    // Handle special cases for going back
    if (currentOnboardingStep === totalOnboardingSteps + 1 && onboardingData.missingPaths.length === 0) {
      currentOnboardingStep = 7; // Go back to auto-launch
    } else if (currentOnboardingStep === 7 && onboardingData.pcPurpose !== 'zoom-host') {
      currentOnboardingStep = 5; // Skip reminder step when going back
    } else {
      currentOnboardingStep--;
    }
    showOnboardingStep(currentOnboardingStep);
  }
});

// Handle skip button
onboardingSkipBtn.addEventListener('click', () => {
  onboardingWizard.classList.add('hidden');
});

// Handle finish button
onboardingFinishBtn.addEventListener('click', async () => {
  onboardingWizard.classList.add('hidden');
  
  // Verify settings were saved (add delay to ensure file write completes)
  setTimeout(async () => {
    console.log('Onboarding completed - Verifying saved settings...');
    try {
      const universalSettings = await window.electronAPI.getUniversalSettings();
      console.log('Universal settings after onboarding:', universalSettings);
      console.log('Meeting ID after onboarding:', universalSettings.meetingId);
      
      // Reload settings in the UI
      await loadUnifiedSettings();
    } catch (error) {
      console.error('Error verifying settings after onboarding:', error);
    }
  }, 1000); // Increased delay to ensure file operations complete
  
  // Open the default tool if configured
  if (onboardingData.pcPurpose === 'zoom-host') {
    mediaLauncherBtn.click();
  } else if (onboardingData.pcPurpose === 'zoom-attendant') {
    startZoomBtn.click();
  }
});

// Check if onboarding should be shown on startup
async function checkOnboarding() {
  try {
    console.log('Checking if onboarding should be shown...');
    const isFirstLaunch = await window.electronAPI.onboardingCheckFirstLaunch();
    console.log('Is first launch:', isFirstLaunch);
    if (isFirstLaunch) {
      onboardingWizard.classList.remove('hidden');
      showOnboardingStep(1);
    }
  } catch (error) {
    console.error('Error checking first launch:', error);
  }
}

// Initialize media launcher elements
function initMediaLauncherElements() {
  // Media launcher elements are already initialized in initializeMediaLauncher()
  if (typeof initializeMediaLauncher === 'function') {
    initializeMediaLauncher();
  }
}

// Load app settings
async function loadAppSettings() {
  try {
    if (window.electronAPI) {
      const settings = await window.electronAPI.getAppSettings();
      if (settings) {
        // Apply settings
        if (defaultToolSelect) {
          defaultToolSelect.value = settings.defaultTool || 'welcome-screen';
        }
        if (alwaysMaximizeCheckbox) {
          alwaysMaximizeCheckbox.checked = settings.alwaysMaximize || false;
        }
        if (runAtLogonCheckbox) {
          runAtLogonCheckbox.checked = settings.runAtLogon || false;
        }
        
        // Open default tool if configured
        if (settings.defaultTool && settings.defaultTool !== 'welcome-screen') {
          // Wait a bit for everything to initialize
          setTimeout(() => {
            const toolButton = document.querySelector(`[id$="${settings.defaultTool.replace('-calculator', '-btn').replace('-', '-btn')}"]`);
            if (toolButton) {
              toolButton.click();
            }
          }, 100);
        }
      }
    }
  } catch (error) {
    console.error('Error loading app settings:', error);
  }
}

// Check for updates
function checkForUpdates() {
  // Auto-update functionality is already set up earlier in the code
  // This function is just a placeholder as the update check happens automatically
  console.log('Update check initiated');
}

// Initialize app on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize all the unified settings elements
  settingsNavBtns = document.querySelectorAll('.settings-nav-btn');
  settingsPanels = document.querySelectorAll('.settings-panel');
  saveUnifiedSettingsBtn = document.getElementById('save-unified-settings');
  settingsStatus = document.getElementById('settings-status');
  universalMeetingId = document.getElementById('universal-meeting-id');
  midweekDay = document.getElementById('midweek-day');
  midweekTime = document.getElementById('midweek-time');
  weekendDay = document.getElementById('weekend-day');
  weekendTime = document.getElementById('weekend-time');
  
  // Initialize media launcher settings elements
  customMessageDisplayWhen = document.getElementById('custom-message-display-when');
  toggleOBS = document.getElementById('toggle-obs');
  toggleMediaManager = document.getElementById('toggle-media-manager');
  toggleZoom = document.getElementById('toggle-zoom');
  customMessageTitle = document.getElementById('custom-message-title');
  customMessageText = document.getElementById('custom-message-text');
  customMessageTime = document.getElementById('custom-message-time');
  
  // Initialize browse button elements
  browseOBSPathBtn = document.getElementById('browse-obs-path-btn');
  browseMediaManagerPathBtn = document.getElementById('browse-media-manager-path-btn');
  browseZoomPathBtn = document.getElementById('browse-zoom-path-btn');
  currentOBSPath = document.getElementById('current-obs-path');
  currentMediaManagerPath = document.getElementById('current-media-manager-path');
  currentZoomPath = document.getElementById('current-zoom-path');
  
  // Initialize media launcher elements
  initMediaLauncherElements();
  
  // Load app settings
  loadAppSettings();
  
  // Check for updates
  checkForUpdates();
  
  // Set up console redirection listener
  if (window.electronAPI && window.electronAPI.onConsoleMessage) {
    window.electronAPI.onConsoleMessage((data) => {
      if (data.args && Array.isArray(data.args)) {
        console[data.level](...data.args);
      } else {
        console[data.level](data.message || data);
      }
    });
  }
  
  // Check if onboarding should be shown
  await checkOnboarding();
});