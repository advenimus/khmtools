use crate::error::{AppError, AppResult};
use serde::{de::DeserializeOwned, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

pub const APP_DIR: &str = "com.khmtools.app";

pub fn app_data_dir() -> AppResult<PathBuf> {
    let base = dirs::config_dir().ok_or(AppError::ConfigDirMissing)?;
    let dir = base.join(APP_DIR);
    if !dir.exists() {
        fs::create_dir_all(&dir)?;
    }
    Ok(dir)
}

pub fn logs_dir() -> AppResult<PathBuf> {
    let dir = app_data_dir()?.join("logs");
    if !dir.exists() {
        fs::create_dir_all(&dir)?;
    }
    Ok(dir)
}

pub fn file_path(name: &str) -> AppResult<PathBuf> {
    Ok(app_data_dir()?.join(name))
}

pub fn load_or_default<T: DeserializeOwned + Default>(name: &str) -> T {
    match file_path(name).and_then(|p| read_json(&p)) {
        Ok(Some(v)) => v,
        _ => T::default(),
    }
}

pub fn save<T: Serialize>(name: &str, value: &T) -> AppResult<()> {
    let path = file_path(name)?;
    write_atomic(&path, value)
}

fn read_json<T: DeserializeOwned>(path: &Path) -> AppResult<Option<T>> {
    if !path.exists() {
        return Ok(None);
    }
    let raw = fs::read_to_string(path)?;
    let value = serde_json::from_str(&raw)?;
    Ok(Some(value))
}

pub fn write_atomic<T: Serialize>(path: &Path, value: &T) -> AppResult<()> {
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)?;
        }
    }
    let tmp = path.with_extension("tmp");
    let json = serde_json::to_string_pretty(value)?;
    fs::write(&tmp, json)?;
    fs::rename(&tmp, path)?;
    Ok(())
}

pub fn marker_exists(name: &str) -> bool {
    file_path(name).map(|p| p.exists()).unwrap_or(false)
}

pub fn marker_set(name: &str) -> AppResult<()> {
    let path = file_path(name)?;
    fs::write(path, chrono::Utc::now().to_rfc3339())?;
    Ok(())
}

pub fn marker_clear(name: &str) -> AppResult<()> {
    let path = file_path(name)?;
    if path.exists() {
        fs::remove_file(path)?;
    }
    Ok(())
}

pub fn delete_files(names: &[&str]) -> AppResult<()> {
    for name in names {
        let path = file_path(name)?;
        if path.exists() {
            fs::remove_file(&path)?;
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde::Deserialize;

    #[derive(Default, Serialize, Deserialize, PartialEq, Debug)]
    struct Sample {
        a: u32,
        b: String,
    }

    #[test]
    fn round_trip() {
        let path = std::env::temp_dir().join(format!("khmtools-test-{}.json", std::process::id()));
        let v = Sample {
            a: 5,
            b: "hi".into(),
        };
        write_atomic(&path, &v).unwrap();
        let back: Option<Sample> = read_json(&path).unwrap();
        assert_eq!(back, Some(v));
        let _ = fs::remove_file(&path);
    }
}
