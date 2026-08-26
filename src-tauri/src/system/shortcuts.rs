use tauri::Manager;

#[cfg(desktop)]
pub fn init_global_shortcut_plugin() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    use tauri_plugin_global_shortcut::{ShortcutState, Modifiers, Code};

    tauri_plugin_global_shortcut::Builder::new()
        .with_handler(|app, shortcut, event| {
            if event.state() == ShortcutState::Pressed
                && shortcut.mods.contains(Modifiers::CONTROL)
                && shortcut.mods.contains(Modifiers::ALT)
                && shortcut.key == Code::KeyR
            {
                let state = app.state::<crate::core::state::AppState>();
                match state.trigger_refocus_state() {
                    Ok(_) => {
                        let _ = crate::system::window::start_break_overlay(app, "refocus");
                    }
                    Err(e) => {
                        eprintln!("Skipping refocus overlay: {}", e);
                    }
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
