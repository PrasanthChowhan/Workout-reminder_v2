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
            let stretch = config.stretches.choose(&mut rng).cloned();
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
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
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
            trigger_refocus
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
