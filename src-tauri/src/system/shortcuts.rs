use tauri::Manager;

#[cfg(desktop)]
pub fn init_global_shortcut_plugin() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    use tauri_plugin_global_shortcut::{ShortcutState, Modifiers, Code};

    tauri_plugin_global_shortcut::Builder::new()
        .with_handler(|app, shortcut, event| {
            if event.state() == ShortcutState::Pressed {
                if shortcut.mods.contains(Modifiers::CONTROL)
                    && shortcut.mods.contains(Modifiers::ALT)
                    && shortcut.key == Code::KeyR
                {
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

                    let _ = crate::system::window::start_break_overlay(app, "refocus");
                }
            }
        })
        .build()
}

#[cfg(desktop)]
pub fn setup_global_shortcut(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, Modifiers, Code};
    let shortcut = Shortcut::new(
        Some(Modifiers::CONTROL | Modifiers::ALT),
        Code::KeyR,
    );
    let _ = app.global_shortcut().register(shortcut);
    Ok(())
}
