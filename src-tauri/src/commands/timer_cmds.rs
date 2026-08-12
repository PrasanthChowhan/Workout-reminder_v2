use rand::prelude::IndexedRandom;

use crate::core::state::AppState;
use crate::core::models::{TimerStatePayload, SessionDataPayload, Stretch, PhysicalTrack, Level, InitialBreakDataPayload};
use crate::system::window::{close_break_overlay, start_break_overlay};
use crate::utils::db;

#[tauri::command]
pub fn get_timer_state(state: tauri::State<'_, AppState>) -> Result<TimerStatePayload, String> {
    Ok(TimerStatePayload {
        micro_left: *state.micro_countdown.lock().map_err(|e| e.to_string())?,
        active_left: *state.active_countdown.lock().map_err(|e| e.to_string())?,
        timer_paused: *state.timer_paused.lock().map_err(|e| e.to_string())?,
        current_break_state: state.current_break_state.lock().map_err(|e| e.to_string())?.clone(),
    })
}

#[tauri::command]
pub fn toggle_timer(state: tauri::State<'_, AppState>) -> Result<bool, String> {
    let mut paused = state.timer_paused.lock().map_err(|e| e.to_string())?;
    *paused = !*paused;
    Ok(*paused)
}

fn is_level_excluded(track: &PhysicalTrack, level_title: &str) -> bool {
    if let Some(metadata) = &track.metadata {
        if let Some(excluded) = metadata.get("excluded_exercises") {
            if let Some(arr) = excluded.as_array() {
                return arr.iter().any(|val| val.as_str() == Some(level_title));
            }
        }
    }
    false
}

fn find_active_level(track: &PhysicalTrack, level_num: u64) -> Option<&Level> {
    if track.levels.is_empty() {
        return None;
    }

    // First search upwards from level_num to max
    for num in level_num..=(track.levels.len() as u64) {
        if let Some(level) = track.levels.iter().find(|l| l.level_number == num) {
            if !is_level_excluded(track, &level.title) {
                return Some(level);
            }
        }
    }

    // Then search downwards from level_num - 1 to 1
    for num in (1..level_num).rev() {
        if let Some(level) = track.levels.iter().find(|l| l.level_number == num) {
            if !is_level_excluded(track, &level.title) {
                return Some(level);
            }
        }
    }

    None
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
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    println!("Break completed! Action logged: {}", action);

    let _ = state.complete_break_logic(&action).await?;

    // Hide window and restore normal desktop dimensions
    let _ = close_break_overlay(&app);

    Ok(())
}

#[tauri::command]
pub fn trigger_refocus(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    state.trigger_refocus_state()?;
    let _ = start_break_overlay(&app, "refocus");
    Ok(())
}
