pub mod commands;
pub mod dock_icon;
pub mod domain;
pub mod error;
pub mod platform;
pub mod storage;
pub mod updates;

use tauri::{Manager, RunEvent};
use tracing_appender::rolling::{Builder as RollingBuilder, Rotation};
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

const MAX_LOG_FILES: usize = 14;

fn init_tracing() {
    let env = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));
    let stderr = fmt::layer().with_writer(std::io::stderr).with_ansi(false);

    let file_layer = storage::logs_dir().ok().and_then(|logs| {
        RollingBuilder::new()
            .rotation(Rotation::DAILY)
            .filename_prefix("khmtools")
            .filename_suffix("log")
            .max_log_files(MAX_LOG_FILES)
            .build(logs)
            .ok()
    });
    let file_layer = file_layer.map(|appender| {
        let (writer, guard) = tracing_appender::non_blocking(appender);
        Box::leak(Box::new(guard));
        fmt::layer().with_writer(writer).with_ansi(false)
    });

    let _ = tracing_subscriber::registry()
        .with(env)
        .with(stderr)
        .with(file_layer)
        .try_init();

    if storage::logs_dir().is_err() {
        tracing::error!("log folder unavailable; logging to stderr only");
    }
}

fn install_panic_hook() {
    let default = std::panic::take_hook();
    std::panic::set_hook(Box::new(move |info| {
        tracing::error!("panic: {info}");
        default(info);
    }));
}

fn focus_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    init_tracing();
    install_panic_hook();

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            focus_main_window(app);
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(updates::PendingUpdate::default())
        .invoke_handler(tauri::generate_handler![
            commands::attendance::calculate_attendance,
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
            commands::launcher::default_zoom_path,
            commands::launcher::default_obs_path,
            commands::launcher::default_media_manager_path,
            commands::launcher::browse_for_app,
            commands::launcher::launch_zoom,
            commands::launcher::launch_obs,
            commands::launcher::launch_media_manager,
            commands::launcher::should_show_custom_message,
            commands::launcher::check_meeting_input,
            commands::launcher::setup_status,
            commands::auto_launch::auto_launch_enabled,
            commands::auto_launch::auto_launch_set,
            commands::onboarding::onboarding_needed,
            commands::onboarding::onboarding_complete,
            commands::update::check_for_update,
            commands::update::install_update,
            commands::update::app_version,
            commands::misc::open_url,
            commands::misc::open_logs_dir,
        ])
        .setup(|app| {
            tracing::info!("KHM Tools v{} starting", app.package_info().version);
            dock_icon::apply();
            let app_settings: domain::settings::AppSettings =
                storage::load_or_default(domain::settings::files::APP);
            if app_settings.always_maximize {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.maximize();
                }
            }
            std::thread::spawn(commands::auto_launch::reconcile_on_startup);
            tauri::async_runtime::spawn(updates::download_for_quit(app.handle().clone()));
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    app.run(|handle, event| {
        if let RunEvent::Exit = event {
            updates::install_pending_on_exit(handle);
        }
    });
}
