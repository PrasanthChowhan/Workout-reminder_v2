use tauri_plugin_opener::OpenerExt;

use crate::core::state::AppState;
use crate::core::models::AppConfig;
use crate::utils::db;

#[tauri::command]
pub async fn set_active_track(
    track_id: Option<String>,
    onboarding_tier: Option<String>,
    starting_level: Option<u64>,
    state: tauri::State<'_, AppState>,
) -> Result<AppConfig, String> {
    let mut progress = db::load_user_progress(&state.db_pool).await?;
    
    progress.active_track_id = track_id;
    progress.onboarding_tier = onboarding_tier;
    progress.current_level_number = starting_level;
    progress.completed_sessions_count = 0;
    progress.last_completed_at = None;
    progress.level_started_at = Some(chrono::Utc::now().to_rfc3339());
    
    db::save_user_progress(&state.db_pool, &progress).await?;
    
    let config = db::load_app_config(&state.db_pool).await?;
    Ok(config)
}

#[tauri::command]
pub async fn update_track_level(
    level_number: u64,
    state: tauri::State<'_, AppState>,
) -> Result<AppConfig, String> {
    let mut progress = db::load_user_progress(&state.db_pool).await?;
    
    progress.current_level_number = Some(level_number);
    progress.completed_sessions_count = 0;
    progress.level_started_at = Some(chrono::Utc::now().to_rfc3339());
    
    db::save_user_progress(&state.db_pool, &progress).await?;
    
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
    new_config: AppConfig,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    db::save_app_config(&state.db_pool, &new_config).await?;
    
    // Update cached settings in State
    {
        let mut cached = state.cached_settings.lock().map_err(|e| e.to_string())?;
        *cached = new_config.settings.clone();
    }
    
    // Configure run at start
    let _ = crate::utils::fs::set_run_at_start(&app, new_config.settings.run_at_start);
    
    Ok(())
}
