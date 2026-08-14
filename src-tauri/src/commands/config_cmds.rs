use tauri_plugin_opener::OpenerExt;

use crate::core::state::AppState;
use crate::core::models::AppConfig;
use crate::utils::db;
use tauri::Manager;

#[tauri::command]
pub async fn set_active_track(
    app: tauri::AppHandle,
    track_id: Option<String>,
    onboarding_tier: Option<String>,
    starting_level: Option<u64>,
    state: tauri::State<'_, AppState>,
) -> Result<AppConfig, String> {
    let mut config = db::load_app_config(&state.db_pool).await?;
    
    config.user_progress.active_track_id = track_id;
    config.user_progress.onboarding_tier = onboarding_tier;
    config.user_progress.current_level_number = starting_level;
    config.user_progress.completed_sessions_count = 0;
    config.user_progress.last_completed_at = None;
    config.user_progress.level_started_at = Some(chrono::Utc::now().to_rfc3339());
    
    config.populate_levels();
    
    db::save_app_config(&state.db_pool, &config).await?;
    
    if let Ok(dir) = app.path().app_data_dir() {
        let _ = crate::core::sync::mark_local_state_dirty(&dir);
    }
    
    Ok(config)
}

#[tauri::command]
pub async fn update_track_level(
    app: tauri::AppHandle,
    level_number: u64,
    state: tauri::State<'_, AppState>,
) -> Result<AppConfig, String> {
    let mut progress = db::load_user_progress(&state.db_pool).await?;
    
    progress.current_level_number = Some(level_number);
    progress.completed_sessions_count = 0;
    progress.level_started_at = Some(chrono::Utc::now().to_rfc3339());
    
    db::save_user_progress(&state.db_pool, &progress).await?;
    
    if let Ok(dir) = app.path().app_data_dir() {
        let _ = crate::core::sync::mark_local_state_dirty(&dir);
    }
    
    let config = db::load_app_config(&state.db_pool).await?;
    Ok(config)
}

#[tauri::command]
pub fn open_external_url(app: tauri::AppHandle, url: String) -> Result<(), String> {
    app.opener().open_url(&url, None::<&str>).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_app_config(state: tauri::State<'_, AppState>) -> Result<AppConfig, String> {
    let config = db::load_app_config(&state.db_pool).await?;
    Ok(config)
}

#[tauri::command]
pub async fn save_app_config(
    app: tauri::AppHandle,
    mut new_config: AppConfig,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    new_config.populate_levels();
    db::save_app_config(&state.db_pool, &new_config).await?;
    
    // Update cached settings in State
    {
        let mut cached = state.cached_settings.lock().map_err(|e| e.to_string())?;
        *cached = new_config.settings.clone();
    }
    
    // Configure run at start
    let _ = crate::utils::fs::set_run_at_start(&app, new_config.settings.run_at_start);
    
    if let Ok(dir) = app.path().app_data_dir() {
        let _ = crate::core::sync::mark_local_state_dirty(&dir);
    }
    
    Ok(())
}

#[tauri::command]
pub fn relaunch_app(app: tauri::AppHandle) {
    app.restart();
}

