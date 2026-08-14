use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DriveFile {
    pub id: String,
    pub name: String,
    #[serde(rename = "mimeType")]
    pub mime_type: String,
    #[serde(rename = "createdTime")]
    pub created_time: String,
}

#[derive(Deserialize)]
struct FileListResponse {
    files: Vec<DriveFile>,
}

#[derive(Serialize)]
struct CreateFileMetadata {
    name: String,
    parents: Vec<String>,
}

pub struct DriveClient {
    client: Client,
    access_token: String,
}

impl DriveClient {
    pub fn new(access_token: String) -> Self {
        Self {
            client: Client::new(),
            access_token,
        }
    }

    /// Lists backup files in the appDataFolder space, sorted by creation time descending.
    pub async fn list_backups(&self) -> Result<Vec<DriveFile>, String> {
        let res = self.client
            .get("https://www.googleapis.com/drive/v3/files")
            .query(&[
                ("spaces", "appDataFolder"),
                ("fields", "files(id,name,mimeType,createdTime)"),
                ("orderBy", "createdTime desc"),
            ])
            .bearer_auth(&self.access_token)
            .send()
            .await
            .map_err(|e| format!("Failed to request files list from Drive: {}", e))?;

        if !res.status().is_success() {
            let err_text = res.text().await.unwrap_or_default();
            return Err(format!("Drive list files failed: {}", err_text));
        }

        let file_list: FileListResponse = res.json().await
            .map_err(|e| format!("Failed to parse file list JSON: {}", e))?;

        // Filter files that are backup zips (named like "backup-*.zip")
        let backups = file_list.files
            .into_iter()
            .filter(|f| f.name.starts_with("backup-") && f.name.ends_with(".zip"))
            .collect();

        Ok(backups)
    }

    /// Uploads a backup zip with metadata to appDataFolder.
    pub async fn upload_backup(&self, filename: &str, zip_bytes: Vec<u8>) -> Result<String, String> {
        let url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

        // Create the multipart form
        let metadata = CreateFileMetadata {
            name: filename.to_string(),
            parents: vec!["appDataFolder".to_string()],
        };
        let metadata_part = reqwest::multipart::Part::text(serde_json::to_string(&metadata).unwrap())
            .mime_str("application/json")
            .map_err(|e: reqwest::Error| e.to_string())?;

        let file_part = reqwest::multipart::Part::bytes(zip_bytes)
            .mime_str("application/zip")
            .map_err(|e: reqwest::Error| e.to_string())?;

        let form = reqwest::multipart::Form::new()
            .part("metadata", metadata_part)
            .part("file", file_part);

        let res = self.client
            .post(url)
            .bearer_auth(&self.access_token)
            .multipart(form)
            .send()
            .await
            .map_err(|e| format!("Failed to upload file: {}", e))?;

        if !res.status().is_success() {
            let err_text = res.text().await.unwrap_or_default();
            return Err(format!("Drive upload failed: {}", err_text));
        }

        #[derive(Deserialize)]
        struct UploadResponse {
            id: String,
        }
        let upload_res: UploadResponse = res.json().await
            .map_err(|e| format!("Failed to parse upload response: {}", e))?;

        Ok(upload_res.id)
    }

    /// Downloads the bytes of a backup file from Google Drive.
    pub async fn download_backup(&self, file_id: &str) -> Result<Vec<u8>, String> {
        let url = format!("https://www.googleapis.com/drive/v3/files/{}?alt=media", file_id);

        let res = self.client
            .get(&url)
            .bearer_auth(&self.access_token)
            .send()
            .await
            .map_err(|e| format!("Failed to download backup: {}", e))?;

        if !res.status().is_success() {
            let err_text = res.text().await.unwrap_or_default();
            return Err(format!("Drive download failed: {}", err_text));
        }

        let bytes = res.bytes().await
            .map_err(|e| format!("Failed to read downloaded body: {}", e))?;

        Ok(bytes.to_vec())
    }

    /// Deletes a file from Google Drive.
    pub async fn delete_backup(&self, file_id: &str) -> Result<(), String> {
        let url = format!("https://www.googleapis.com/drive/v3/files/{}", file_id);

        let res = self.client
            .delete(&url)
            .bearer_auth(&self.access_token)
            .send()
            .await
            .map_err(|e| format!("Failed to delete file: {}", e))?;

        if !res.status().is_success() {
            let err_text = res.text().await.unwrap_or_default();
            return Err(format!("Drive delete failed: {}", err_text));
        }

        Ok(())
    }

    /// Rotates backups in the appDataFolder to ensure we only keep the last N generations.
    pub async fn rotate_backups(&self, max_generations: usize) -> Result<(), String> {
        let backups = self.list_backups().await?;

        if backups.len() > max_generations {
            // Backups are sorted by createdTime desc, so indices >= max_generations are old backups
            for old_backup in &backups[max_generations..] {
                let _ = self.delete_backup(&old_backup.id).await;
            }
        }

        Ok(())
    }
}
