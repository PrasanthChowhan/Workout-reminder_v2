use tauri::{AppHandle, Manager, Emitter};

pub fn show_main_window(app: &AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
    Ok(())
}

pub fn show_settings_window(app: &AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
        let _ = window.emit("open-settings", serde_json::json!({}));
    }
    Ok(())
}

pub fn start_break_overlay(app: &AppHandle, break_type: &str) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_decorations(false);
        let _ = window.set_fullscreen(true);
        let _ = window.set_always_on_top(true);
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
        let _ = window.emit("start-break", break_type);
    }
    Ok(())
}

pub fn close_break_overlay(app: &AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
        let _ = window.set_fullscreen(false);
        let _ = window.set_decorations(true);
        let _ = window.set_always_on_top(false);
    }
    Ok(())
}

pub fn emit_timer_tick(app: &AppHandle, remaining_micro: u64, remaining_active: u64) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
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
    Ok(())
}
