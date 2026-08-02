mod timer;

use rand::prelude::IndexedRandom;
use std::time::Duration;
use tauri::Emitter;
use tauri::Manager;
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut, ShortcutState};

#[derive(serde::Serialize)]
struct TimerStatePayload {
    micro_left: u64,
    active_left: u64,
    timer_paused: bool,
    current_break_state: Option<String>,
}

#[derive(serde::Serialize)]
struct SessionDataPayload {
    card: Option<timer::ActiveRecallCard>,
    prompt: Option<String>,
    stretch: Option<timer::Stretch>,
}

#[tauri::command]
fn get_timer_state(state: tauri::State<'_, timer::AppState>) -> TimerStatePayload {
    TimerStatePayload {
        micro_left: *state.micro_countdown.lock().unwrap(),
        active_left: *state.active_countdown.lock().unwrap(),
        timer_paused: *state.timer_paused.lock().unwrap(),
        current_break_state: state.current_break_state.lock().unwrap().clone(),
    }
}

#[tauri::command]
fn toggle_timer(state: tauri::State<'_, timer::AppState>) -> bool {
    let mut paused = state.timer_paused.lock().unwrap();
    *paused = !*paused;
    *paused
}

#[tauri::command]
fn get_session_data(
    state: tauri::State<'_, timer::AppState>,
    break_type: String,
) -> SessionDataPayload {
    let config = state.config.lock().unwrap();
    let mut rng = rand::rng();

    match break_type.as_str() {
        "active" => {
            let card = config.active_recall_cards.choose(&mut rng).cloned();
            
            // Check if there is an active track
            let stretch = if let (Some(track_id), Some(level_num)) = (
                &config.user_progress.active_track_id,
                config.user_progress.current_level_number,
            ) {
                // Find active track
                if let Some(track) = config.tracks.iter().find(|t| t.id == *track_id) {
                    // Find active level
                    if let Some(level) = track.levels.iter().find(|l| l.level_number == level_num) {
                        // Calculate custom duration based on onboarding tier
                        let multiplier = match config.user_progress.onboarding_tier.as_deref() {
                            Some("beginner") => 0.75,
                            Some("intermediate") => 1.0,
                            Some("advanced") => 1.25,
                            _ => 1.0,
                        };
                        let raw_duration = (level.target_duration_secs as f64) * multiplier;
                        let custom_duration = (raw_duration.round() as u64).clamp(30, 90);

                        let tier = config.user_progress.onboarding_tier.as_deref().unwrap_or("beginner");
                        let difficulty = match tier {
                            "beginner" => "Beginner",
                            "intermediate" => "Intermediate",
                            "advanced" => "Advanced",
                            _ => "Beginner",
                        }.to_string();

                        Some(timer::Stretch {
                            name: format!("{} (Level {})", level.title, level.level_number),
                            description: level.description.clone(),
                            duration_secs: custom_duration,
                            difficulty_level: difficulty,
                            sets: 3,
                            reps: Some("Hold".to_string()),
                            video_url: level.video_url.clone(),
                            image_url: level.image_url.clone(),
                            is_unilateral: level.is_unilateral,
                            equipment: level.equipment.clone(),
                            rest_secs: level.rest_secs,
                        })
                    } else {
                        config.stretches.choose(&mut rng).cloned()
                    }
                } else {
                    config.stretches.choose(&mut rng).cloned()
                }
            } else {
                config.stretches.choose(&mut rng).cloned()
            };

            SessionDataPayload {
                card,
                prompt: None,
                stretch,
            }
        }
        "refocus" => {
            let prompt = config.reflection_prompts.choose(&mut rng).cloned();
            SessionDataPayload {
                card: None,
                prompt,
                stretch: None,
            }
        }
        _ => SessionDataPayload {
            card: None,
            prompt: None,
            stretch: None,
        },
    }
}

#[tauri::command]
fn complete_break(
    app: tauri::AppHandle,
    action: String,
    state: tauri::State<'_, timer::AppState>,
) -> Result<(), String> {
    println!("Break completed! Action logged: {}", action);

    // If action is "done", increment progress
    if action == "done" {
        let mut config = state.config.lock().unwrap();
        if config.user_progress.active_track_id.is_some() {
            config.user_progress.completed_sessions_count += 1;
            config.user_progress.last_completed_at = Some(chrono::Utc::now().to_rfc3339());
            if let Err(e) = timer::save_config_file(&app, &config) {
                eprintln!("Failed to save config on break completion: {}", e);
            }
        }
    }

    // Reset break state
    {
        let mut current_state = state.current_break_state.lock().unwrap();
        *current_state = None;
    }

    // Reset timers based on config settings
    {
        let config = state.config.lock().unwrap();
        let mut micro = state.micro_countdown.lock().unwrap();
        let mut active = state.active_countdown.lock().unwrap();

        *micro = config.settings.micro_break_interval_mins * 60;
        *active = config.settings.active_break_interval_mins * 60;
    }

    // Resume timer tick
    {
        let mut paused = state.timer_paused.lock().unwrap();
        *paused = false;
        if let Some(toggle_menu_item) = state.toggle_menu_item.lock().unwrap().as_ref() {
            let _ = toggle_menu_item.set_text("Pause Timer");
        }
    }

    // Hide window and restore normal desktop dimensions
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
        let _ = window.set_fullscreen(false);
        let _ = window.set_decorations(true);
        let _ = window.set_always_on_top(false);
    }

    Ok(())
}

#[tauri::command]
fn set_active_track(
    app: tauri::AppHandle,
    track_id: Option<String>,
    onboarding_tier: Option<String>,
    starting_level: Option<u64>,
    state: tauri::State<'_, timer::AppState>,
) -> Result<timer::AppConfig, String> {
    let mut config = state.config.lock().unwrap();
    
    config.user_progress.active_track_id = track_id;
    config.user_progress.onboarding_tier = onboarding_tier;
    config.user_progress.current_level_number = starting_level;
    config.user_progress.completed_sessions_count = 0;
    config.user_progress.last_completed_at = None;
    config.user_progress.level_started_at = Some(chrono::Utc::now().to_rfc3339());
    
    timer::save_config_file(&app, &config)?;
    Ok(config.clone())
}

#[tauri::command]
fn update_track_level(
    app: tauri::AppHandle,
    level_number: u64,
    state: tauri::State<'_, timer::AppState>,
) -> Result<timer::AppConfig, String> {
    let mut config = state.config.lock().unwrap();
    
    config.user_progress.current_level_number = Some(level_number);
    config.user_progress.completed_sessions_count = 0;
    config.user_progress.level_started_at = Some(chrono::Utc::now().to_rfc3339());
    
    timer::save_config_file(&app, &config)?;
    Ok(config.clone())
}

#[tauri::command]
async fn create_dev_issue(app: tauri::AppHandle, text: String) -> Result<(), String> {
    let mut current_dir = std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
    let mut issues_dir = current_dir.join("issues");
    
    // traverse up to find 'issues' or the root '.git'
    let mut found = false;
    for _ in 0..5 {
        if issues_dir.exists() || current_dir.join(".git").exists() {
            issues_dir = current_dir.join("issues");
            found = true;
            break;
        }
        if let Some(parent) = current_dir.parent() {
            current_dir = parent.to_path_buf();
            issues_dir = current_dir.join("issues");
        } else {
            break;
        }
    }

    if !found {
        // Fallback: create issues in app_data_dir/issues
        issues_dir = app.path().app_data_dir().map_err(|e| e.to_string())?.join("issues");
    }

    if !issues_dir.exists() {
        std::fs::create_dir_all(&issues_dir).map_err(|e| e.to_string())?;
    }

    let timestamp = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_err(|e| e.to_string())?.as_secs();
    let file_path = issues_dir.join(format!("issue-{}.md", timestamp));
    std::fs::write(&file_path, text).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_app_config(state: tauri::State<'_, timer::AppState>) -> timer::AppConfig {
    state.config.lock().unwrap().clone()
}

#[tauri::command]
fn save_app_config(
    app: tauri::AppHandle,
    new_config: timer::AppConfig,
    state: tauri::State<'_, timer::AppState>,
) -> Result<(), String> {
    timer::save_config_file(&app, &new_config)?;
    let mut config = state.config.lock().unwrap();
    *config = new_config;
    Ok(())
}

#[tauri::command]
fn trigger_refocus(
    app: tauri::AppHandle,
    state: tauri::State<'_, timer::AppState>,
) -> Result<(), String> {
    {
        let mut current_state = state.current_break_state.lock().unwrap();
        *current_state = Some("refocus".to_string());
        let mut paused = state.timer_paused.lock().unwrap();
        *paused = true;
        if let Some(toggle_menu_item) = state.toggle_menu_item.lock().unwrap().as_ref() {
            let _ = toggle_menu_item.set_text("Resume Timer");
        }
    }

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_decorations(false);
        let _ = window.set_fullscreen(true);
        let _ = window.set_always_on_top(true);
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();

        let _ = window.emit("start-break", "refocus");
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init());

    #[cfg(debug_assertions)]
    let builder = builder.plugin(tauri_plugin_dev_issues::init());

    builder
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        if shortcut.mods.contains(Modifiers::CONTROL)
                            && shortcut.mods.contains(Modifiers::ALT)
                            && shortcut.key == Code::KeyR
                        {
                            let state = app.state::<timer::AppState>();
                            {
                                let mut current_state = state.current_break_state.lock().unwrap();
                                *current_state = Some("refocus".to_string());
                                let mut paused = state.timer_paused.lock().unwrap();
                                *paused = true;
                                if let Some(toggle_menu_item) = state.toggle_menu_item.lock().unwrap().as_ref() {
                                    let _ = toggle_menu_item.set_text("Resume Timer");
                                }
                            }

                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.set_decorations(false);
                                let _ = window.set_fullscreen(true);
                                let _ = window.set_always_on_top(true);
                                let _ = window.show();
                                let _ = window.unminimize();
                                let _ = window.set_focus();

                                let _ = window.emit("start-break", "refocus");
                            }
                        }
                    }
                })
                .build(),
        )
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
            let config = timer::load_config(app.handle());
            // Save initial defaults if the file was just generated
            let _ = timer::save_config_file(app.handle(), &config);

            // Manage app state
            app.manage(timer::AppState::new(config));

            // Register global hotkey: Ctrl + Alt + R
            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::GlobalShortcutExt;
                let shortcut = Shortcut::new(
                    Some(Modifiers::CONTROL | Modifiers::ALT),
                    Code::KeyR,
                );
                let _ = app.global_shortcut().register(shortcut);
            }

            // Create System Tray and Menu for desktop
            #[cfg(desktop)]
            {
                use tauri::menu::{MenuBuilder, MenuItemBuilder};
                use tauri::tray::{MouseButton, TrayIconBuilder, TrayIconEvent};

                let show_i = MenuItemBuilder::with_id("show", "Show Dashboard").build(app)?;
                let toggle_i = MenuItemBuilder::with_id("toggle", "Pause Timer").build(app)?;
                let refocus_i = MenuItemBuilder::with_id("refocus", "Trigger Refocus").build(app)?;
                let settings_i = MenuItemBuilder::with_id("settings", "Settings").build(app)?;
                let quit_i = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

                let menu = MenuBuilder::new(app)
                    .items(&[&show_i, &toggle_i, &refocus_i, &settings_i, &quit_i])
                    .build()?;

                // Store toggle_i in AppState
                let state = app.state::<timer::AppState>();
                *state.toggle_menu_item.lock().unwrap() = Some(toggle_i.clone());

                let toggle_i_clone = toggle_i.clone();

                let mut tray_builder = TrayIconBuilder::new().menu(&menu);
                if let Some(icon) = app.default_window_icon() {
                    tray_builder = tray_builder.icon(icon.clone());
                }

                let _tray = tray_builder
                    .on_menu_event(move |app, event| {
                        match event.id().as_ref() {
                            "show" => {
                                let app = app.clone();
                                tauri::async_runtime::spawn(async move {
                                    if let Some(window) = app.get_webview_window("main") {
                                        let _ = window.show();
                                        let _ = window.unminimize();
                                        let _ = window.set_focus();
                                    }
                                });
                            }
                            "toggle" => {
                                let toggle_i_clone = toggle_i_clone.clone();
                                let app = app.clone();
                                tauri::async_runtime::spawn(async move {
                                    let state = app.state::<timer::AppState>();
                                    let mut paused = state.timer_paused.lock().unwrap();
                                    *paused = !*paused;
                                    if *paused {
                                        let _ = toggle_i_clone.set_text("Resume Timer");
                                    } else {
                                        let _ = toggle_i_clone.set_text("Pause Timer");
                                    }
                                });
                            }
                            "refocus" => {
                                let app = app.clone();
                                tauri::async_runtime::spawn(async move {
                                    let state = app.state::<timer::AppState>();
                                    {
                                        let mut current_state = state.current_break_state.lock().unwrap();
                                        *current_state = Some("refocus".to_string());
                                        let mut paused = state.timer_paused.lock().unwrap();
                                        *paused = true;
                                        if let Some(toggle_menu_item) = state.toggle_menu_item.lock().unwrap().as_ref() {
                                            let _ = toggle_menu_item.set_text("Resume Timer");
                                        }
                                    }
                                    if let Some(window) = app.get_webview_window("main") {
                                        let _ = window.set_decorations(false);
                                        let _ = window.set_fullscreen(true);
                                        let _ = window.set_always_on_top(true);
                                        let _ = window.show();
                                        let _ = window.unminimize();
                                        let _ = window.set_focus();
                                        let _ = window.emit("start-break", "refocus");
                                    }
                                });
                            }
                            "settings" => {
                                let app = app.clone();
                                tauri::async_runtime::spawn(async move {
                                    if let Some(window) = app.get_webview_window("main") {
                                        let _ = window.show();
                                        let _ = window.unminimize();
                                        let _ = window.set_focus();
                                        let _ = window.emit("open-settings", {});
                                    }
                                });
                            }
                            "quit" => {
                                app.exit(0);
                            }
                            _ => {}
                        }
                    })
                    .on_tray_icon_event(|tray, event| {
                        if let TrayIconEvent::Click { button: MouseButton::Left, .. } = event {
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.unminimize();
                                let _ = window.set_focus();
                            }
                        }
                    })
                    .build(app)?;
            }

            // Spawn the tokio background timer
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                loop {
                    tokio::time::sleep(Duration::from_secs(1)).await;

                    let state = match app_handle.try_state::<timer::AppState>() {
                        Some(s) => s,
                        None => continue,
                    };

                    let is_paused = {
                        let paused = state.timer_paused.lock().unwrap();
                        *paused
                    };

                    if is_paused {
                        continue;
                    }

                    let (triggered_type, remaining_micro, remaining_active) = {
                        let mut micro = state.micro_countdown.lock().unwrap();
                        let mut active = state.active_countdown.lock().unwrap();

                        if *micro > 0 {
                            *micro -= 1;
                        }
                        if *active > 0 {
                            *active -= 1;
                        }

                        let triggered = if *active == 0 {
                            Some("active".to_string())
                        } else if *micro == 0 {
                            Some("micro".to_string())
                        } else {
                            None
                        };

                        (triggered, *micro, *active)
                    };

                    if let Some(break_type) = triggered_type {
                        {
                            let mut current_state = state.current_break_state.lock().unwrap();
                            *current_state = Some(break_type.clone());
                            let mut paused = state.timer_paused.lock().unwrap();
                            *paused = true;
                        }

                        if let Some(window) = app_handle.get_webview_window("main") {
                            let _ = window.set_decorations(false);
                            let _ = window.set_fullscreen(true);
                            let _ = window.set_always_on_top(true);
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();

                            let _ = window.emit("start-break", break_type);
                        }
                    } else {
                        // Tick event for frontend UI (when visible)
                        if let Some(window) = app_handle.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.emit(
                                    "timer-tick",
                                    serde_json::json!({
                                        "micro_left": remaining_micro,
                                        "active_left": remaining_active
                                    }),
                                );
                            }
                        }
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_timer_state,
            toggle_timer,
            get_session_data,
            complete_break,
            get_app_config,
            save_app_config,
            trigger_refocus,
            set_active_track,
            update_track_level,
            create_dev_issue
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
