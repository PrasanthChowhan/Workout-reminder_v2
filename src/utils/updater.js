import { isTauri, invoke } from "./tauri";

const SKIPPED_VERSION_KEY = "kodon_skipped_update_version";
const LAST_CHECK_KEY = "kodon_last_update_check_time";

/**
 * Checks if a specific update version has been marked as skipped by the user.
 * @param {string} version 
 * @returns {boolean}
 */
export function isVersionSkipped(version) {
  try {
    const skipped = localStorage.getItem(SKIPPED_VERSION_KEY);
    return skipped === version;
  } catch (e) {
    return false;
  }
}

/**
 * Sets a specific update version as skipped.
 * @param {string} version 
 */
export function skipVersion(version) {
  try {
    localStorage.setItem(SKIPPED_VERSION_KEY, version);
  } catch (e) {
    console.error("Failed to save skipped version to localStorage", e);
  }
}

/**
 * Relaunches the application to apply the staged update.
 * @returns {Promise<void>}
 */
export async function relaunchApp() {
  if (isTauri) {
    await invoke("relaunch_app");
  } else {
    console.log("[Browser Mock] Relaunching application...");
    window.location.reload();
  }
}

/**
 * Checks if 24 hours have passed since the last background update check.
 * @returns {boolean}
 */
function shouldRunBackgroundCheck() {
  try {
    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
    if (!lastCheck) return true;
    const lastCheckTime = parseInt(lastCheck, 10);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return now - lastCheckTime >= twentyFourHours;
  } catch (e) {
    return true;
  }
}

/**
 * Records the timestamp of the current update check.
 */
function recordCheckTime() {
  try {
    localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
  } catch (e) {}
}

/**
 * Checks for updates using Tauri's updater plugin.
 * Handles mock data and errors gracefully.
 * 
 * @param {boolean} [manual=false] If true, bypasses background-check rate limits and version skipping checks.
 * @returns {Promise<{ available: boolean, version: string, date: string, body: string, updateObj: any }|null>}
 */
export async function checkForUpdates(manual = false) {
  if (!isTauri) {
    // Browser environment: simulate finding an update for testing purposes if manual is true
    if (manual) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return {
        available: true,
        version: "0.2.0",
        date: "2026-08-14",
        body: "* Faster reminder scheduling\n* Daily accountability check-in\n* Bug fixes",
        updateObj: {
          downloadAndInstall: async (onProgress) => {
            console.log("Mock downloading update...");
            onProgress({ event: "Started", data: { contentLength: 20000000 } });
            for (let i = 1; i <= 10; i++) {
              await new Promise(resolve => setTimeout(resolve, 200));
              onProgress({ event: "Progress", data: { chunkLength: 2000000 } });
            }
            onProgress({ event: "Finished" });
            console.log("Mock update installed successfully");
          }
        }
      };
    }
    return null;
  }

  try {
    // Only rate-limit background checks
    if (!manual && !shouldRunBackgroundCheck()) {
      return null;
    }

    const { check } = await import("@tauri-apps/plugin-updater");
    const update = await check();
    recordCheckTime();

    if (update && update.available) {
      // If version is skipped and this is an automatic background check, ignore it
      if (!manual && isVersionSkipped(update.version)) {
        return null;
      }

      return {
        available: true,
        version: update.version,
        date: update.date,
        body: update.body || "",
        updateObj: update
      };
    }

    return { available: false };
  } catch (err) {
    console.error("Error during check for updates:", err);
    if (manual) {
      throw err;
    }
    return null;
  }
}
