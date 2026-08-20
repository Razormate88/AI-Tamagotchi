mod commands;
mod tray;

use tauri::Manager;
use tauri_plugin_window_state::StateFlags;

pub fn run() {
    tauri::Builder::default()
        // Single instance plugin must be registered early
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = commands::show_pet_authoritative(&window);
            }
        }))
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--autostart"]),
        ))
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_state_flags(StateFlags::SIZE | StateFlags::POSITION)
                .build(),
        )
        .setup(|app| {
            tray::setup_tray(app.handle())?;
            if let Some(window) = app.get_webview_window("main") {
                commands::log_window_diagnostics("app_setup", &window);
                let _ = commands::show_pet_authoritative(&window);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::reset_window_position,
            commands::show_pet,
            commands::report_frontend_stage,
            commands::report_frontend_error
        ])
        .run(tauri::generate_context!())
        .expect("error while running AI-Tamagotchi application");
}
