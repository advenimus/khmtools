// DOM Elements
const zoomAttendanceBtn = document.getElementById('zoom-attendance-btn');
const welcomeScreen = document.getElementById('welcome-screen');
const zoomAttendanceCalculator = document.getElementById('zoom-attendance-calculator');
const resultView = document.getElementById('result-view');
const attendanceForm = document.getElementById('attendance-form');
const attendanceResult = document.getElementById('attendance-result');

const backButton = document.getElementById('back-button');
const calculateAgainButton = document.getElementById('calculate-again-button');

const toolPanels = document.querySelectorAll('.tool-panel');
const toolButtons = document.querySelectorAll('.tool-button');
const updateNotification = document.getElementById('update-notification');
const updateMessage = document.getElementById('update-message');
const updateButton = document.getElementById('update-button');

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

// Auto-update functionality
if (window.electronAPI) {
  // When an update is available
  window.electronAPI.onUpdateAvailable((info) => {
    updateMessage.textContent = `Version ${info.version} is available!`;
    updateNotification.classList.remove('hidden');
  });

  // When an update has been downloaded
  window.electronAPI.onUpdateDownloaded((info) => {
    updateMessage.textContent = `Version ${info.version} is ready to install`;
    updateButton.textContent = 'Restart and Install';
    updateNotification.classList.remove('hidden');
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