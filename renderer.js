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
const saveAppSettings = document.getElementById('save-app-settings');
const resetSettingsBtn = document.getElementById('reset-settings-btn');
const resetConfirmation = document.getElementById('reset-confirmation');
const defaultToolSelect = document.getElementById('default-tool');
const alwaysMaximizeCheckbox = document.getElementById('always-maximize');
const toggleDevToolsBtn = document.getElementById('toggle-dev-tools-btn');

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
    
    // Load custom message settings and update UI when Media Launcher is opened
    if (window.electronAPI) {
      window.electronAPI.getCustomMessageSettings().then(settings => {
        // Update the visibility of the custom message step based only on enabled setting
        custommsgStep.style.display = settings.enabled ? '' : 'none';
        
        // Update the step text to use the title value
        if (settings.enabled && settings.title) {
          custommsgStep.querySelector('.step-text').textContent = settings.title;
        }
      });
    }
  });
}

// Logo click handler - open GitHub repository
if (logoLink && window.electronAPI) {
  logoLink.addEventListener('click', (e) => {
    e.preventDefault();
    // This opens the URL in the user's default browser in a new window
    window.electronAPI.openExternal('https://github.com/advenimus/jwtools');
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
          window.electronAPI.openExternal('https://github.com/advenimus/jwtools/releases');
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
  console.log('Settings Button:', zoomSettingsBtn);
  console.log('Browse Button:', browseZoomPathBtn);
  
  // Function to update the displayed Zoom path and meeting ID
  async function updateZoomSettings() {
    try {
      // Update Zoom path
      const zoomPath = await window.electronAPI.getZoomPath();
      if (zoomPath) {
        currentZoomPath.textContent = zoomPath;
      } else {
        currentZoomPath.textContent = 'No path configured';
      }
      
      // Update Meeting ID
      const meetingId = await window.electronAPI.getZoomMeetingId();
      if (meetingId) {
        zoomMeetingIdInput.value = meetingId;
      } else {
        zoomMeetingIdInput.value = '';
      }
    } catch (error) {
      console.error('Error getting Zoom settings:', error);
      currentZoomPath.textContent = 'Error getting Zoom path';
    }
  }
  
  // Initialize the Zoom settings display when the tool is shown
  startZoomBtn.addEventListener('click', updateZoomSettings);
  
  // Open settings popup when settings button is clicked
  zoomSettingsBtn.addEventListener('click', () => {
    console.log('Settings button clicked, opening popup');
    zoomSettingsPopup.classList.remove('hidden');
    updateZoomSettings();
  });
  
  // Close settings popup
  closeZoomSettings.addEventListener('click', () => {
    zoomSettingsPopup.classList.add('hidden');
  });
  
  // Close settings popup when clicking outside
  zoomSettingsPopup.addEventListener('click', (e) => {
    if (e.target === zoomSettingsPopup) {
      zoomSettingsPopup.classList.add('hidden');
    }
  });
  
  // Browse for Zoom application
  browseZoomPathBtn.addEventListener('click', async () => {
    try {
      console.log('Browse button clicked');
      const zoomPath = await window.electronAPI.browseForZoom();
      if (zoomPath) {
        currentZoomPath.textContent = zoomPath;
        meetingIdStatus.textContent = 'Zoom path updated successfully';
        meetingIdStatus.style.color = '#4a6da7';
        
        // Clear status after 3 seconds
        setTimeout(() => {
          meetingIdStatus.textContent = '';
        }, 3000);
      }
    } catch (error) {
      console.error('Error browsing for Zoom:', error);
      meetingIdStatus.textContent = 'Error selecting Zoom application';
      meetingIdStatus.style.color = 'red';
    }
  });
  
  // Save Settings button
  saveZoomSettingsBtn.addEventListener('click', async () => {
    const meetingId = zoomMeetingIdInput.value.trim();
    try {
      const result = await window.electronAPI.saveZoomMeetingId(meetingId);
      if (result.success) {
        meetingIdStatus.textContent = 'Settings saved successfully';
        meetingIdStatus.style.color = '#4a6da7';
        
        // Clear status after 3 seconds
        setTimeout(() => {
          meetingIdStatus.textContent = '';
          // Close the popup
          zoomSettingsPopup.classList.add('hidden');
        }, 1500);
      }
    } catch (error) {
      console.error('Error saving meeting ID:', error);
      meetingIdStatus.textContent = 'Error saving settings';
      meetingIdStatus.style.color = 'red';
    }
  });
  
  // Launch Zoom
  launchZoomBtn.addEventListener('click', async () => {
    console.log('Launch Zoom button clicked');
    
    // Check if there's a meeting ID
    const meetingId = await window.electronAPI.getZoomMeetingId();
    
    if (!meetingId) {
      // If no meeting ID is set, show the settings popup and prompt the user
      zoomSettingsPopup.classList.remove('hidden');
      zoomStatus.textContent = 'Please enter a meeting ID in the settings';
      zoomStatus.style.color = 'orange';
      
      // Focus the meeting ID input
      zoomMeetingIdInput.focus();
      return;
    }
    
    // Launch Zoom with the existing meeting ID
    zoomStatus.textContent = 'Launching Zoom meeting...';
    const result = await window.electronAPI.launchZoom();
    zoomStatus.textContent = result.message;
    zoomStatus.style.color = result.success ? '#4a6da7' : 'red';
  });
} else {
  console.error('electronAPI is not available');
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
    } catch (error) {
      console.error('Error loading app settings:', error);
    }
  });
  
  // Open settings popup
  appSettingsBtn.addEventListener('click', () => {
    appSettingsPopup.classList.remove('hidden');
  });
  
  // Close settings popup
  closeAppSettings.addEventListener('click', () => {
    appSettingsPopup.classList.add('hidden');
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
  
  // Save settings
  saveAppSettings.addEventListener('click', async () => {
    try {
      const settings = {
        alwaysMaximize: alwaysMaximizeCheckbox.checked,
        defaultTool: defaultToolSelect.value
      };
      
      const result = await window.electronAPI.saveAppSettings(settings);
      
      if (result.success) {
        // Show success message or visual feedback
        const successMessage = document.createElement('div');
        successMessage.className = 'settings-saved-message';
        successMessage.textContent = 'Settings saved successfully!';
        
        const footer = document.querySelector('.app-settings-footer');
        footer.appendChild(successMessage);
        
        // Remove the message after a few seconds
        setTimeout(() => {
          successMessage.remove();
        }, 3000);
        
        // Close the popup
        appSettingsPopup.classList.add('hidden');
      }
    } catch (error) {
      console.error('Error saving app settings:', error);
    }
  });

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
          // Reload settings to show defaults
          const appSettings = await window.electronAPI.getAppSettings();
          alwaysMaximizeCheckbox.checked = appSettings.alwaysMaximize || false;
          defaultToolSelect.value = appSettings.defaultTool || 'welcome-screen';
        }
      } catch (error) {
        console.error('Error resetting settings:', error);
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
  const custommsgPopupMessage = document.querySelector('.custommsg-popup-content p');
  const custommsgStep = document.getElementById('custommsg-step');
  
  const mediaSettingsBtn = document.getElementById('media-settings-btn');
  const mediaSettingsPopup = document.getElementById('media-settings-popup');
  const saveMediaSettingsBtn = document.getElementById('save-media-settings-btn');
  const closeMediaSettingsBtn = document.getElementById('close-media-settings-btn');
  const mediaHelpBtn = document.getElementById('media-help-btn');
  const mediaHelpPopup = document.getElementById('media-help-popup');
  const closeMediaHelpBtn = document.getElementById('close-media-help-btn');
  const closeMediaHelpFooterBtn = document.getElementById('close-media-help-footer-btn');
  const browseOBSPathBtn = document.getElementById('browse-obs-path-btn');
  const browseMediaManagerPathBtn = document.getElementById('browse-media-manager-path-btn');
  const browseMediaZoomPathBtn = document.getElementById('browse-media-zoom-path-btn');
  const currentOBSPath = document.getElementById('current-obs-path');
  const currentMediaManagerPath = document.getElementById('current-media-manager-path');
  const currentMediaZoomPath = document.getElementById('current-media-zoom-path');
  const customMessageEnabled = document.getElementById('custom-message-enabled');
  const customMessageSettings = document.getElementById('custom-message-settings');
  const customMessageTitle = document.getElementById('custom-message-title');
  const customMessageText = document.getElementById('custom-message-text');
  const customMessageTime = document.getElementById('custom-message-time');
  
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
    const displayTime = customSettings.displayTime || 5000;
    
    // Determine if we should use custom message
    // Only check if the enable custom message option is checked
    const useCustomMessage = customSettings.enabled;
    
    // If custom message is enabled and has content, show it
    if (useCustomMessage) {
      // Set popup content based on settings
      custommsgPopupTitle.textContent = customSettings.title || 'Custom Message';
      custommsgPopupMessage.textContent = customSettings.message || '';
      custommsgStep.querySelector('.step-text').textContent = customSettings.title;
      
      return new Promise(resolve => {
        custommsgPopup.classList.remove('hidden');
        
        const progressBar = document.querySelector('.custommsg-popup-progress-bar');
        progressBar.style.width = '0%';
        
        // Animate progress bar
        setTimeout(() => {
          progressBar.style.width = '100%';
        }, 100);

        // Set transition duration to match the display time
        progressBar.style.transition = `width ${displayTime/1000}s linear`;
        
        // Close popup and resolve promise after the specified time
        setTimeout(() => {
          custommsgPopup.classList.add('hidden');
          resolve();
        }, displayTime);
      });
    } else {
      // If custom message is disabled or empty, skip this step entirely
      // Hide the custommsg step in the launch sequence
      custommsgStep.style.display = 'none';
      
      // Immediately resolve the promise to continue with the next step
      return Promise.resolve();
    }
  }
  
  // Function to launch OBS
  async function launchOBS() {
    updateProgress(40, 'Launching OBS with virtual camera...');
    
    try {
      const result = await window.electronAPI.launchOBS();
      if (!result.success) {
        updateProgress(40, `Error: ${result.message}`);
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
    updateProgress(70, 'Launching Meeting Media Manager...');
    
    try {
      const result = await window.electronAPI.launchMediaManager();
      if (!result.success) {
        updateProgress(70, `Error: ${result.message}`);
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
    updateProgress(90, 'Launching Zoom...');
    
    try {
      const result = await window.electronAPI.launchMediaZoom();
      if (!result.success) {
        updateProgress(90, `Error: ${result.message}`);
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
      if (obsPath) {
        currentOBSPath.textContent = obsPath;
      } else {
        currentOBSPath.textContent = 'Using default path';
      }
      
      // Update Media Manager path
      const mediaManagerPath = await window.electronAPI.getMediaManagerPath();
      if (mediaManagerPath) {
        currentMediaManagerPath.textContent = mediaManagerPath;
      } else {
        currentMediaManagerPath.textContent = 'Using default path';
      }
      
      // Update Zoom path
      const zoomPath = await window.electronAPI.getMediaZoomPath();
      if (zoomPath) {
        currentMediaZoomPath.textContent = zoomPath;
      } else {
        currentMediaZoomPath.textContent = 'Using default path';
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
      customMessageEnabled.checked = settings.enabled || false;
      customMessageTitle.value = settings.title || '';
      customMessageText.value = settings.message || '';
      customMessageTime.value = Math.floor((settings.displayTime || 5000) / 1000);

      // Update the visibility of the custom message step in the launch steps list based only on enabled setting
      custommsgStep.style.display = settings.enabled ? '' : 'none';
      
      // Update the step text to use the title value
      if (settings.enabled && settings.title) {
        custommsgStep.querySelector('.step-text').textContent = settings.title;
      }
      
      // Show/hide custom message settings based on enabled state
      if (settings.enabled) {
        customMessageSettings.classList.remove('hidden');
      } else {
        customMessageSettings.classList.add('hidden');
      }
    } catch (error) {
      console.error('Error loading custom message settings:', error);
    }
  }
  
  // Toggle settings panel when settings button is clicked
  mediaSettingsBtn.addEventListener('click', () => {
    mediaSettingsPopup.classList.toggle('hidden');
    updatePathDisplays(); 
    
    // Load custom message settings and update UI
    loadCustomMessageSettings().then(() => {
      // Ensure the custom message step visibility is updated
      const isEnabled = customMessageEnabled.checked; 
      custommsgStep.style.display = isEnabled ? '' : 'none';
    });
  });
  
  // Show media help popup when help button is clicked
  mediaHelpBtn.addEventListener('click', () => {
    mediaHelpPopup.classList.remove('hidden');
  });
  
  // Close media help popup when close button is clicked
  closeMediaHelpBtn.addEventListener('click', () => {
    mediaHelpPopup.classList.add('hidden');
  });
  
  // Close media help popup when footer close button is clicked
  closeMediaHelpFooterBtn.addEventListener('click', () => {
    mediaHelpPopup.classList.add('hidden');
  });

  // Close settings popup with close button
  closeMediaSettingsBtn.addEventListener('click', () => {
    mediaSettingsPopup.classList.add('hidden');
  });
  
  // Close settings popup with save button
  saveMediaSettingsBtn.addEventListener('click', () => {
    // Save custom message settings
    const settings = {
      enabled: customMessageEnabled.checked,
      title: customMessageTitle.value,
      message: customMessageText.value,
      displayTime: parseInt(customMessageTime.value) * 1000 // Convert seconds to milliseconds
    };
    
    window.electronAPI.saveCustomMessageSettings(settings)
      .then(result => {
        if (result && result.success) {
          document.getElementById('media-settings-status').textContent = 'Settings saved successfully';
          document.getElementById('media-settings-status').style.color = '#4a6da7';
        }
      })
      .catch(error => console.error('Error saving custom message settings:', error));
    
    // Update the visibility of the custom message step based on new settings
    custommsgStep.style.display = settings.enabled ? '' : 'none';
    
    mediaSettingsPopup.classList.add('hidden');
  });
  
  // Close settings popup when clicking outside
  mediaSettingsPopup.addEventListener('click', (e) => {
    if (e.target === mediaSettingsPopup) {
      mediaSettingsPopup.classList.add('hidden');
    }
  });
  
  // Make help popup close when clicking outside
  mediaHelpPopup.addEventListener('click', (e) => {
    if (e.target === mediaHelpPopup) {
      mediaHelpPopup.classList.add('hidden');
    }
  });
  
  // Toggle custom message settings visibility when checkbox is clicked
  customMessageEnabled.addEventListener('change', () => {
    if (customMessageEnabled.checked) {
      // Check if there's content to determine if step should be shown
      custommsgStep.style.display = '';
      
      // Show the settings panel
      customMessageSettings.classList.remove('hidden');
    } else {
      // Hide the step when disabled
      custommsgStep.style.display = 'none';
      
      // Hide the settings panel
      customMessageSettings.classList.add('hidden');
    }
  });
  
  // Browse for OBS application
  browseOBSPathBtn.addEventListener('click', async () => {
    try {
      const obsPath = await window.electronAPI.browseForOBS();
      if (obsPath) {
        currentOBSPath.textContent = obsPath;
        document.getElementById('media-settings-status').textContent = 'OBS path updated successfully';
        document.getElementById('media-settings-status').style.color = '#4a6da7';
      }
    } catch (error) {
      console.error('Error browsing for OBS:', error);
      document.getElementById('media-settings-status').textContent = 'Error selecting OBS application';
      document.getElementById('media-settings-status').style.color = 'red';
    }
  });
  
  // Browse for Media Manager application
  browseMediaManagerPathBtn.addEventListener('click', async () => {
    try {
      const mediaManagerPath = await window.electronAPI.browseForMediaManager();
      if (mediaManagerPath) {
        currentMediaManagerPath.textContent = mediaManagerPath;
        document.getElementById('media-settings-status').textContent = 'Media Manager path updated successfully';
        document.getElementById('media-settings-status').style.color = '#4a6da7';
      }
    } catch (error) {
      console.error('Error browsing for Media Manager:', error);
      document.getElementById('media-settings-status').textContent = 'Error selecting Media Manager application';
      document.getElementById('media-settings-status').style.color = 'red';
    }
  });
  
  // Browse for Zoom application
  browseMediaZoomPathBtn.addEventListener('click', async () => {
    try {
      const zoomPath = await window.electronAPI.browseForMediaZoom();
      if (zoomPath) {
        currentMediaZoomPath.textContent = zoomPath;
        document.getElementById('media-settings-status').textContent = 'Zoom path updated successfully';
        document.getElementById('media-settings-status').style.color = '#4a6da7';
      }
    } catch (error) {
      console.error('Error browsing for Zoom:', error);
      document.getElementById('media-settings-status').textContent = 'Error selecting Zoom application';
      document.getElementById('media-settings-status').style.color = 'red';
    }
  });
  
  // Launch Media button click handler
  launchMediaBtn.addEventListener('click', async () => {
    // Show progress container
    
    // Get custom message settings to determine if we should show the step
    const customSettings = await window.electronAPI.getCustomMessageSettings();
    const useCustomMessage = customSettings.enabled;
    launchProgressContainer.classList.remove('hidden');
    updateProgress(10, 'Starting launch sequence...');
    
    // Reset step indicators
    document.querySelectorAll('.launch-steps li').forEach(step => {
      step.classList.remove('completed');
    });
    
    // If custom message is enabled, show appropriate status message
    if (useCustomMessage) {
      updateProgress(20, `Showing ${customSettings.title}...`);
    } else {
      // Skip directly to OBS if no custom message
      updateProgress(20, 'Preparing to launch OBS...');
    }
    
    // Show custom message popup if enabled
    if (useCustomMessage) {
      await showcustommsgPopup();
      // Mark step as completed after popup is closed
      markStepCompleted('custommsg-step');
    }
    
    // Launch OBS and wait 3 seconds
    if (await launchOBS()) {
      setTimeout(async () => {
        // Launch Meeting Media Manager and wait 3 seconds
        if (await launchMediaManager()) {
          setTimeout(async () => {
            // Launch Zoom
            if (await launchZoom()) {
              setTimeout(() => {
                // Complete the process
                updateProgress(100, 'All applications launched successfully!');
                
                // Hide progress bar after 3 seconds
                setTimeout(() => {
                  launchProgressContainer.classList.add('hidden');
                }, 3000);
              }, 1000);
            }
          }, 3000);
        }
      }, 3000);
    }
  });
}