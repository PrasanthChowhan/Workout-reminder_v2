use crate::core::state::AppState;
use crate::core::models::AppConfig;
use crate::utils::db;
use serde_json::Value;

#[tauri::command]
pub async fn update_flashcard_metadata(
    card_id: String,
    metadata: Value,
    state: tauri::State<'_, AppState>,
) -> Result<AppConfig, String> {
    db::update_flashcard_meta(&state.db_pool, &card_id, metadata).await?;
    let updated_config = db::load_app_config(&state.db_pool).await?;
    Ok(updated_config)
}

#[tauri::command]
pub async fn update_track_metadata(
    track_id: String,
    metadata: Value,
    state: tauri::State<'_, AppState>,
) -> Result<AppConfig, String> {
    db::update_track_meta(&state.db_pool, &track_id, metadata).await?;
    let updated_config = db::load_app_config(&state.db_pool).await?;
    Ok(updated_config)
}

#[tauri::command]
pub async fn update_stretch_metadata(
    stretch_name: String,
    metadata: Value,
    state: tauri::State<'_, AppState>,
) -> Result<AppConfig, String> {
    db::update_stretch_meta(&state.db_pool, &stretch_name, metadata).await?;
    let updated_config = db::load_app_config(&state.db_pool).await?;
    Ok(updated_config)
}
