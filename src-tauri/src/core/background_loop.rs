use std::time::Duration;
use tauri::{AppHandle, Manager};

use crate::core::state::AppState;
use crate::system::window::{start_break_overlay, emit_timer_tick};

pub fn start_timer_engine(app_handle: AppHandle) {
    tauri::async_runtime::spawn(async move {
        loop {
            tokio::time::sleep(Duration::from_secs(1)).await;

            let state = match app_handle.try_state::<AppState>() {
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

                let _ = start_break_overlay(&app_handle, &break_type);
            } else {
                // Tick event for frontend UI (when visible)
                let _ = emit_timer_tick(&app_handle, remaining_micro, remaining_active);
            }
        }
    });
}
