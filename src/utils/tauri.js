import mockData from "./mockData.json";

// Safe check if we are running inside Tauri or a regular browser
export const isTauri = typeof window !== "undefined" && !!window.__TAURI__;

/**
 * Wraps Tauri core invoke API. Fallback to console logs/mock responses in standard browsers.
 * @param {string} cmd 
 * @param {object} [args] 
 * @returns {Promise<any>}
 */
export async function invoke(cmd, args) {
  if (isTauri) {
    try {
      return await window.__TAURI__.core.invoke(cmd, args);
    } catch (error) {
      console.error(`Tauri invoke error for command '${cmd}':`, error);
      throw error;
    }
  }

  console.log(`[Browser Mock IPC] invoke: ${cmd}`, args);

  // Return realistic mock data to facilitate browser debugging
  if (cmd === "get_app_config") {
    return mockData.app_config;
  }

  if (cmd === "get_session_data") {
    return mockData.session_data;
  }

  return {};
}


/**
 * Wraps Tauri event listen API. Fallback to logs in browser.
 * @param {string} eventName 
 * @param {function} callback 
 * @returns {Promise<function>} Unlisten function promise
 */
export function listen(eventName, callback) {
  if (isTauri) {
    return window.__TAURI__.event.listen(eventName, callback);
  }
  
  console.log(`[Browser Mock IPC] listen registered for: ${eventName}`);
  return Promise.resolve(() => {
    console.log(`[Browser Mock IPC] unlisten for: ${eventName}`);
  });
}

/**
 * Custom listener wrapper that handles async lifecycle cancellation safely.
 * Returns an unlisten function that cleanups event listener subscription.
 * @param {string} eventName 
 * @param {function} callback 
 * @returns {function} Unlisten function
 */
export function registerListener(eventName, callback) {
  let active = true;
  let unlistenFn = null;
  
  const sub = listen(eventName, (event) => {
    if (active) callback(event);
  });
  
  sub.then((fn) => {
    if (!active) {
      fn();
    } else {
      unlistenFn = fn;
    }
  });
  
  return () => {
    active = false;
    if (unlistenFn) unlistenFn();
  };
}

/**
 * Safely opens a URL inside browser or via Tauri Opener plugin.
 * @param {string} url 
 * @returns {Promise<any>}
 */
export function openUrl(url) {
  if (!url || url === "N/A") return Promise.resolve();

  if (isTauri) {
    return invoke("open_external_url", { url }).catch((err) => {
      console.error(`Failed to open URL '${url}' via Tauri:`, err);
    });
  } else {
    console.log(`[Browser Mock IPC] openUrl: ${url}`);
    window.open(url, "_blank");
    return Promise.resolve();
  }
}


