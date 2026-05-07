use crate::domain::attendance;

#[tauri::command]
pub fn calculate_attendance(poll: Vec<u32>) -> u32 {
    attendance::calculate(&poll)
}
