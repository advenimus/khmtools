pub mod commands;
pub mod dock_icon;
pub mod domain;
pub mod error;
pub mod platform;
pub mod storage;

use tauri::Manager;
use tracing_appender::rolling;
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

fn init_tracing() {
    let logs = match storage::logs_dir() {
        Ok(d) => d,
        Err(_) => return,
    };
    let file_appender = rolling::daily(logs, "khmtools.log");
    let (non_blocking, guard) = tracing_appender::non_blocking(file_appender);
    Box::leak(Box::new(guard));

    let env = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));
    let _ = tracing_subscriber::registry()
        .with(env)
        .with(fmt::layer().with_writer(std::io::stderr).with_ansi(false))
        .with(fmt::layer().with_writer(non_blocking).with_ansi(false))
        .try_init();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    init_tracing();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            // attendance
            commands::attendance::calculate_attendance,
            // settings
            commands::settings::get_app_settings,
            commands::settings::save_app_settings,
            commands::settings::get_meeting_settings,
            commands::settings::save_meeting_settings,
            commands::settings::get_paths,
            commands::settings::save_paths,
            commands::settings::get_media_launcher_settings,
            commands::settings::save_media_launcher_settings,
            commands::settings::reset_all_settings,
            commands::settings::set_update_channel,
            // launcher
            commands::launcher::default_zoom_path,
            commands::launcher::default_obs_path,
            commands::launcher::default_media_manager_path,
            commands::launcher::browse_for_app,
            commands::launcher::launch_zoom,
            commands::launcher::launch_obs,
            commands::launcher::launch_media_manager,
            commands::launcher::should_show_custom_message,
            // auto-launch
            commands::auto_launch::auto_launch_enabled,
            commands::auto_launch::auto_launch_set,
            // onboarding
            commands::onboarding::onboarding_needed,
            commands::onboarding::onboarding_complete,
            // update
            commands::update::check_for_update,
            commands::update::install_update,
            commands::update::app_version,
            // misc
            commands::misc::open_url,
            commands::misc::open_logs_dir,
        ])
        .setup(|app| {
            tracing::info!("KHM Tools v{} starting", app.package_info().version);
            dock_icon::apply();
            if let Some(window) = app.get_webview_window("main") {
                let app_settings: domain::settings::AppSettings =
                    storage::load_or_default(domain::settings::files::APP);
                if app_settings.always_maximize {
                    let _ = window.maximize();
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
