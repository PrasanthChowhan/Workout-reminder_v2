
use tauri_plugin_opener::OpenerExt;

use crate::core::state::{AppState, AppConfig};
use crate::utils::fs::save_config_file;

#[tauri::command]
pub fn set_active_track(
    app: tauri::AppHandle,
    track_id: Option<String>,
    onboarding_tier: Option<String>,
    starting_level: Option<u64>,
    state: tauri::State<'_, AppState>,
) -> Result<AppConfig, String> {
    let mut config = state.config.lock().unwrap();
    
    config.user_progress.active_track_id = track_id;
    config.user_progress.onboarding_tier = onboarding_tier;
    config.user_progress.current_level_number = starting_level;
    config.user_progress.completed_sessions_count = 0;
    config.user_progress.last_completed_at = None;
    config.user_progress.level_started_at = Some(chrono::Utc::now().to_rfc3339());
    
    save_config_file(&app, &config)?;
    Ok(config.clone())
}

#[tauri::command]
pub fn update_track_level(
    app: tauri::AppHandle,
    level_number: u64,
    state: tauri::State<'_, AppState>,
) -> Result<AppConfig, String> {
    let mut config = state.config.lock().unwrap();
    
    config.user_progress.current_level_number = Some(level_number);
    config.user_progress.completed_sessions_count = 0;
    config.user_progress.level_started_at = Some(chrono::Utc::now().to_rfc3339());
    
    save_config_file(&app, &config)?;
    Ok(config.clone())
}

#[tauri::command]
pub fn open_external_url(app: tauri::AppHandle, url: String) -> Result<(), String> {
    app.opener().open_url(&url, None::<&str>).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_app_config(state: tauri::State<'_, AppState>) -> AppConfig {
    state.config.lock().unwrap().clone()
}

#[tauri::command]
pub fn save_app_config(
    app: tauri::AppHandle,
    new_config: AppConfig,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    save_config_file(&app, &new_config)?;
    let mut config = state.config.lock().unwrap();
    *config = new_config;
    Ok(())
}
