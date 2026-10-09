use crate::domain::settings::{files, AppSettings, UpdateChannel};
use crate::storage;
use std::sync::Mutex;
use tauri::{AppHandle, Manager, Url};
use tauri_plugin_updater::{Update, UpdaterExt};

const STABLE_ENDPOINT: &str =
    "https://github.com/advenimus/khmtools/releases/latest/download/latest.json";
const BETA_ENDPOINT: &str =
    "https://github.com/advenimus/khmtools/releases/download/beta/latest-beta.json";

/// An update downloaded in the background, installed when the app quits.
#[derive(Default)]
pub struct PendingUpdate(Mutex<Option<(Update, Vec<u8>)>>);

fn check_with(app: &AppHandle, endpoint: &str) -> Result<tauri_plugin_updater::Updater, String> {
    let url: Url = endpoint
        .parse()
        .map_err(|e: url::ParseError| e.to_string())?;
    app.updater_builder()
        .endpoints(vec![url])
        .map_err(|e| e.to_string())?
        // Lets someone who switches from beta back to stable get the stable
        // build even when it is numbered lower than their beta.
        .version_comparator(|current, remote| {
            remote.version > current
                || (!current.pre.is_empty()
                    && remote.version.pre.is_empty()
                    && remote.version != current)
        })
        .build()
        .map_err(|e| e.to_string())
}

async fn check_endpoint(app: &AppHandle, endpoint: &str) -> Result<Option<Update>, String> {
    check_with(app, endpoint)?
        .check()
        .await
        .map_err(|e| e.to_string())
}

fn newer(a: Option<Update>, b: Option<Update>) -> Option<Update> {
    match (a, b) {
        (Some(a), Some(b)) => {
            let va = semver::Version::parse(&a.version).ok();
            let vb = semver::Version::parse(&b.version).ok();
            if vb > va {
                Some(b)
            } else {
                Some(a)
            }
        }
        (a, b) => a.or(b),
    }
}

/// Beta users also look at stable, so a final release supersedes the betas
/// that came before it.
pub async fn find(app: &AppHandle) -> Result<Option<Update>, String> {
    let settings: AppSettings = storage::load_or_default(files::APP);
    let stable = check_endpoint(app, STABLE_ENDPOINT).await;
    if settings.update_channel == UpdateChannel::Stable {
        return stable;
    }
    let beta = check_endpoint(app, BETA_ENDPOINT).await;
    match (beta, stable) {
        (Err(e), Err(_)) => Err(e),
        (beta, stable) => Ok(newer(beta.ok().flatten(), stable.ok().flatten())),
    }
}

pub async fn download_for_quit(app: AppHandle) {
    let settings: AppSettings = storage::load_or_default(files::APP);
    if !settings.install_on_quit {
        return;
    }
    let update = match find(&app).await {
        Ok(Some(u)) => u,
        Ok(None) => return,
        Err(e) => {
            tracing::info!("background update check failed: {e}");
            return;
        }
    };
    match update.download(|_, _| {}, || {}).await {
        Ok(bytes) => {
            tracing::info!("update {} downloaded; will install on quit", update.version);
            if let Ok(mut slot) = app.state::<PendingUpdate>().0.lock() {
                *slot = Some((update, bytes));
            }
        }
        Err(e) => tracing::warn!("background update download failed: {e}"),
    }
}

pub fn install_pending_on_exit(app: &AppHandle) {
    let pending = app
        .try_state::<PendingUpdate>()
        .and_then(|s| s.0.lock().ok().and_then(|mut slot| slot.take()));
    let Some((update, bytes)) = pending else {
        return;
    };
    let settings: AppSettings = storage::load_or_default(files::APP);
    if !settings.install_on_quit {
        return;
    }
    tracing::info!("installing update {} on quit", update.version);
    if let Err(e) = update.install(bytes) {
        tracing::error!("install on quit failed: {e}");
    }
}
