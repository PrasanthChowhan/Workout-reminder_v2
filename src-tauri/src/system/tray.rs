use tauri::Manager;

#[cfg(desktop)]
pub fn setup_tray(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
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
    let state = app.state::<crate::core::state::AppState>();
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
                        let _ = crate::system::window::show_main_window(&app);
                    });
                }
                "toggle" => {
                    let toggle_i_clone = toggle_i_clone.clone();
                    let app = app.clone();
                    tauri::async_runtime::spawn(async move {
                        let state = app.state::<crate::core::state::AppState>();
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
                        let state = app.state::<crate::core::state::AppState>();
                        {
                            let mut current_state = state.current_break_state.lock().unwrap();
                            *current_state = Some("refocus".to_string());
                            let mut paused = state.timer_paused.lock().unwrap();
                            *paused = true;
                            if let Some(toggle_menu_item) = state.toggle_menu_item.lock().unwrap().as_ref() {
                                let _ = toggle_menu_item.set_text("Resume Timer");
                            }
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
