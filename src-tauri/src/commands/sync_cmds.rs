use serde::Serialize;
use tauri::{AppHandle, Manager};

use crate::core::sync::{
    load_local_sync_state, save_local_sync_state, run_sync, SyncResult,
    oauth::{start_oauth_flow, delete_refresh_token, get_refresh_token, save_refresh_token}
};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncStatusPayload {
    pub is_logged_in: bool,
    pub email: Option<String>,
    pub device_id: String,
    pub last_sync_time: Option<String>,
}

#[tauri::command]
pub async fn get_sync_status(app: AppHandle) -> Result<SyncStatusPayload, String> {
    let app_data_dir = app.path().app_data_dir().map_err(|e: tauri::Error| e.to_string())?;
    let local_state = load_local_sync_state(&app_data_dir);
    let is_logged_in = get_refresh_token().is_ok();

    Ok(SyncStatusPayload {
        is_logged_in,
        email: if is_logged_in { local_state.user_email } else { None },
        device_id: local_state.device_id,
        last_sync_time: local_state.last_successful_sync_time,
    })
}

#[tauri::command]
pub async fn login_google(app: AppHandle) -> Result<SyncResult, String> {
    // 1. Start browser oauth PKCE
    let (_access_token, refresh_token, user_info) = start_oauth_flow(&app).await?;

    // 2. Save refresh token to keyring
    save_refresh_token(&refresh_token)?;

    // 3. Update local sync state with user info
    let app_data_dir = app.path().app_data_dir().map_err(|e: tauri::Error| e.to_string())?;
    let mut local_state = load_local_sync_state(&app_data_dir);
    local_state.user_email = Some(user_info.email);
    save_local_sync_state(&app_data_dir, &local_state)?;

    // 4. Run initial synchronization
    let res = run_sync(&app, None).await?;

    Ok(res)
}

#[tauri::command]
pub async fn logout_google(app: AppHandle) -> Result<(), String> {
    // 1. Delete refresh token from keychain
    let _ = delete_refresh_token();

    // 2. Reset local sync state JSON but preserve device ID
    let app_data_dir = app.path().app_data_dir().map_err(|e: tauri::Error| e.to_string())?;
    let mut local_state = load_local_sync_state(&app_data_dir);
    local_state.user_email = None;
    local_state.last_remote_sync_version = None;
    local_state.last_uploaded_payload_hash = None;
    local_state.last_successful_sync_time = None;
    save_local_sync_state(&app_data_dir, &local_state)?;

    Ok(())
}

#[tauri::command]
pub async fn sync_now(
    app: AppHandle,
    force_choice: Option<String>,
) -> Result<SyncResult, String> {
    let res = run_sync(&app, force_choice.as_deref()).await?;
    Ok(res)
}
