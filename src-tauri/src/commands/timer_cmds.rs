use rand::prelude::IndexedRandom;


use crate::core::state::{AppState, TimerStatePayload, SessionDataPayload, Stretch};
use crate::system::window::{close_break_overlay, start_break_overlay};
use crate::utils::fs::save_config_file;

#[tauri::command]
pub fn get_timer_state(state: tauri::State<'_, AppState>) -> TimerStatePayload {
    TimerStatePayload {
        micro_left: *state.micro_countdown.lock().unwrap(),
        active_left: *state.active_countdown.lock().unwrap(),
        timer_paused: *state.timer_paused.lock().unwrap(),
        current_break_state: state.current_break_state.lock().unwrap().clone(),
    }
}

#[tauri::command]
pub fn toggle_timer(state: tauri::State<'_, AppState>) -> bool {
    let mut paused = state.timer_paused.lock().unwrap();
    *paused = !*paused;
    *paused
}

#[tauri::command]
pub fn get_session_data(
    state: tauri::State<'_, AppState>,
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
                        let custom_duration = level.target_duration_secs;

                        let tier = config.user_progress.onboarding_tier.as_deref().unwrap_or("beginner");
                        let difficulty = match tier {
                            "beginner" => "Beginner",
                            "intermediate" => "Intermediate",
                            "advanced" => "Advanced",
                            _ => "Beginner",
                        }.to_string();

                        let stretch_name = if track.exercises.is_some() {
                            level.title.clone()
                        } else {
                            format!("{} (Level {})", level.title, level.level_number)
                        };

                        Some(Stretch {
                            name: stretch_name,
                            description: level.description.clone(),
                            duration_secs: custom_duration,
                            difficulty_level: difficulty,
                            sets: level.sets.unwrap_or(3),
                            reps: level.reps.clone().or_else(|| Some("Hold".to_string())),
                            video_url: level.video_url.clone(),
                            image_url: level.image_url.clone(),
                            is_unilateral: level.is_unilateral,
                            equipment: level.equipment.clone(),
                            rest_secs: level.rest_secs,
                            metadata: None,
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
pub fn complete_break(
    app: tauri::AppHandle,
    action: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    println!("Break completed! Action logged: {}", action);

    // If action is "done", increment progress
    if action == "done" {
        let mut config = state.config.lock().unwrap();
        if let Some(track_id) = config.user_progress.active_track_id.clone() {
            config.user_progress.completed_sessions_count += 1;
            config.user_progress.last_completed_at = Some(chrono::Utc::now().to_rfc3339());
            
            // Auto-advance level after 5 completed sessions if a next level exists
            if config.user_progress.completed_sessions_count >= 5 {
                if let Some(current_level) = config.user_progress.current_level_number {
                    if let Some(track) = config.tracks.iter().find(|t| t.id == track_id) {
                        let max_levels = track.levels.len() as u64;
                        if current_level < max_levels {
                            config.user_progress.current_level_number = Some(current_level + 1);
                            config.user_progress.completed_sessions_count = 0;
                        }
                    }
                }
            }

            if let Err(e) = save_config_file(&app, &config) {
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
    let _ = close_break_overlay(&app);

    Ok(())
}

#[tauri::command]
pub fn trigger_refocus(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
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

    let _ = start_break_overlay(&app, "refocus");
    Ok(())
}
