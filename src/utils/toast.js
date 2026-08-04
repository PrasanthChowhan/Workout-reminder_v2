/**
 * Lightweight, dependency-free application toast event dispatcher.
 * Raises custom 'app-toast' events handled by the root App shell.
 */

export function showToast(message, type = "success") {
  window.dispatchEvent(
    new CustomEvent("app-toast", {
      detail: { message, type },
    })
  );
}

export const toast = {
  success: (message) => showToast(message, "success"),
  error: (message) => showToast(message, "error"),
  info: (message) => showToast(message, "info"),
};
