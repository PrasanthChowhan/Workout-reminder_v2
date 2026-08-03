mod commands;
mod core;
mod system;
mod utils;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init());

    #[cfg(debug_assertions)]
    let builder = builder.plugin(tauri_plugin_dev_issues::init());

    #[cfg(desktop)]
    let builder = builder.plugin(system::shortcuts::init_global_shortcut_plugin());

    builder
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .setup(|app| {
            // Load app configuration
            let app_config = utils::fs::load_config(app.handle());
            // Save initial defaults if the file was just generated
            let _ = utils::fs::save_config_file(app.handle(), &app_config);

            // Manage app state
            app.manage(core::state::AppState::new(app_config));

            // Set up system tray & global shortcuts on desktop
            #[cfg(desktop)]
            {
                let _ = system::tray::setup_tray(app);
                let _ = system::shortcuts::setup_global_shortcut(app);
            }

            // Spawn the tokio background timer engine
            core::background_loop::start_timer_engine(app.handle().clone());

            Ok(())
        })

        .invoke_handler(tauri::generate_handler![
            commands::timer_cmds::get_timer_state,
            commands::timer_cmds::toggle_timer,
            commands::timer_cmds::get_session_data,
            commands::timer_cmds::complete_break,
            commands::config_cmds::get_app_config,
            commands::config_cmds::save_app_config,
            commands::timer_cmds::trigger_refocus,
            commands::config_cmds::set_active_track,
            commands::config_cmds::update_track_level,
            commands::dev_cmds::create_dev_issue,
            commands::config_cmds::open_external_url,
            commands::data_cmds::update_flashcard_metadata,
            commands::data_cmds::update_track_metadata,
            commands::data_cmds::update_stretch_metadata
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
