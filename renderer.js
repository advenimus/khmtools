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
const defaultToolSelect = document.getElementById('default-tool');
const alwaysMaximizeCheckbox = document.getElementById('always-maximize');

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

  console.log('Launch Zoom Button:', launchZoomBtn);
  console.log('Settings Button:', zoomSettingsBtn);
  console.log('Browse Button:', browseZoomPathBtn);
  console.log('Settings Panel:', zoomSettingsPanel);
  
  // Function to update the displayed Zoom path
  async function updateZoomPathDisplay() {
    try {
      const zoomPath = await window.electronAPI.getZoomPath();
      if (zoomPath) {
        currentZoomPath.textContent = zoomPath;
      } else {
        currentZoomPath.textContent = 'No path configured';
      }
    } catch (error) {
      console.error('Error getting Zoom path:', error);
      currentZoomPath.textContent = 'Error getting Zoom path';
    }
  }
  
  // Initialize the Zoom path display when the tool is shown
  startZoomBtn.addEventListener('click', updateZoomPathDisplay);
  
  // Toggle settings panel when settings button is clicked
  zoomSettingsBtn.addEventListener('click', () => {
    console.log('Settings button clicked, toggling panel');
    zoomSettingsPanel.classList.toggle('hidden');
    updateZoomPathDisplay();
  });
  
  // Browse for Zoom application
  browseZoomPathBtn.addEventListener('click', async () => {
    try {
      console.log('Browse button clicked');
      const zoomPath = await window.electronAPI.browseForZoom();
      if (zoomPath) {
        currentZoomPath.textContent = zoomPath;
        zoomStatus.textContent = 'Zoom path updated successfully';
        zoomStatus.style.color = '#4a6da7';
      }
    } catch (error) {
      console.error('Error browsing for Zoom:', error);
      zoomStatus.textContent = 'Error selecting Zoom application';
      zoomStatus.style.color = 'red';
    }
  });
  
  // Launch Zoom
  launchZoomBtn.addEventListener('click', async () => {
    console.log('Launch Zoom button clicked');
    zoomStatus.textContent = 'Launching Zoom...';
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
}