use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

#[tauri::command]
async fn create_dev_issue<R: Runtime>(app: tauri::AppHandle<R>, text: String) -> Result<(), String> {
    let mut current_dir = std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
    let mut issues_dir = current_dir.join("issues");
    
    // traverse up to find 'issues' or the root '.git'
    let mut found = false;
    for _ in 0..5 {
        if issues_dir.exists() || current_dir.join(".git").exists() {
            issues_dir = current_dir.join("issues");
            found = true;
            break;
        }
        if let Some(parent) = current_dir.parent() {
            current_dir = parent.to_path_buf();
            issues_dir = current_dir.join("issues");
        } else {
            break;
        }
    }

    if !found {
        // Fallback: create issues in app_data_dir/issues
        issues_dir = app.path().app_data_dir().unwrap().join("issues");
    }

    if !issues_dir.exists() {
        std::fs::create_dir_all(&issues_dir).map_err(|e| e.to_string())?;
    }

    let timestamp = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
    let file_path = issues_dir.join(format!("issue-{}.md", timestamp));
    std::fs::write(&file_path, text).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("dev-issues")
        .invoke_handler(tauri::generate_handler![create_dev_issue])
        .build()
}
