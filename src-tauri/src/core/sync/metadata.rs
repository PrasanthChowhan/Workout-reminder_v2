use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupMetadata {
    pub version: i32,
    pub device_id: String,
    pub schema_version: i32,
    pub updated_at: String,
    pub payload_hash: String,
    pub sync_version: i64,
}
