use crate::core::state::AppState;
use crate::core::models::{JsonImportSchema, RecallConcept, DailyQuestionStatus};
use crate::utils::db;
use serde_json::Value;

#[tauri::command]
pub async fn import_recall_json(
    json_str: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let data: JsonImportSchema = serde_json::from_str(&json_str)
        .map_err(|e| format!("Invalid JSON format: {}", e))?;
    db::import_recall_json_to_db(&state.db_pool, data).await?;
    Ok(())
}

#[tauri::command]
pub async fn export_recall_json(
    state: tauri::State<'_, AppState>,
) -> Result<JsonImportSchema, String> {
    db::export_recall_db_to_json(&state.db_pool).await
}

#[tauri::command]
pub async fn get_recall_concepts(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<RecallConcept>, String> {
    db::get_recall_concepts(&state.db_pool).await
}

#[tauri::command]
pub async fn update_variant_srs(
    variant_id: String,
    rating: u32,
    reference_id: Option<String>,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    db::update_variant_srs(&state.db_pool, &variant_id, rating, reference_id.as_deref()).await
}

#[tauri::command]
pub async fn update_track_metadata(
    track_id: String,
    metadata: Value,
    state: tauri::State<'_, AppState>,
) -> Result<crate::core::models::AppConfig, String> {
    db::update_track_meta(&state.db_pool, &track_id, metadata).await?;
    let updated_config = db::load_app_config(&state.db_pool).await?;
    Ok(updated_config)
}

#[tauri::command]
pub async fn update_stretch_metadata(
    stretch_name: String,
    metadata: Value,
    state: tauri::State<'_, AppState>,
) -> Result<crate::core::models::AppConfig, String> {
    db::update_stretch_meta(&state.db_pool, &stretch_name, metadata).await?;
    let updated_config = db::load_app_config(&state.db_pool).await?;
    Ok(updated_config)
}

#[tauri::command]
pub async fn get_statistics(
    state: tauri::State<'_, AppState>,
) -> Result<crate::core::models::StatisticsPayload, String> {
    db::get_statistics(&state.db_pool).await
}

#[tauri::command]
pub async fn check_daily_question_status(
    state: tauri::State<'_, AppState>,
) -> Result<DailyQuestionStatus, String> {
    let settings = db::load_settings(&state.db_pool).await?;
    let local_date = chrono::Local::now().format("%Y-%m-%d").to_string();
    let answered_today = db::check_daily_question_answered(&state.db_pool, &local_date).await?;
    
    Ok(DailyQuestionStatus {
        enabled: settings.daily_prompt_enabled,
        answered_today,
        question: settings.daily_prompt,
    })
}

#[tauri::command]
pub async fn submit_daily_question_response(
    response: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let local_date = chrono::Local::now().format("%Y-%m-%d").to_string();
    db::insert_daily_question_response(&state.db_pool, &local_date, &response).await?;
    Ok(())
}
