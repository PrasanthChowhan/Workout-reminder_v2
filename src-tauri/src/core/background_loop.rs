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
                let paused = state.timer_paused.lock().unwrap_or_else(|e| e.into_inner());
                *paused
            };

            let mut reminder_state = {
                let rs = state.reminder_state.lock().unwrap_or_else(|e| e.into_inner());
                *rs
            };

            let mut just_expired = false;

            if let crate::core::models::ReminderState::PausedUntil(until) = reminder_state {
                if chrono::Utc::now() >= until {
                    reminder_state = crate::core::models::ReminderState::Active;
                    just_expired = true;
                    
                    {
                        let mut rs = state.reminder_state.lock().unwrap_or_else(|e| e.into_inner());
                        *rs = reminder_state;
                    }
                    {
                        let mut paused = state.timer_paused.lock().unwrap_or_else(|e| e.into_inner());
                        *paused = false;
                    }
                    {
                        let mut micro = state.micro_countdown.lock().unwrap_or_else(|e| e.into_inner());
                        let mut active = state.active_countdown.lock().unwrap_or_else(|e| e.into_inner());
                        *micro = 0;
                        *active = 0;
                    }

                    let pool_clone = state.db_pool.clone();
                    tauri::async_runtime::spawn(async move {
                        let _ = crate::utils::db::save_reminder_state(&pool_clone, &crate::core::models::ReminderState::Active).await;
                    });
                }
            }

            let is_currently_paused = if just_expired {
                false
            } else {
                match reminder_state {
                    crate::core::models::ReminderState::Active => is_paused,
                    _ => true,
                }
            };

            if is_currently_paused {
                continue;
            }

            let (triggered_type, remaining_micro, remaining_active) = {
                let mut micro = state.micro_countdown.lock().unwrap_or_else(|e| e.into_inner());
                let mut active = state.active_countdown.lock().unwrap_or_else(|e| e.into_inner());
                let settings = state.cached_settings.lock().unwrap_or_else(|e| e.into_inner());

                if settings.micro_break_enabled && *micro > 0 {
                    *micro -= 1;
                }
                if *active > 0 {
                    *active -= 1;
                }

                let triggered = if *active == 0 {
                    Some("active".to_string())
                } else if settings.micro_break_enabled && *micro == 0 {
                    Some("micro".to_string())
                } else {
                    None
                };

                (triggered, *micro, *active)
            };

            if let Some(break_type) = triggered_type {
                {
                    let mut current_state = state.current_break_state.lock().unwrap_or_else(|e| e.into_inner());
                    *current_state = Some(break_type.clone());
                    let mut paused = state.timer_paused.lock().unwrap_or_else(|e| e.into_inner());
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
