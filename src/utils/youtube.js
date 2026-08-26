/**
 * Extracts the YouTube 11-character video ID from various YouTube URL formats.
 * @param {string} url - YouTube URL
 * @returns {string|null} - 11-character video ID or null
 */
export function getYoutubeId(url) {
  if (!url) return null;
  const regExp = /(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*)/;
  const match = url.match(regExp);
  return (match && match[1].length === 11) ? match[1] : null;
}

/**
 * Extracts the start timestamp (seconds or formats like 1m30s) from a YouTube URL.
 * @param {string} url - YouTube URL
 * @returns {number|null} - start time in seconds or null
 */
export function getYoutubeStart(url) {
  if (!url) return null;
  const match = url.match(/(?:[?&])(?:t|start)=([^&#?]*)/);
  if (!match) return null;

  const val = match[1];

  // If it's a simple number (possibly with an 's' suffix, e.g. "45s")
  if (/^\d+s?$/.test(val)) {
    return parseInt(val, 10);
  }

  // Handle h/m/s formatted times (e.g. "1m30s")
  let seconds = 0;
  const timeRegex = /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/;
  const timeMatch = val.match(timeRegex);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1] || "0", 10);
    const minutes = parseInt(timeMatch[2] || "0", 10);
    const secs = parseInt(timeMatch[3] || "0", 10);
    seconds = hours * 3600 + minutes * 60 + secs;
  }

  return seconds > 0 ? seconds : null;
}
