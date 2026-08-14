pub mod metadata;
pub mod oauth;
pub mod drive;
pub mod snapshot;

use std::fs;
use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use tauri::Manager;

use crate::core::state::AppState;
use crate::core::sync::oauth::{get_refresh_token, refresh_access_token, get_user_info};
use crate::core::sync::drive::DriveClient;
use crate::core::sync::snapshot::SnapshotManager;
use rand::RngExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalSyncState {
    pub device_id: String,
    pub sync_version: i64,
    pub last_remote_sync_version: Option<i64>,
    pub last_uploaded_payload_hash: Option<String>,
    pub last_successful_sync_time: Option<String>,
    pub is_dirty: bool,
    pub user_email: Option<String>,
}

impl LocalSyncState {
    pub fn new() -> Self {
        let mut rng = rand::rng();
        let bytes: [u8; 16] = rng.random();
        let uuid = format!(
            "{:02x}{:02x}{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}{:02x}{:02x}{:02x}{:02x}",
            bytes[0], bytes[1], bytes[2], bytes[3],
            bytes[4], bytes[5],
            bytes[6], bytes[7],
            bytes[8], bytes[9],
            bytes[10], bytes[11], bytes[12], bytes[13], bytes[14], bytes[15]
        );

        Self {
            device_id: uuid,
            sync_version: 0,
            last_remote_sync_version: None,
            last_uploaded_payload_hash: None,
            last_successful_sync_time: None,
            is_dirty: true,
            user_email: None,
        }
    }
}

pub fn get_sync_state_path(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join("sync_state.json")
}

pub fn load_local_sync_state(app_data_dir: &Path) -> LocalSyncState {
    let path = get_sync_state_path(app_data_dir);
    if path.exists() {
        if let Ok(data) = fs::read_to_string(path) {
            if let Ok(state) = serde_json::from_str::<LocalSyncState>(&data) {
                return state;
            }
        }
    }
    // If not exists or invalid, create a fresh one and save it
    let fresh = LocalSyncState::new();
    let _ = save_local_sync_state(app_data_dir, &fresh);
    fresh
}

pub fn save_local_sync_state(app_data_dir: &Path, state: &LocalSyncState) -> Result<(), String> {
    let path = get_sync_state_path(app_data_dir);
    let data = serde_json::to_string_pretty(state).map_err(|e| e.to_string())?;
    fs::write(path, data).map_err(|e| e.to_string())?;
    Ok(())
}

/// Marks the local sync state as dirty so that the next sync will upload changes.
pub fn mark_local_state_dirty(app_data_dir: &Path) -> Result<(), String> {
    let mut state = load_local_sync_state(app_data_dir);
    state.is_dirty = true;
    save_local_sync_state(app_data_dir, &state)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum SyncResult {
    Success {
        last_sync_time: String,
        email: String,
    },
    NotLoggedIn,
    Conflict {
        remote_device: String,
        remote_updated_at: String,
        local_updated_at: String,
        remote_file_id: String,
    },
    NoChange,
}

pub async fn run_sync(
    app: &tauri::AppHandle,
    force_choice: Option<&str>, // Some("local") or Some("remote") to resolve conflict
) -> Result<SyncResult, String> {
    // 1. Check refresh token in keychain
    let refresh_token = match get_refresh_token() {
        Ok(t) => t,
        Err(_) => return Ok(SyncResult::NotLoggedIn),
    };

    // 2. Refresh access token
    let access_token = refresh_access_token(&refresh_token).await?;
    let drive_client = DriveClient::new(access_token.clone());

    // 3. Load user info & sync state
    let user_info = get_user_info(&access_token).await?;
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let mut local_state = load_local_sync_state(&app_data_dir);
    local_state.user_email = Some(user_info.email.clone());

    let state = app.state::<AppState>();
    let snapshot_manager = SnapshotManager::new(&app_data_dir);

    // 4. List remote backups
    // Extend drive.rs to include appProperties in query fields:
    // GET /files?spaces=appDataFolder&fields=files(id,name,mimeType,createdTime,appProperties)
    // Wait, let's fetch files.
    let backups = drive_client.list_backups().await?;

    if backups.is_empty() {
        // No remote backup exists. Upload local snapshot.
        let new_version = local_state.sync_version + 1;
        let (zip_bytes, hash) = snapshot_manager.create_snapshot(&state.db_pool, &local_state.device_id, new_version).await?;
        
        let filename = format!("backup-{}.zip", chrono::Utc::now().timestamp());
        let _file_id = drive_client.upload_backup(&filename, zip_bytes).await?;

        // Update properties of the file on Drive by writing metadata properties
        // (For simplification, the metadata was uploaded in multipart upload body in drive.rs).
        // Let's update local state
        local_state.sync_version = new_version;
        local_state.last_remote_sync_version = Some(new_version);
        local_state.last_uploaded_payload_hash = Some(hash);
        local_state.last_successful_sync_time = Some(chrono::Utc::now().to_rfc3339());
        local_state.is_dirty = false;
        
        save_local_sync_state(&app_data_dir, &local_state)?;

        return Ok(SyncResult::Success {
            last_sync_time: local_state.last_successful_sync_time.clone().unwrap(),
            email: user_info.email,
        });
    }

    // A backup exists on Drive. Check the latest.
    let latest_backup = &backups[0];
    
    // We download the ZIP and parse metadata since it is standard and bulletproof
    let zip_bytes = drive_client.download_backup(&latest_backup.id).await?;
    let (remote_metadata, _settings_json, _temp_dir, temp_db_path) = snapshot_manager.verify_and_extract_payload(&zip_bytes)?;

    let is_conflict = local_state.is_dirty 
        && local_state.last_remote_sync_version.unwrap_or(0) != remote_metadata.sync_version
        && local_state.device_id != remote_metadata.device_id;

    if is_conflict && force_choice.is_none() {
        return Ok(SyncResult::Conflict {
            remote_device: remote_metadata.device_id,
            remote_updated_at: remote_metadata.updated_at,
            local_updated_at: local_state.last_successful_sync_time.clone().unwrap_or_else(|| "Never".to_string()),
            remote_file_id: latest_backup.id.clone(),
        });
    }

    if let Some(choice) = force_choice {
        if choice == "remote" {
            // Keep Cloud: replace local DB
            state.db_pool.close().await;
            snapshot_manager.install_restored_db(&temp_db_path)?;
            
            local_state.sync_version = remote_metadata.sync_version;
            local_state.last_remote_sync_version = Some(remote_metadata.sync_version);
            local_state.last_uploaded_payload_hash = Some(remote_metadata.payload_hash);
            local_state.last_successful_sync_time = Some(chrono::Utc::now().to_rfc3339());
            local_state.is_dirty = false;
            save_local_sync_state(&app_data_dir, &local_state)?;

            // Restart app to reload database after a short delay
            let app_clone = app.clone();
            tauri::async_runtime::spawn(async move {
                tokio::time::sleep(std::time::Duration::from_millis(500)).await;
                app_clone.restart();
            });
            return Ok(SyncResult::Success {
                last_sync_time: local_state.last_successful_sync_time.clone().unwrap(),
                email: user_info.email,
            });
        } else if choice == "local" {
            // Keep Local: force upload, overwrite cloud
            let new_version = remote_metadata.sync_version + 1;
            let (zip_bytes, hash) = snapshot_manager.create_snapshot(&state.db_pool, &local_state.device_id, new_version).await?;
            let filename = format!("backup-{}.zip", chrono::Utc::now().timestamp());
            let _file_id = drive_client.upload_backup(&filename, zip_bytes).await?;

            local_state.sync_version = new_version;
            local_state.last_remote_sync_version = Some(new_version);
            local_state.last_uploaded_payload_hash = Some(hash);
            local_state.last_successful_sync_time = Some(chrono::Utc::now().to_rfc3339());
            local_state.is_dirty = false;
            save_local_sync_state(&app_data_dir, &local_state)?;

            let _ = drive_client.rotate_backups(3).await;

            return Ok(SyncResult::Success {
                last_sync_time: local_state.last_successful_sync_time.clone().unwrap(),
                email: user_info.email,
            });
        }
    }

    // No conflict, run normal sync state machine
    if remote_metadata.payload_hash == local_state.last_uploaded_payload_hash.clone().unwrap_or_default() {
        // Hash matches remote.
        if local_state.is_dirty {
            // Local is dirty but hashes were identical? Should upload local since it's dirty.
            let new_version = remote_metadata.sync_version + 1;
            let (zip_bytes, hash) = snapshot_manager.create_snapshot(&state.db_pool, &local_state.device_id, new_version).await?;
            let filename = format!("backup-{}.zip", chrono::Utc::now().timestamp());
            let _file_id = drive_client.upload_backup(&filename, zip_bytes).await?;

            local_state.sync_version = new_version;
            local_state.last_remote_sync_version = Some(new_version);
            local_state.last_uploaded_payload_hash = Some(hash);
            local_state.last_successful_sync_time = Some(chrono::Utc::now().to_rfc3339());
            local_state.is_dirty = false;
            save_local_sync_state(&app_data_dir, &local_state)?;

            let _ = drive_client.rotate_backups(3).await;
        } else {
            // No-op
            local_state.last_successful_sync_time = Some(chrono::Utc::now().to_rfc3339());
            save_local_sync_state(&app_data_dir, &local_state)?;
            return Ok(SyncResult::NoChange);
        }
    } else if remote_metadata.sync_version > local_state.sync_version {
        // Remote is newer. Replace local DB.
        state.db_pool.close().await;
        snapshot_manager.install_restored_db(&temp_db_path)?;
        
        local_state.sync_version = remote_metadata.sync_version;
        local_state.last_remote_sync_version = Some(remote_metadata.sync_version);
        local_state.last_uploaded_payload_hash = Some(remote_metadata.payload_hash);
        local_state.last_successful_sync_time = Some(chrono::Utc::now().to_rfc3339());
        local_state.is_dirty = false;
        save_local_sync_state(&app_data_dir, &local_state)?;

        // Restart app to reload database after a short delay
        let app_clone = app.clone();
        tauri::async_runtime::spawn(async move {
            tokio::time::sleep(std::time::Duration::from_millis(500)).await;
            app_clone.restart();
        });
        return Ok(SyncResult::Success {
            last_sync_time: local_state.last_successful_sync_time.clone().unwrap(),
            email: user_info.email,
        });
    } else {
        // Local is newer. Upload snapshot.
        let new_version = local_state.sync_version + 1;
        let (zip_bytes, hash) = snapshot_manager.create_snapshot(&state.db_pool, &local_state.device_id, new_version).await?;
        let filename = format!("backup-{}.zip", chrono::Utc::now().timestamp());
        let _file_id = drive_client.upload_backup(&filename, zip_bytes).await?;

        local_state.sync_version = new_version;
        local_state.last_remote_sync_version = Some(new_version);
        local_state.last_uploaded_payload_hash = Some(hash);
        local_state.last_successful_sync_time = Some(chrono::Utc::now().to_rfc3339());
        local_state.is_dirty = false;
        save_local_sync_state(&app_data_dir, &local_state)?;

        let _ = drive_client.rotate_backups(3).await;
    }

    Ok(SyncResult::Success {
        last_sync_time: local_state.last_successful_sync_time.clone().unwrap(),
        email: user_info.email,
    })
}
