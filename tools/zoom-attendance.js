const { ipcMain } = require('electron');

// Initialize Zoom Attendance Calculator IPC handlers
function initZoomAttendance() {
  // Handle attendance calculation request
  ipcMain.on('calculate-attendance', (event, pollResults) => {
    try {
      // Calculate attendance
      let total = 0;
      
      // For options 1-10, multiply count by its value
      for (let i = 0; i < 10; i++) {
        total += pollResults[i] * (i + 1);
      }
      
      // For phone option (11th option), count as 1 person each
      total += pollResults[10];
      
      // Send the result back to the renderer
      event.sender.send('attendance-calculated', total);
    } catch (error) {
      console.error('Error calculating attendance:', error);
      event.sender.send('attendance-calculated', 0);
    }
  });
}

module.exports = {
  initZoomAttendance
};