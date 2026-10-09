use crate::error::{AppError, AppResult};
use serde::{de::DeserializeOwned, Serialize};
use std::fs::{self, File};
use std::io::{ErrorKind, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;
use std::thread;
use std::time::Duration;

pub const APP_DIR: &str = "com.khmtools.app";

const RENAME_ATTEMPTS: u32 = 5;
const RENAME_RETRY_DELAY: Duration = Duration::from_millis(50);

static WRITE_LOCK: Mutex<()> = Mutex::new(());
static TMP_COUNTER: AtomicU64 = AtomicU64::new(0);

pub fn app_data_dir() -> AppResult<PathBuf> {
    let base = dirs::config_dir().ok_or(AppError::ConfigDirMissing)?;
    let dir = base.join(APP_DIR);
    fs::create_dir_all(&dir)?;
    Ok(dir)
}

pub fn logs_dir() -> AppResult<PathBuf> {
    let dir = app_data_dir()?.join("logs");
    fs::create_dir_all(&dir)?;
    Ok(dir)
}

pub fn file_path(name: &str) -> AppResult<PathBuf> {
    Ok(app_data_dir()?.join(name))
}

pub fn load_or_default<T: DeserializeOwned + Default>(name: &str) -> T {
    let path = match file_path(name) {
        Ok(p) => p,
        Err(e) => {
            tracing::error!("can't locate settings folder for {name}: {e}");
            return T::default();
        }
    };
    load_path_or_default(&path)
}

fn load_path_or_default<T: DeserializeOwned + Default>(path: &Path) -> T {
    match read_json(path) {
        Ok(Some(v)) => v,
        Ok(None) => T::default(),
        Err(AppError::Json(e)) => {
            tracing::error!(
                "{} is unreadable ({e}); keeping a copy and using defaults",
                path.display()
            );
            quarantine(path);
            T::default()
        }
        Err(e) => {
            tracing::error!("couldn't read {}: {e}; using defaults", path.display());
            T::default()
        }
    }
}

/// Moves a corrupt file aside so the next save can't silently destroy it.
fn quarantine(path: &Path) {
    let stamp = chrono::Utc::now().format("%Y%m%dT%H%M%S");
    let backup = path.with_extension(format!("corrupt-{stamp}"));
    if let Err(e) = fs::rename(path, &backup) {
        tracing::error!("couldn't back up {}: {e}", path.display());
    }
}

pub fn save<T: Serialize>(name: &str, value: &T) -> AppResult<()> {
    let path = file_path(name)?;
    let _guard = lock();
    write_atomic(&path, value)
}

/// Read-modify-write under the same lock as `save`, so concurrent commands
/// can't drop each other's changes.
pub fn update<T, F>(name: &str, change: F) -> AppResult<T>
where
    T: Serialize + DeserializeOwned + Default,
    F: FnOnce(T) -> T,
{
    let path = file_path(name)?;
    let _guard = lock();
    let next = change(load_path_or_default(&path));
    write_atomic(&path, &next)?;
    Ok(next)
}

fn lock() -> std::sync::MutexGuard<'static, ()> {
    WRITE_LOCK
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
}

fn read_json<T: DeserializeOwned>(path: &Path) -> AppResult<Option<T>> {
    let raw = match fs::read_to_string(path) {
        Ok(raw) => raw,
        Err(e) if e.kind() == ErrorKind::NotFound => return Ok(None),
        Err(e) => return Err(e.into()),
    };
    Ok(Some(serde_json::from_str(&raw)?))
}

pub fn write_atomic<T: Serialize>(path: &Path, value: &T) -> AppResult<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let json = serde_json::to_vec_pretty(value)?;
    let tmp = unique_tmp_path(path);
    let result = write_synced(&tmp, &json).and_then(|_| rename_with_retry(&tmp, path));
    if result.is_err() {
        let _ = fs::remove_file(&tmp);
    }
    result.map_err(AppError::from)
}

fn unique_tmp_path(path: &Path) -> PathBuf {
    let n = TMP_COUNTER.fetch_add(1, Ordering::Relaxed);
    let name = path
        .file_name()
        .map(|f| f.to_string_lossy().into_owned())
        .unwrap_or_default();
    path.with_file_name(format!("{name}.{}.{n}.tmp", std::process::id()))
}

fn write_synced(path: &Path, bytes: &[u8]) -> std::io::Result<()> {
    let mut file = File::create(path)?;
    file.write_all(bytes)?;
    file.sync_all()
}

/// Antivirus and search indexers on Windows briefly hold files open, which
/// makes a rename fail with access denied.
fn rename_with_retry(from: &Path, to: &Path) -> std::io::Result<()> {
    let mut attempt = 1;
    loop {
        match fs::rename(from, to) {
            Ok(()) => return Ok(()),
            Err(e) if attempt < RENAME_ATTEMPTS && e.kind() == ErrorKind::PermissionDenied => {
                attempt += 1;
                thread::sleep(RENAME_RETRY_DELAY);
            }
            Err(e) => return Err(e),
        }
    }
}

pub fn marker_exists(name: &str) -> bool {
    file_path(name).map(|p| p.exists()).unwrap_or(false)
}

pub fn marker_set(name: &str) -> AppResult<()> {
    save(name, &chrono::Utc::now().to_rfc3339())
}

pub fn marker_clear(name: &str) -> AppResult<()> {
    delete_files(&[name])
}

/// Tries every file even if one fails, then reports the first error.
pub fn delete_files(names: &[&str]) -> AppResult<()> {
    let _guard = lock();
    let mut first_error = None;
    for name in names {
        let result = file_path(name).and_then(|p| match fs::remove_file(&p) {
            Err(e) if e.kind() != ErrorKind::NotFound => Err(AppError::from(e)),
            _ => Ok(()),
        });
        if let Err(e) = result {
            tracing::error!("couldn't delete {name}: {e}");
            first_error.get_or_insert(e);
        }
    }
    first_error.map_or(Ok(()), Err)
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

    fn temp_path(tag: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("khmtools-test-{}-{tag}", std::process::id()));
        fs::create_dir_all(&dir).unwrap();
        dir.join("sample.json")
    }

    #[test]
    fn round_trip() {
        let path = temp_path("round-trip");
        let v = Sample {
            a: 5,
            b: "hi".into(),
        };
        write_atomic(&path, &v).unwrap();
        let back: Option<Sample> = read_json(&path).unwrap();
        assert_eq!(back, Some(v));
        let _ = fs::remove_dir_all(path.parent().unwrap());
    }

    #[test]
    fn write_leaves_no_tmp_files() {
        let path = temp_path("no-tmp");
        write_atomic(&path, &Sample::default()).unwrap();
        write_atomic(&path, &Sample::default()).unwrap();
        let leftovers: Vec<_> = fs::read_dir(path.parent().unwrap())
            .unwrap()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_name().to_string_lossy().ends_with(".tmp"))
            .collect();
        assert!(leftovers.is_empty());
        let _ = fs::remove_dir_all(path.parent().unwrap());
    }

    #[test]
    fn corrupt_file_is_kept_aside_not_lost() {
        let path = temp_path("corrupt");
        fs::write(&path, "{ not json").unwrap();
        let loaded: Sample = load_path_or_default(&path);
        assert_eq!(loaded, Sample::default());
        assert!(!path.exists());
        let backups = fs::read_dir(path.parent().unwrap())
            .unwrap()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_name().to_string_lossy().contains("corrupt-"))
            .count();
        assert_eq!(backups, 1);
        let _ = fs::remove_dir_all(path.parent().unwrap());
    }

    #[test]
    fn missing_file_is_default() {
        let path = temp_path("missing");
        let loaded: Sample = load_path_or_default(&path);
        assert_eq!(loaded, Sample::default());
        let _ = fs::remove_dir_all(path.parent().unwrap());
    }
}
