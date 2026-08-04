use crate::core::state::AppState;
use crate::core::models::AppConfig;
use crate::utils::fs::save_config_file;
use serde_json::Value;

#[tauri::command]
pub fn update_flashcard_metadata(
    app: tauri::AppHandle,
    card_id: String,
    metadata: Value,
    state: tauri::State<'_, AppState>,
) -> Result<AppConfig, String> {
    let updated_config = state.update_flashcard_metadata(&card_id, metadata)?;
    save_config_file(&app, &updated_config)?;
    Ok(updated_config)
}

#[tauri::command]
pub fn update_track_metadata(
    app: tauri::AppHandle,
    track_id: String,
    metadata: Value,
    state: tauri::State<'_, AppState>,
) -> Result<AppConfig, String> {
    let updated_config = state.update_track_metadata(&track_id, metadata)?;
    save_config_file(&app, &updated_config)?;
    Ok(updated_config)
}

#[tauri::command]
pub fn update_stretch_metadata(
    app: tauri::AppHandle,
    stretch_name: String,
    metadata: Value,
    state: tauri::State<'_, AppState>,
) -> Result<AppConfig, String> {
    let updated_config = state.update_stretch_metadata(&stretch_name, metadata)?;
    save_config_file(&app, &updated_config)?;
    Ok(updated_config)
}
