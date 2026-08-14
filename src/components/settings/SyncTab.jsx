import React, { useState, useEffect } from "react";
import { invoke } from "../../utils/tauri";
import { toast } from "../../utils/toast";
import styles from "./SyncTab.module.css";

export default function SyncTab() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState({
    isLoggedIn: false,
    email: null,
    deviceId: "",
    lastSyncTime: null,
  });
  const [conflict, setConflict] = useState(null);

  const fetchStatus = async () => {
    try {
      const res = await invoke("get_sync_status");
      setStatus({
        isLoggedIn: res.isLoggedIn,
        email: res.email,
        deviceId: res.deviceId,
        lastSyncTime: res.lastSyncTime,
      });
    } catch (e) {
      console.error("Failed to fetch sync status:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      toast.info("Opening system browser to authenticate with Google...");
      const res = await invoke("login_google");
      
      if (res.type === "Success") {
        toast.success("Google Account successfully connected!");
        setConflict(null);
      } else if (res.type === "Conflict") {
        setConflict(res);
        toast.warning("Sync conflict detected. Please select which data version to keep.");
      } else if (res.type === "NoChange") {
        toast.success("Sync connected. Cloud and local data are identical.");
      }
      
      await fetchStatus();
    } catch (e) {
      toast.error(`Authentication failed: ${e}`);
      console.error(e);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to disconnect your Google Account? Local data will not be affected.")) {
      return;
    }
    setLoading(true);
    try {
      await invoke("logout_google");
      toast.success("Google Account disconnected successfully.");
      setConflict(null);
      await fetchStatus();
    } catch (e) {
      toast.error(`Failed to disconnect: ${e}`);
      setLoading(false);
    }
  };

  const handleSyncNow = async (forceChoice = null) => {
    setSyncing(true);
    try {
      toast.info("Synchronizing data with Google Drive...");
      const res = await invoke("sync_now", { forceChoice });

      if (res.type === "Success") {
        toast.success("Data synchronization completed successfully!");
        setConflict(null);
        
        // If force choice was remote, the backend triggered app restart, but in case it hasn't finished yet:
        if (forceChoice === "remote") {
          toast.info("Database replaced. Reloading application...");
          setTimeout(() => {
            invoke("relaunch_app");
          }, 1500);
        }
      } else if (res.type === "Conflict") {
        setConflict(res);
        toast.warning("Diverged sync history. Please select which version to preserve.");
      } else if (res.type === "NoChange") {
        toast.success("Synchronization complete: already up to date.");
        setConflict(null);
      }
      
      await fetchStatus();
    } catch (e) {
      toast.error(`Synchronization failed: ${e}`);
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return "Never";
    try {
      const date = new Date(isoString);
      return date.toLocaleString();
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles["intro-desc"]}>Loading synchronization settings...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles["intro-section"]}>
        <h3 className={styles["intro-title"]}>Google Drive Cloud Synchronization</h3>
        <p className={styles["intro-desc"]}>
          Keep your workout configurations, flashcards, settings, and progress logs securely backed up to your personal Google Drive <code>appDataFolder</code>.
          This folder is isolated and completely invisible to other applications, preventing accidental deletion.
        </p>
      </div>

      {!status.isLoggedIn ? (
        <div className={styles["status-card"]}>
          <p className={styles["intro-desc"]}>
            Authorize Kodon to back up and restore your configurations. Log in with your Google Account using your system browser.
          </p>
          <button 
            type="button" 
            className={styles["connect-btn"]} 
            onClick={handleLogin}
          >
            <svg fill="currentColor" height={16} viewBox="0 0 24 24" width={16} xmlns="http://www.w3.org/2000/svg">
              <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.65 4.5 1.8l2.4-2.4C17.3 1.8 14.9 1 12.24 1 6.58 1 2 5.58 2 11.24s4.58 10.24 10.24 10.24c5.9 0 9.8-4.15 9.8-10 0-.6-.05-1.2-.16-1.76H12.24z"/>
            </svg>
            Connect Google Account
          </button>
        </div>
      ) : (
        <>
          {conflict ? (
            <div className={styles["conflict-card"]}>
              <h4 className={styles["conflict-title"]}>
                ⚠️ Sync Conflict Detected
              </h4>
              <p className={styles["conflict-desc"]}>
                Sync histories have diverged. Changes were made both locally and on Google Drive since the last synchronization.
                Please choose which version to preserve:
              </p>

              <div className={styles["conflict-choices"]}>
                <div 
                  className={styles["choice-box"]} 
                  onClick={() => handleSyncNow("local")}
                >
                  <span className={styles["choice-title"]}>Keep Local Data</span>
                  <span className={styles["choice-meta"]}>
                    Overwrite the cloud backup with your current local configurations.
                  </span>
                  <button 
                    type="button" 
                    className={`${styles["choice-btn"]} ${styles.primary}`}
                    disabled={syncing}
                  >
                    Upload Local Version
                  </button>
                </div>

                <div 
                  className={styles["choice-box"]} 
                  onClick={() => handleSyncNow("remote")}
                >
                  <span className={styles["choice-title"]}>Keep Cloud Data</span>
                  <span className={styles["choice-meta"]}>
                    Replace your local database with the cloud backup and restart the app.
                  </span>
                  <button 
                    type="button" 
                    className={`${styles["choice-btn"]} ${styles.secondary}`}
                    disabled={syncing}
                  >
                    Restore Cloud Version
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles["status-card"]}>
              <div className={styles["status-header"]}>
                <span className={styles["status-label"]}>Status</span>
                <span className={`${styles["status-badge"]} ${syncing ? styles.syncing : styles.connected}`}>
                  {syncing ? "Syncing..." : "Connected"}
                </span>
              </div>

              <div className={styles["status-info-row"]}>
                <span className={styles["info-name"]}>Google Account:</span>
                <span className={styles["info-value"]}>{status.email || "Unknown"}</span>
              </div>

              <div className={styles["status-info-row"]}>
                <span className={styles["info-name"]}>Device ID:</span>
                <span className={styles["info-value"]} style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                  {status.deviceId}
                </span>
              </div>

              <div className={styles["status-info-row"]}>
                <span className={styles["info-name"]}>Last Sync Time:</span>
                <span className={styles["info-value"]}>{formatTime(status.lastSyncTime)}</span>
              </div>

              <div className={styles["actions-section"]}>
                <button 
                  type="button" 
                  className={styles["sync-btn"]} 
                  onClick={() => handleSyncNow()}
                  disabled={syncing}
                >
                  {syncing ? "Synchronizing..." : "Sync Now"}
                </button>
                <button 
                  type="button" 
                  className={styles["disconnect-btn"]} 
                  onClick={handleLogout}
                  disabled={syncing}
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
