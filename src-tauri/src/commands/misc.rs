use crate::storage;

#[tauri::command]
pub fn open_url(url: String) -> Result<(), String> {
    opener::open(url).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn open_logs_dir() -> Result<(), String> {
    let dir = storage::logs_dir().map_err(|e| e.to_string())?;
    opener::open(dir).map_err(|e| e.to_string())
}
