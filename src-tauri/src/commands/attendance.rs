use crate::domain::attendance;
use crate::error::{AppError, AppResult};

#[tauri::command]
pub fn calculate_attendance(poll: Vec<u32>) -> AppResult<u32> {
    attendance::validate(&poll).map_err(AppError::other)?;
    Ok(attendance::calculate(&poll))
}
