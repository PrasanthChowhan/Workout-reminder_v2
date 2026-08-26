use rand::prelude::IndexedRandom;

use crate::core::state::AppState;
use crate::core::models::{TimerStatePayload, SessionDataPayload, Stretch, PhysicalTrack, Level, InitialBreakDataPayload};
use crate::system::window::{close_break_overlay, start_break_overlay};
use crate::utils::db;
use tauri::Manager;

#[tauri::command]
pub fn get_timer_state(state: tauri::State<'_, AppState>) -> Result<TimerStatePayload, String> {
    Ok(TimerStatePayload {
        micro_left: *state.micro_countdown.lock().map_err(|e| e.to_string())?,
        active_left: *state.active_countdown.lock().map_err(|e| e.to_string())?,
        timer_paused: *state.timer_paused.lock().map_err(|e| e.to_string())?,
        current_break_state: state.current_break_state.lock().map_err(|e| e.to_string())?.clone(),
        reminder_state: *state.reminder_state.lock().map_err(|e| e.to_string())?,
    })
}

#[tauri::command]
pub async fn toggle_timer(state: tauri::State<'_, AppState>) -> Result<bool, String> {
    let (new_state, is_paused) = {
        let mut reminder_state = state.reminder_state.lock().map_err(|e| e.to_string())?;
        let mut paused = state.timer_paused.lock().map_err(|e| e.to_string())?;
        
        if *reminder_state == crate::core::models::ReminderState::Active {
            *reminder_state = crate::core::models::ReminderState::PausedManual;
            *paused = true;
            (crate::core::models::ReminderState::PausedManual, true)
        } else {
            *reminder_state = crate::core::models::ReminderState::Active;
            *paused = false;
            (crate::core::models::ReminderState::Active, false)
        }
    };
    
    crate::utils::db::save_reminder_state(&state.db_pool, &new_state).await?;
    
    if let Some(toggle_menu_item) = state.toggle_menu_item.lock().map_err(|e| e.to_string())?.as_ref() {
        if is_paused {
            let _ = toggle_menu_item.set_text("Resume Timer");
        } else {
            let _ = toggle_menu_item.set_text("Pause Timer");
        }
    }
    
    Ok(is_paused)
}

#[tauri::command]
pub async fn snooze_for(minutes: u64, state: tauri::State<'_, AppState>) -> Result<(), String> {
    let until = chrono::Utc::now() + chrono::Duration::minutes(minutes as i64);
    let new_state = crate::core::models::ReminderState::PausedUntil(until);
    
    {
        let mut rs = state.reminder_state.lock().map_err(|e| e.to_string())?;
        *rs = new_state;
    }
    {
        let mut paused = state.timer_paused.lock().map_err(|e| e.to_string())?;
        *paused = true;
    }
    
    crate::utils::db::save_reminder_state(&state.db_pool, &new_state).await?;
    
    if let Some(toggle_menu_item) = state.toggle_menu_item.lock().map_err(|e| e.to_string())?.as_ref() {
        let local_time = until.with_timezone(&chrono::Local);
        let _ = toggle_menu_item.set_text(format!("Snoozed until {}", local_time.format("%I:%M %p")));
    }
    
    Ok(())
}

#[tauri::command]
pub async fn snooze_until_restart(state: tauri::State<'_, AppState>) -> Result<(), String> {
    let new_state = crate::core::models::ReminderState::PausedUntilRestart;
    
    {
        let mut rs = state.reminder_state.lock().map_err(|e| e.to_string())?;
        *rs = new_state;
    }
    {
        let mut paused = state.timer_paused.lock().map_err(|e| e.to_string())?;
        *paused = true;
    }
    
    crate::utils::db::save_reminder_state(&state.db_pool, &new_state).await?;
    
    if let Some(toggle_menu_item) = state.toggle_menu_item.lock().map_err(|e| e.to_string())?.as_ref() {
        let _ = toggle_menu_item.set_text("Snoozed until restart");
    }
    
    Ok(())
}

#[tauri::command]
pub async fn pause_indefinitely(state: tauri::State<'_, AppState>) -> Result<(), String> {
    let new_state = crate::core::models::ReminderState::PausedManual;
    
    {
        let mut rs = state.reminder_state.lock().map_err(|e| e.to_string())?;
        *rs = new_state;
    }
    {
        let mut paused = state.timer_paused.lock().map_err(|e| e.to_string())?;
        *paused = true;
    }
    
    crate::utils::db::save_reminder_state(&state.db_pool, &new_state).await?;
    
    if let Some(toggle_menu_item) = state.toggle_menu_item.lock().map_err(|e| e.to_string())?.as_ref() {
        let _ = toggle_menu_item.set_text("Resume Timer");
    }
    
    Ok(())
}

#[tauri::command]
pub async fn resume_reminders(state: tauri::State<'_, AppState>) -> Result<(), String> {
    let new_state = crate::core::models::ReminderState::Active;
    
    {
        let mut rs = state.reminder_state.lock().map_err(|e| e.to_string())?;
        *rs = new_state;
    }
    {
        let mut paused = state.timer_paused.lock().map_err(|e| e.to_string())?;
        *paused = false;
    }
    
    crate::utils::db::save_reminder_state(&state.db_pool, &new_state).await?;
    
    if let Some(toggle_menu_item) = state.toggle_menu_item.lock().map_err(|e| e.to_string())?.as_ref() {
        let _ = toggle_menu_item.set_text("Pause Timer");
    }
    
    Ok(())
}

fn find_active_level(track: &PhysicalTrack, level_num: u64) -> Option<&Level> {
    if track.levels.is_empty() {
        return None;
    }

    let mut excluded_titles = Vec::new();
    if let Some(metadata) = &track.metadata {
        if let Some(excluded) = metadata.get("excluded_exercises") {
            if let Some(arr) = excluded.as_array() {
                for val in arr {
                    if let Some(s) = val.as_str() {
                        excluded_titles.push(s);
                    }
                }
            }
        }
    }

    let mut best_up = None;
    let mut best_down = None;
    let mut min_diff_up = u64::MAX;
    let mut min_diff_down = u64::MAX;

    for level in &track.levels {
        let n = level.level_number;

        if excluded_titles.contains(&level.title.as_str()) {
            continue;
        }

        if n >= level_num {
            let diff = n - level_num;
            if diff < min_diff_up && n <= track.levels.len() as u64 {
                min_diff_up = diff;
                best_up = Some(level);
            }
        } else {
            let diff = level_num - n;
            if diff < min_diff_down {
                min_diff_down = diff;
                best_down = Some(level);
            }
        }
    }

    best_up.or(best_down)
}

#[tauri::command]
pub async fn get_session_data(
    state: tauri::State<'_, AppState>,
    break_type: String,
) -> Result<SessionDataPayload, String> {
    let config = db::load_app_config(&state.db_pool).await?;
    match break_type.as_str() {
        "active" => {
            let card = db::get_due_recall_card(&state.db_pool).await?;
            let mut rng = rand::rng();
            
            // Check if there is an active track
            let stretch = if let (Some(track_id), Some(level_num)) = (
                &config.user_progress.active_track_id,
                config.user_progress.current_level_number,
            ) {
                // Find active track
                if let Some(track) = config.tracks.iter().find(|t| t.id == *track_id) {
                    // Find active level, skipping excluded ones
                    if let Some(level) = find_active_level(track, level_num) {
                        let custom_duration = level.target_duration_secs;

                        let tier = config.user_progress.onboarding_tier.as_deref().unwrap_or("beginner");
                        let difficulty = match tier {
                            "beginner" => "Beginner",
                            "intermediate" => "Intermediate",
                            "advanced" => "Advanced",
                            "expert" => "Expert",
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

            Ok(SessionDataPayload {
                card,
                prompt: None,
                stretch,
            })
        }
        "refocus" => {
            let mut rng = rand::rng();
            let prompt = config.reflection_prompts.choose(&mut rng).cloned();
            Ok(SessionDataPayload {
                card: None,
                prompt,
                stretch: None,
            })
        }
        _ => Ok(SessionDataPayload {
            card: None,
            prompt: None,
            stretch: None,
        }),
    }
}

#[tauri::command]
pub async fn get_initial_break_data(
    state: tauri::State<'_, AppState>,
    break_type: String,
) -> Result<InitialBreakDataPayload, String> {
    let (config_res, session_data_res) = tokio::join!(
        db::load_app_config(&state.db_pool),
        get_session_data(state.clone(), break_type)
    );

    match (config_res, session_data_res) {
        (Ok(config), Ok(session_data)) => Ok(InitialBreakDataPayload { config, session_data }),
        (Err(e), _) => Err(e),
        (_, Err(e)) => Err(e),
    }
}

#[tauri::command]
pub async fn complete_break(
    app: tauri::AppHandle,
    action: String,
    reference_id: Option<String>,
    exercise_id: Option<String>,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    println!("Break completed! Action logged: {}", action);

    let _ = state.complete_break_logic(&action, reference_id.as_deref(), exercise_id.as_deref()).await?;

    if action == "done" {
        if let Ok(dir) = app.path().app_data_dir() {
            let _ = crate::core::sync::mark_local_state_dirty(&dir);
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
    if state.trigger_refocus_state().is_ok() {
        let _ = start_break_overlay(&app, "refocus");
    }
    Ok(())
}
