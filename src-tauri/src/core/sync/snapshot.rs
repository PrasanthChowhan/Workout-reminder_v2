use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use sha2::{Digest, Sha256};
use sqlx::SqlitePool;
use tempfile::TempDir;
use zip::write::SimpleFileOptions;
use zip::{CompressionMethod, ZipArchive, ZipWriter};

use crate::core::sync::metadata::BackupMetadata;

pub struct SnapshotManager {
    db_path: PathBuf,
}

impl SnapshotManager {
    pub fn new(app_data_dir: &Path) -> Self {
        Self {
            db_path: app_data_dir.join("workout_data.sqlite"),
        }
    }

    /// Creates a consistent ZIP snapshot of the database and settings.
    /// Returns the ZIP bytes and its SHA256 hash.
    pub async fn create_snapshot(
        &self,
        pool: &SqlitePool,
        device_id: &str,
        sync_version: i64,
    ) -> Result<(Vec<u8>, String), String> {
        let temp_dir = TempDir::new().map_err(|e| e.to_string())?;
        let temp_db_path = temp_dir.path().join("workout_data_temp.sqlite");

        // 1. Create a consistent SQLite snapshot via VACUUM INTO
        // Ensure any previous file is removed
        if temp_db_path.exists() {
            let _ = fs::remove_file(&temp_db_path);
        }
        
        let temp_db_str = temp_db_path.to_string_lossy().to_string();
        sqlx::query("VACUUM INTO ?")
            .bind(&temp_db_str)
            .execute(pool)
            .await
            .map_err(|e| format!("VACUUM INTO failed: {}", e))?;

        // 2. Fetch schema version
        let schema_version: i32 = sqlx::query_scalar("PRAGMA user_version")
            .fetch_one(pool)
            .await
            .unwrap_or(0);

        // 3. Load settings for the JSON payload
        let settings = crate::utils::db::load_settings(pool).await?;
        let settings_json = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;

        // 4. Read DB bytes to compute hash
        let mut db_file = File::open(&temp_db_path).map_err(|e| e.to_string())?;
        let mut db_bytes = Vec::new();
        db_file.read_to_end(&mut db_bytes).map_err(|e| e.to_string())?;

        let mut hasher = Sha256::new();
        hasher.update(&db_bytes);
        let payload_hash = format!("{:x}", hasher.finalize());

        // 5. Generate metadata
        let metadata = BackupMetadata {
            version: 1,
            device_id: device_id.to_string(),
            schema_version,
            updated_at: chrono::Utc::now().to_rfc3339(),
            payload_hash: payload_hash.clone(),
            sync_version,
        };
        let metadata_json = serde_json::to_string_pretty(&metadata).map_err(|e| e.to_string())?;

        // 6. Build the ZIP archive in memory
        let zip_buffer = Vec::new();
        let mut cursor = std::io::Cursor::new(zip_buffer);
        {
            let mut zip = ZipWriter::new(&mut cursor);
            let options = SimpleFileOptions::default()
                .compression_method(CompressionMethod::Deflated);

            zip.start_file("metadata.json", options).map_err(|e| e.to_string())?;
            zip.write_all(metadata_json.as_bytes()).map_err(|e| e.to_string())?;

            zip.start_file("settings.json", options).map_err(|e| e.to_string())?;
            zip.write_all(settings_json.as_bytes()).map_err(|e| e.to_string())?;

            zip.start_file("database.sqlite", options).map_err(|e| e.to_string())?;
            zip.write_all(&db_bytes).map_err(|e| e.to_string())?;

            zip.finish().map_err(|e| e.to_string())?;
        }

        let zip_bytes = cursor.into_inner();
        Ok((zip_bytes, payload_hash))
    }

    /// Verifies and extracts a zip payload.
    /// Returns the metadata, settings, and temporary path of the extracted database file.
    pub fn verify_and_extract_payload(
        &self,
        zip_bytes: &[u8],
    ) -> Result<(BackupMetadata, String, TempDir, PathBuf), String> {
        let cursor = std::io::Cursor::new(zip_bytes);
        let mut archive = ZipArchive::new(cursor).map_err(|e| e.to_string())?;

        let mut metadata_content = String::new();
        let mut settings_content = String::new();
        let mut db_bytes = Vec::new();

        for i in 0..archive.len() {
            let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
            let name = file.name().to_string();
            if name == "metadata.json" {
                file.read_to_string(&mut metadata_content).map_err(|e| e.to_string())?;
            } else if name == "settings.json" {
                file.read_to_string(&mut settings_content).map_err(|e| e.to_string())?;
            } else if name == "database.sqlite" {
                file.read_to_end(&mut db_bytes).map_err(|e| e.to_string())?;
            }
        }

        if metadata_content.is_empty() {
            return Err("Missing metadata.json in backup payload.".to_string());
        }
        if db_bytes.is_empty() {
            return Err("Missing database.sqlite in backup payload.".to_string());
        }

        let metadata: BackupMetadata = serde_json::from_str(&metadata_content)
            .map_err(|e| format!("Failed to parse metadata: {}", e))?;

        // Verify SHA256 of extracted DB bytes matches the metadata payload_hash
        let mut hasher = Sha256::new();
        hasher.update(&db_bytes);
        let actual_hash = format!("{:x}", hasher.finalize());

        if actual_hash != metadata.payload_hash {
            return Err("Backup integrity check failed: SHA256 hash mismatch.".to_string());
        }

        // Write the database to a temporary location
        let temp_dir = TempDir::new().map_err(|e| e.to_string())?;
        let temp_db_path = temp_dir.path().join("workout_data_restore.sqlite");
        let mut temp_file = File::create(&temp_db_path).map_err(|e| e.to_string())?;
        temp_file.write_all(&db_bytes).map_err(|e| e.to_string())?;

        Ok((metadata, settings_content, temp_dir, temp_db_path))
    }

    /// Atomically replaces the current SQLite file with the restored one.
    pub fn install_restored_db(&self, temp_db_path: &Path) -> Result<(), String> {
        let parent = self.db_path.parent().ok_or_else(|| "Invalid database directory path".to_string())?;
        let backup_path = parent.join("workout_data.sqlite.old");

        // Rename current live database out of the way
        if self.db_path.exists() {
            fs::rename(&self.db_path, &backup_path).map_err(|e| format!("Failed to backup current DB: {}", e))?;
        }

        // Copy/move the temporary file to the live location
        if let Err(e) = fs::copy(temp_db_path, &self.db_path) {
            // Restore original on failure
            if backup_path.exists() {
                let _ = fs::rename(&backup_path, &self.db_path);
            }
            return Err(format!("Failed to install restored database file: {}", e));
        }

        // Clean up backup file
        if backup_path.exists() {
            let _ = fs::remove_file(backup_path);
        }

        Ok(())
    }
}
