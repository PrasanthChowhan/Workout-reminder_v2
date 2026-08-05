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
            let app_handle = app.handle();
            let app_data_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
            if !app_data_dir.exists() {
                std::fs::create_dir_all(&app_data_dir).map_err(|e| e.to_string())?;
            }
            
            // Run async DB initialization using block_on
            let pool = tauri::async_runtime::block_on(async {
                utils::db::init_db(&app_data_dir).await
            })?;
            
            // Check if config.json exists, and migrate it to DB
            let json_path = utils::fs::get_config_path(app_handle)?;
            if json_path.exists() {
                tauri::async_runtime::block_on(async {
                    utils::db::migrate_json_to_db(&pool, &json_path).await
                })?;
            }
            
            // Check if DB is completely fresh (no settings), and populate with defaults
            let is_empty: i64 = tauri::async_runtime::block_on(async {
                sqlx::query_scalar("SELECT COUNT(*) FROM settings")
                    .fetch_one(&pool)
                    .await
                    .unwrap_or(0)
            });
            
            if is_empty == 0 {
                let default_config = core::models::AppConfig::default();
                tauri::async_runtime::block_on(async {
                    utils::db::save_app_config(&pool, &default_config).await
                })?;
            } else {
                let levels_empty: i64 = tauri::async_runtime::block_on(async {
                    sqlx::query_scalar("SELECT COUNT(*) FROM levels")
                        .fetch_one(&pool)
                        .await
                        .unwrap_or(0)
                });
                if levels_empty == 0 {
                    tauri::async_runtime::block_on(async {
                        if let Ok(mut config) = utils::db::load_app_config(&pool).await {
                            config.populate_levels();
                            let _ = utils::db::save_app_config(&pool, &config).await;
                        }
                    });
                }
            }
            
            // Query settings from DB
            let settings = tauri::async_runtime::block_on(async {
                utils::db::load_settings(&pool).await
            })?;

            // Manage app state
            app.manage(core::state::AppState::new(pool, settings));

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
