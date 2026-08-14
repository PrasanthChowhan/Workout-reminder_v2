use std::fs;
use std::path::Path;

fn main() {
    // Try to load .env from parent directory
    let env_path = Path::new("../.env");
    if env_path.exists() {
        if let Ok(content) = fs::read_to_string(env_path) {
            for line in content.lines() {
                let line = line.trim();
                if line.is_empty() || line.starts_with('#') {
                    continue;
                }
                if let Some((key, value)) = line.split_once('=') {
                    let key = key.trim();
                    let value = value.trim().trim_matches('"').trim_matches('\'');
                    println!("cargo:rustc-env={}={}", key, value);
                }
            }
        }
    }
    
    // Fallback to placeholders to prevent local compilation failure if environment variables are not set
    if std::env::var("GOOGLE_CLIENT_ID").is_err() && !env_path.exists() {
        println!("cargo:rustc-env=GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID");
    }
    if std::env::var("GOOGLE_CLIENT_SECRET").is_err() && !env_path.exists() {
        println!("cargo:rustc-env=GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET");
    }

    tauri_build::build();
}
