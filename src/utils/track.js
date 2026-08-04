/**
 * Validates a progression track object structure.
 * Returns null if valid, or a string describing the error if invalid.
 * @param {object} track 
 * @returns {string|null}
 */
export const validateTrack = (track) => {
  if (!track || typeof track !== "object") {
    return "Invalid track object: Empty or not a valid JSON structure.";
  }
  
  if (Object.keys(track).length === 0) {
    return "Invalid track object: The uploaded file contains an empty JSON object.";
  }

  if (typeof track.id !== "string" || !track.id.trim()) {
    return "Missing or invalid 'id' parameter. Must be a non-empty string.";
  }
  if (typeof track.name !== "string" || !track.name.trim()) {
    return "Missing or invalid 'name' parameter. Must be a non-empty string.";
  }
  if (typeof track.description !== "string" || !track.description.trim()) {
    return "Missing or invalid 'description' parameter. Must be a non-empty string.";
  }
  
  if (Array.isArray(track.exercises)) {
    for (let i = 0; i < track.exercises.length; i++) {
      const ex = track.exercises[i];
      if (!ex || typeof ex !== "object") {
        return `Exercise ${i + 1}: Must be an object.`;
      }
      if (typeof ex.name !== "string" || !ex.name.trim()) {
        return `Exercise ${i + 1}: Missing or invalid 'name'.`;
      }
      if (typeof ex.description !== "string" || !ex.description.trim()) {
        return `Exercise ${i + 1}: Missing or invalid 'description'.`;
      }
      if (typeof ex.difficulty !== "string" || !ex.difficulty.trim()) {
        return `Exercise ${i + 1}: Missing or invalid 'difficulty'.`;
      }
      if (typeof ex.duration_secs !== "number" || isNaN(ex.duration_secs) || ex.duration_secs < 0) {
        return `Exercise ${i + 1}: Missing or invalid 'duration_secs' (must be a non-negative number).`;
      }
    }
  } else if (Array.isArray(track.levels)) {
    for (let i = 0; i < track.levels.length; i++) {
      const lvl = track.levels[i];
      if (!lvl || typeof lvl !== "object") {
        return `Level ${i + 1}: Must be an object.`;
      }
      if (typeof lvl.level_number !== "number" || isNaN(lvl.level_number)) {
        return `Level ${i + 1}: Missing or invalid 'level_number'.`;
      }
      if (typeof lvl.title !== "string" || !lvl.title.trim()) {
        return `Level ${i + 1}: Missing or invalid 'title'.`;
      }
      if (typeof lvl.description !== "string" || !lvl.description.trim()) {
        return `Level ${i + 1}: Missing or invalid 'description'.`;
      }
      if (typeof lvl.target_duration_secs !== "number" || isNaN(lvl.target_duration_secs) || lvl.target_duration_secs <= 0) {
        return `Level ${i + 1}: Missing or invalid 'target_duration_secs' (must be a positive number).`;
      }
    }
  } else {
    return "Track schema error: Must contain either an 'exercises' array (new schema) or a 'levels' array (old schema).";
  }
  return null;
};
