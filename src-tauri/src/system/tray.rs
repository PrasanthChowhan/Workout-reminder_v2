use tauri::Manager;

#[cfg(desktop)]
pub fn setup_tray(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
    use tauri::tray::{MouseButton, TrayIconBuilder, TrayIconEvent};

    let state = app.state::<crate::core::state::AppState>();

    let initial_label = match *state.reminder_state.lock().unwrap_or_else(|e| e.into_inner()) {
        crate::core::models::ReminderState::Active => "Pause Timer".to_string(),
        crate::core::models::ReminderState::PausedManual => "Resume Reminders".to_string(),
        crate::core::models::ReminderState::PausedUntil(until) => {
            let local_time = until.with_timezone(&chrono::Local);
            format!("Snoozed until {}", local_time.format("%I:%M %p"))
        }
        crate::core::models::ReminderState::PausedUntilRestart => "Snoozed until restart".to_string(),
    };

    let show_i = MenuItemBuilder::with_id("show", "Show Dashboard").build(app)?;
    let toggle_i = MenuItemBuilder::with_id("toggle", &initial_label).build(app)?;
    let pause_indef_i = MenuItemBuilder::with_id("pause_indefinite", "Pause Indefinitely").build(app)?;
    
    // Snooze Submenu
    let snooze_30m = MenuItemBuilder::with_id("snooze_30m", "For 30 minutes").build(app)?;
    let snooze_1h = MenuItemBuilder::with_id("snooze_1h", "For 1 hour").build(app)?;
    let snooze_2h = MenuItemBuilder::with_id("snooze_2h", "For 2 hours").build(app)?;
    let snooze_restart = MenuItemBuilder::with_id("snooze_restart", "Until next restart").build(app)?;
    
    let snooze_submenu = SubmenuBuilder::new(app, "Snooze Reminders")
        .items(&[&snooze_30m, &snooze_1h, &snooze_2h, &snooze_restart])
        .build()?;

    let refocus_i = MenuItemBuilder::with_id("refocus", "Trigger Refocus").build(app)?;
    let settings_i = MenuItemBuilder::with_id("settings", "Settings").build(app)?;
    let quit_i = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

    let menu = MenuBuilder::new(app)
        .items(&[
            &show_i, 
            &toggle_i, 
            &pause_indef_i,
            &snooze_submenu,
            &refocus_i, 
            &settings_i, 
            &quit_i
        ])
        .build()?;

    // Store toggle_i in AppState
    *state.toggle_menu_item.lock().unwrap_or_else(|e| e.into_inner()) = Some(toggle_i.clone());

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
                        let _ = crate::system::window::show_main_window(&app);
                    });
                }
                "toggle" => {
                    let toggle_i_clone = toggle_i_clone.clone();
                    let app = app.clone();
                    tauri::async_runtime::spawn(async move {
                        let state = app.state::<crate::core::state::AppState>();
                        let new_state = {
                            let mut reminder_state = state.reminder_state.lock().unwrap_or_else(|e| e.into_inner());
                            let mut paused = state.timer_paused.lock().unwrap_or_else(|e| e.into_inner());

                            if *reminder_state == crate::core::models::ReminderState::Active {
                                *reminder_state = crate::core::models::ReminderState::PausedManual;
                                *paused = true;
                                let _ = toggle_i_clone.set_text("Resume Reminders");
                                crate::core::models::ReminderState::PausedManual
                            } else {
                                *reminder_state = crate::core::models::ReminderState::Active;
                                *paused = false;
                                let _ = toggle_i_clone.set_text("Pause Timer");
                                crate::core::models::ReminderState::Active
                            }
                        };
                        let _ = crate::utils::db::save_reminder_state(&state.db_pool, &new_state).await;
                    });
                }
                "pause_indefinite" => {
                    let toggle_i_clone = toggle_i_clone.clone();
                    let app = app.clone();
                    tauri::async_runtime::spawn(async move {
                        let state = app.state::<crate::core::state::AppState>();
                        let new_state = {
                            let mut reminder_state = state.reminder_state.lock().unwrap_or_else(|e| e.into_inner());
                            let mut paused = state.timer_paused.lock().unwrap_or_else(|e| e.into_inner());

                            *reminder_state = crate::core::models::ReminderState::PausedManual;
                            *paused = true;
                            let _ = toggle_i_clone.set_text("Resume Reminders");
                            crate::core::models::ReminderState::PausedManual
                        };
                        let _ = crate::utils::db::save_reminder_state(&state.db_pool, &new_state).await;
                    });
                }
                "snooze_30m" => {
                    let toggle_i_clone = toggle_i_clone.clone();
                    let app = app.clone();
                    tauri::async_runtime::spawn(async move {
                        let state = app.state::<crate::core::state::AppState>();
                        let until = chrono::Utc::now() + chrono::Duration::minutes(30);
                        let local_time = until.with_timezone(&chrono::Local);
                        
                        let new_state = {
                            let mut reminder_state = state.reminder_state.lock().unwrap_or_else(|e| e.into_inner());
                            let mut paused = state.timer_paused.lock().unwrap_or_else(|e| e.into_inner());

                            *reminder_state = crate::core::models::ReminderState::PausedUntil(until);
                            *paused = true;
                            let _ = toggle_i_clone.set_text(format!("Snoozed until {}", local_time.format("%I:%M %p")));
                            crate::core::models::ReminderState::PausedUntil(until)
                        };
                        let _ = crate::utils::db::save_reminder_state(&state.db_pool, &new_state).await;
                    });
                }
                "snooze_1h" => {
                    let toggle_i_clone = toggle_i_clone.clone();
                    let app = app.clone();
                    tauri::async_runtime::spawn(async move {
                        let state = app.state::<crate::core::state::AppState>();
                        let until = chrono::Utc::now() + chrono::Duration::minutes(60);
                        let local_time = until.with_timezone(&chrono::Local);
                        
                        let new_state = {
                            let mut reminder_state = state.reminder_state.lock().unwrap_or_else(|e| e.into_inner());
                            let mut paused = state.timer_paused.lock().unwrap_or_else(|e| e.into_inner());

                            *reminder_state = crate::core::models::ReminderState::PausedUntil(until);
                            *paused = true;
                            let _ = toggle_i_clone.set_text(format!("Snoozed until {}", local_time.format("%I:%M %p")));
                            crate::core::models::ReminderState::PausedUntil(until)
                        };
                        let _ = crate::utils::db::save_reminder_state(&state.db_pool, &new_state).await;
                    });
                }
                "snooze_2h" => {
                    let toggle_i_clone = toggle_i_clone.clone();
                    let app = app.clone();
                    tauri::async_runtime::spawn(async move {
                        let state = app.state::<crate::core::state::AppState>();
                        let until = chrono::Utc::now() + chrono::Duration::minutes(120);
                        let local_time = until.with_timezone(&chrono::Local);
                        
                        let new_state = {
                            let mut reminder_state = state.reminder_state.lock().unwrap_or_else(|e| e.into_inner());
                            let mut paused = state.timer_paused.lock().unwrap_or_else(|e| e.into_inner());

                            *reminder_state = crate::core::models::ReminderState::PausedUntil(until);
                            *paused = true;
                            let _ = toggle_i_clone.set_text(format!("Snoozed until {}", local_time.format("%I:%M %p")));
                            crate::core::models::ReminderState::PausedUntil(until)
                        };
                        let _ = crate::utils::db::save_reminder_state(&state.db_pool, &new_state).await;
                    });
                }
                "snooze_restart" => {
                    let toggle_i_clone = toggle_i_clone.clone();
                    let app = app.clone();
                    tauri::async_runtime::spawn(async move {
                        let state = app.state::<crate::core::state::AppState>();
                        
                        let new_state = {
                            let mut reminder_state = state.reminder_state.lock().unwrap_or_else(|e| e.into_inner());
                            let mut paused = state.timer_paused.lock().unwrap_or_else(|e| e.into_inner());

                            *reminder_state = crate::core::models::ReminderState::PausedUntilRestart;
                            *paused = true;
                            let _ = toggle_i_clone.set_text("Snoozed until restart");
                            crate::core::models::ReminderState::PausedUntilRestart
                        };
                        let _ = crate::utils::db::save_reminder_state(&state.db_pool, &new_state).await;
                    });
                }
                "refocus" => {
                    let app = app.clone();
                    tauri::async_runtime::spawn(async move {
                        let state = app.state::<crate::core::state::AppState>();
                        if let Err(e) = state.trigger_refocus_state() {
                            eprintln!("Failed to trigger refocus state via tray: {}", e);
                        }
                        let _ = crate::system::window::start_break_overlay(&app, "refocus");
                    });
                }
                "settings" => {
                    let app = app.clone();
                    tauri::async_runtime::spawn(async move {
                        let _ = crate::system::window::show_settings_window(&app);
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
                let _ = crate::system::window::show_main_window(app);
            }
        })
        .build(app)?;

    Ok(())
}
