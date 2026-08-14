import React, { useState, useEffect } from "react";
import { checkForUpdates, skipVersion, relaunchApp } from "../../utils/updater";
import { isTauri } from "../../utils/tauri";

export default function UpdateTab({ parentStyles }) {
  const [status, setStatus] = useState("idle");
  const [currentVersion, setCurrentVersion] = useState("0.1.0");
  const [updateInfo, setUpdateInfo] = useState(null);
  const [progress, setProgress] = useState({ percentage: 0, downloaded: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadVersion() {
      if (isTauri) {
        try {
          const { getVersion } = await import("@tauri-apps/api/app");
          const version = await getVersion();
          setCurrentVersion(version);
        } catch (e) {
          console.error("Failed to load app version", e);
        }
      }
    }
    loadVersion();
  }, []);

  const handleCheck = async () => {
    setStatus("checking");
    setErrorMsg("");
    try {
      const result = await checkForUpdates(true);
      if (result && result.available) {
        setUpdateInfo(result);
        setStatus("available");
      } else {
        setStatus("up-to-date");
      }
    } catch (err) {
      console.error("Check update error:", err);
      setErrorMsg("Failed to check for updates. Please check your internet connection.");
      setStatus("error");
    }
  };

  const handleDownload = async () => {
    if (!updateInfo || !updateInfo.updateObj) return;
    setStatus("downloading");
    setProgress({ percentage: 0, downloaded: 0, total: 0 });
    
    try {
      let totalSize = 0;
      let downloadedSize = 0;

      await updateInfo.updateObj.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            totalSize = event.data.contentLength || 0;
            setProgress(p => ({ ...p, total: totalSize }));
            break;
          case "Progress":
            downloadedSize += event.data.chunkLength;
            const percentage = totalSize > 0 ? Math.round((downloadedSize / totalSize) * 100) : 0;
            setProgress({
              percentage,
              downloaded: downloadedSize,
              total: totalSize
            });
            break;
          case "Finished":
            setStatus("ready-to-restart");
            break;
          default:
            break;
        }
      });
    } catch (err) {
      console.error("Download/Install error:", err);
      setErrorMsg("An error occurred during download or installation. " + err.toString());
      setStatus("error");
    }
  };

  const handleSkip = () => {
    if (updateInfo) {
      skipVersion(updateInfo.version);
    }
    setStatus("idle");
    setUpdateInfo(null);
  };

  const formatSize = (bytes) => {
    if (!bytes) return "0 B";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className={parentStyles['tab-pane']}>
      <div className={parentStyles['settings-group']}>
        <h3 className={parentStyles['settings-group-title']}>Software Updates</h3>
        <p className={parentStyles['settings-item-desc']} style={{ marginBottom: "1rem" }}>
          Keep Kodon secure and up-to-date with the latest physical tracks, cognitive features, and performance enhancements.
        </p>

        <div style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: "8px",
          padding: "1.25rem",
          maxWidth: "500px",
          marginTop: "1rem"
        }}>
          {status === "idle" && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--color-off-white)" }}>
                  Current Version
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                  v{currentVersion}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCheck}
                style={{
                  background: "var(--color-brand-orange)",
                  color: "#000",
                  border: "none",
                  borderRadius: "20px",
                  padding: "0.5rem 1.25rem",
                  fontSize: "0.8rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "opacity 0.2s ease"
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
                onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
              >
                Check for Updates
              </button>
            </div>
          )}

          {status === "checking" && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div className="spinner" style={{
                width: "16px",
                height: "16px",
                border: "2px solid rgba(255, 255, 255, 0.1)",
                borderTopColor: "var(--color-brand-orange)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite"
              }} />
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
              <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                Checking GitHub Releases...
              </span>
            </div>
          )}

          {status === "up-to-date" && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--color-off-white)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-orange)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  App is up-to-date
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                  You are running the latest version (v{currentVersion}).
                </div>
              </div>
              <button
                type="button"
                onClick={handleCheck}
                style={{
                  background: "transparent",
                  color: "var(--color-text-muted)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "20px",
                  padding: "0.5rem 1.25rem",
                  fontSize: "0.8rem",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                Check Again
              </button>
            </div>
          )}

          {status === "available" && updateInfo && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "0.75rem", marginBottom: "0.75rem" }}>
                <div>
                  <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--color-off-white)" }}>
                    Update Available
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.15rem" }}>
                    Version v{updateInfo.version} is ready to download.
                  </div>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  Current: v{currentVersion}
                </div>
              </div>

              {updateInfo.body && (
                <div style={{ marginBottom: "1.25rem" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--color-brand-orange)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
                    Release Notes:
                  </div>
                  <pre style={{
                    fontSize: "0.8rem",
                    fontFamily: "var(--font-sans)",
                    color: "var(--color-text-muted)",
                    background: "rgba(0, 0, 0, 0.2)",
                    padding: "0.75rem",
                    borderRadius: "6px",
                    overflowX: "auto",
                    whiteSpace: "pre-wrap",
                    margin: 0,
                    lineHeight: "1.4"
                  }}>
                    {updateInfo.body}
                  </pre>
                </div>
              )}

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={handleDownload}
                  style={{
                    background: "var(--color-brand-orange)",
                    color: "#000",
                    border: "none",
                    borderRadius: "20px",
                    padding: "0.5rem 1.25rem",
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Download & Install
                </button>
                <button
                  type="button"
                  onClick={handleSkip}
                  style={{
                    background: "transparent",
                    color: "var(--color-text-muted)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "20px",
                    padding: "0.5rem 1.25rem",
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Skip This Version
                </button>
              </div>
            </div>
          )}

          {status === "downloading" && (
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--color-off-white)", marginBottom: "0.5rem" }}>
                Downloading Update... {progress.percentage}%
              </div>
              
              {/* Progress bar container */}
              <div style={{
                width: "100%",
                height: "6px",
                background: "rgba(255, 255, 255, 0.08)",
                borderRadius: "3px",
                overflow: "hidden",
                marginBottom: "0.5rem"
              }}>
                <div style={{
                  width: `${progress.percentage}%`,
                  height: "100%",
                  background: "var(--color-brand-orange)",
                  transition: "width 0.2s ease"
                }} />
              </div>

              {progress.total > 0 && (
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  {formatSize(progress.downloaded)} / {formatSize(progress.total)}
                </div>
              )}
            </div>
          )}

          {status === "ready-to-restart" && (
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--color-off-white)", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-orange)" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Update Staged Successfully
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "0 0 1.25rem 0", lineHeight: "1.4" }}>
                The update package has been downloaded and verified. Restart the application now to apply the changes.
              </p>
              <button
                type="button"
                onClick={relaunchApp}
                style={{
                  background: "var(--color-brand-orange)",
                  color: "#000",
                  border: "none",
                  borderRadius: "20px",
                  padding: "0.5rem 1.25rem",
                  fontSize: "0.8rem",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                Restart Now
              </button>
            </div>
          )}

          {status === "error" && (
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: "600", color: "#ff4d4d", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                Update Failed
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: "0 0 1rem 0", lineHeight: "1.4" }}>
                {errorMsg}
              </p>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={handleCheck}
                  style={{
                    background: "var(--color-brand-orange)",
                    color: "#000",
                    border: "none",
                    borderRadius: "20px",
                    padding: "0.5rem 1.25rem",
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Retry Check
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  style={{
                    background: "transparent",
                    color: "var(--color-text-muted)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "20px",
                    padding: "0.5rem 1.25rem",
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
