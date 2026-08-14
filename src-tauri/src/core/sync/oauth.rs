use keyring::Entry;
use rand::RngExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use tokio::net::TcpListener;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use base64::Engine as _;

pub const GOOGLE_CLIENT_ID: &str = env!("GOOGLE_CLIENT_ID");
pub const GOOGLE_CLIENT_SECRET: &str = env!("GOOGLE_CLIENT_SECRET");

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoogleUser {
    pub email: String,
    pub name: Option<String>,
}

#[derive(Deserialize)]
struct TokenResponse {
    access_token: String,
    refresh_token: Option<String>,
}

#[derive(Deserialize)]
struct UserInfoResponse {
    email: String,
    name: Option<String>,
}

const SERVICE_NAME: &str = "kodon-workout-reminder";
const ACCOUNT_NAME: &str = "google-oauth-refresh-token";

pub fn save_refresh_token(token: &str) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, ACCOUNT_NAME).map_err(|e| e.to_string())?;
    entry.set_password(token).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_refresh_token() -> Result<String, String> {
    let entry = Entry::new(SERVICE_NAME, ACCOUNT_NAME).map_err(|e| e.to_string())?;
    entry.get_password().map_err(|e| e.to_string())
}

pub fn delete_refresh_token() -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, ACCOUNT_NAME).map_err(|e| e.to_string())?;
    let _ = entry.delete_password(); // Ignore errors if not exists
    Ok(())
}

fn generate_verifier() -> String {
    let mut rng = rand::rng();
    (0..64)
        .map(|_| {
            const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
            let idx = rng.random_range(0..CHARS.len());
            CHARS[idx] as char
        })
        .collect()
}

fn generate_challenge(verifier: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(verifier.as_bytes());
    base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(hasher.finalize())
}

pub async fn start_oauth_flow(app: &tauri::AppHandle) -> Result<(String, String, GoogleUser), String> {
    let verifier = generate_verifier();
    let challenge = generate_challenge(&verifier);
    let state: String = rand::rng().random::<u32>().to_string();

    let listener = TcpListener::bind("127.0.0.1:0").await.map_err(|e| e.to_string())?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    let redirect_uri = format!("http://127.0.0.1:{}", port);

    // Form the auth URL
    let auth_url = format!(
        "https://accounts.google.com/o/oauth2/v2/auth?\
        client_id={}&\
        redirect_uri={}&\
        response_type=code&\
        scope=https://www.googleapis.com/auth/drive.appdata%20email%20profile&\
        code_challenge={}&\
        code_challenge_method=S256&\
        state={}&\
        access_type=offline&\
        prompt=consent",
        GOOGLE_CLIENT_ID,
        url::form_urlencoded::byte_serialize(redirect_uri.as_bytes()).collect::<String>(),
        challenge,
        state
    );

    // Open system browser using tauri open_url
    use tauri_plugin_opener::OpenerExt;
    app.opener().open_url(&auth_url, None::<&str>).map_err(|e| e.to_string())?;

    // Wait for redirect connection (up to 2 minutes)
    let (mut stream, _) = tokio::time::timeout(
        std::time::Duration::from_secs(120),
        listener.accept()
    )
    .await
    .map_err(|_| "OAuth authentication timed out. Please try again.".to_string())?
    .map_err(|e| e.to_string())?;

    let mut buffer = [0; 4096];
    let n = stream.read(&mut buffer).await.map_err(|e| e.to_string())?;
    let request_str = String::from_utf8_lossy(&buffer[..n]);

    let (code, received_state) = parse_callback_request(&request_str)
        .ok_or_else(|| "Failed to parse OAuth response from browser.".to_string())?;

    if received_state != state {
        return Err("OAuth state mismatch. Security verification failed.".to_string());
    }

    // Send HTTP success page
    let html_content = r#"
    <html>
    <head>
        <title>Authentication Successful</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; text-align: center; padding-top: 60px; background-color: #121212; color: #e0e0e0; }
            .container { max-width: 500px; margin: auto; padding: 40px; border-radius: 12px; background-color: #1e1e1e; box-shadow: 0 4px 12px rgba(0,0,0,0.4); border: 1px solid #333; }
            h1 { color: #4CAF50; font-weight: 600; margin-bottom: 16px; }
            p { font-size: 16px; line-height: 1.5; color: #a0a0a0; }
            .success-icon { font-size: 48px; color: #4CAF50; margin-bottom: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="success-icon">✓</div>
            <h1>Authorized Successfully</h1>
            <p>Kodon has been granted access. You can now close this tab and return to the application.</p>
        </div>
    </body>
    </html>
    "#;

    let http_response = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        html_content.len(),
        html_content
    );
    stream.write_all(http_response.as_bytes()).await.map_err(|e| e.to_string())?;
    stream.flush().await.map_err(|e| e.to_string())?;

    // Trade code for token
    let client = Client::new();
    let token_res = client.post("https://oauth2.googleapis.com/token")
        .form(&[
            ("client_id", GOOGLE_CLIENT_ID),
            ("client_secret", GOOGLE_CLIENT_SECRET),
            ("code", &code),
            ("code_verifier", &verifier),
            ("grant_type", "authorization_code"),
            ("redirect_uri", &redirect_uri),
        ])
        .send()
        .await
        .map_err(|e| format!("Failed to request token from Google: {}", e))?;

    if !token_res.status().is_success() {
        let err_text = token_res.text().await.unwrap_or_default();
        return Err(format!("Google token exchange failed: {}", err_text));
    }

    let tokens: TokenResponse = token_res.json().await
        .map_err(|e| format!("Failed to decode token JSON: {}", e))?;

    let refresh_token = tokens.refresh_token.ok_or_else(|| "No refresh token returned by Google OAuth.".to_string())?;

    // Fetch user info
    let user_info = get_user_info(&tokens.access_token).await?;

    Ok((tokens.access_token, refresh_token, user_info))
}

pub async fn refresh_access_token(refresh_token: &str) -> Result<String, String> {
    let client = Client::new();
    let res = client.post("https://oauth2.googleapis.com/token")
        .form(&[
            ("client_id", GOOGLE_CLIENT_ID),
            ("client_secret", GOOGLE_CLIENT_SECRET),
            ("refresh_token", refresh_token),
            ("grant_type", "refresh_token"),
        ])
        .send()
        .await
        .map_err(|e| format!("Failed to refresh token: {}", e))?;

    if !res.status().is_success() {
        let err_text = res.text().await.unwrap_or_default();
        return Err(format!("Google refresh token request failed: {}", err_text));
    }

    let tokens: TokenResponse = res.json().await
        .map_err(|e| format!("Failed to decode refresh token JSON: {}", e))?;

    Ok(tokens.access_token)
}

pub async fn get_user_info(access_token: &str) -> Result<GoogleUser, String> {
    let client = Client::new();
    let res = client.get("https://www.googleapis.com/oauth2/v2/userinfo")
        .bearer_auth(access_token)
        .send()
        .await
        .map_err(|e| format!("Failed to request user info: {}", e))?;

    if !res.status().is_success() {
        return Err("Failed to retrieve Google user profile info.".to_string());
    }

    let info: UserInfoResponse = res.json().await
        .map_err(|e| format!("Failed to parse user info JSON: {}", e))?;

    Ok(GoogleUser {
        email: info.email,
        name: info.name,
    })
}

fn parse_callback_request(req: &str) -> Option<(String, String)> {
    let line = req.lines().next()?;
    let parts: Vec<&str> = line.split_whitespace().collect();
    if parts.len() < 2 || parts[0] != "GET" {
        return None;
    }
    let url = parts[1];
    let query_start = url.find('?')?;
    let query_str = &url[query_start + 1..];

    let mut code = None;
    let mut state = None;

    for pair in query_str.split('&') {
        let mut kv = pair.split('=');
        if let (Some(k), Some(v)) = (kv.next(), kv.next()) {
            if k == "code" {
                code = Some(v.to_string());
            } else if k == "state" {
                state = Some(v.to_string());
            }
        }
    }

    match (code, state) {
        (Some(c), Some(s)) => Some((c, s)),
        _ => None,
    }
}
