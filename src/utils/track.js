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

/**
 * Transforms an exercise array into a schema-compliant Levels array based on a tier.
 * @param {Array} exercises 
 * @param {string} onboardingTier 
 * @returns {Array}
 */
export const generateLevelsFromExercises = (exercises, onboardingTier) => {
  if (!exercises) return [];
  const filtered = exercises.filter(
    (ex) => ex.difficulty.toLowerCase() === onboardingTier.toLowerCase()
  );

  return filtered.map((ex, index) => {
    const repsStr = ex.reps 
      ? ex.reps 
      : (ex.reps_min && ex.reps_max) 
        ? `${ex.reps_min}-${ex.reps_max} Reps` 
        : ex.reps_min 
          ? `${ex.reps_min} Reps` 
          : `${ex.duration_secs}s Hold`;

    return {
      level_number: index + 1,
      title: ex.name,
      description: `${ex.description}\n\n• Category: ${ex.category}\n• Target: ${(ex.target_muscles || ex.muscle_groups || []).join(", ")}\n• Side: ${ex.is_unilateral ? "Unilateral (Perform per side)" : "Bilateral"}\n• Equipment: ${(ex.equipment && ex.equipment.length > 0) ? ex.equipment.join(", ") : "None"}\n• Rest: ${ex.rest_secs ? ex.rest_secs + 's' : "None"}\n• Instructions: ${repsStr} (${ex.sets} Sets)`,
      target_duration_secs: ex.duration_secs,
      video_url: ex.video_url || ex.url || ex.video_link || null,
      image_url: ex.image_url || null,
      is_unilateral: ex.is_unilateral || false,
      equipment: ex.equipment || [],
      rest_secs: ex.rest_secs || 0,
      reps: repsStr,
      sets: ex.sets || 3
    };
  });
};

/**
 * Resolves current active level progress updates when toggling exercise exclusion status.
 */
export const resolveLevelProgressOnToggle = (
  isActive,
  displayLevels,
  currentLevelNumber,
  exerciseTitle,
  currentExcluded,
  updatedExcluded
) => {
  if (!isActive) return null;

  const activeLevel = displayLevels.find(l => l.level_number === currentLevelNumber);
  if (activeLevel && activeLevel.title === exerciseTitle && !currentExcluded.includes(exerciseTitle)) {
    let resolvedLevelNum = null;
    for (let num = currentLevelNumber; num <= displayLevels.length; num++) {
      const lvl = displayLevels.find(l => l.level_number === num);
      if (lvl && lvl.title !== exerciseTitle && !updatedExcluded.includes(lvl.title)) {
        resolvedLevelNum = num;
        break;
      }
    }
    if (!resolvedLevelNum) {
      for (let num = currentLevelNumber - 1; num >= 1; num--) {
        const lvl = displayLevels.find(l => l.level_number === num);
        if (lvl && lvl.title !== exerciseTitle && !updatedExcluded.includes(lvl.title)) {
          resolvedLevelNum = num;
          break;
        }
      }
    }
    return {
      current_level_number: resolvedLevelNum,
      completed_sessions_count: 0
    };
  } else if (currentLevelNumber === null) {
    if (currentExcluded.includes(exerciseTitle)) {
      const lvl = displayLevels.find(l => l.title === exerciseTitle);
      if (lvl) {
        return {
          current_level_number: lvl.level_number,
          completed_sessions_count: 0
        };
      }
    }
  }
  return null;
};

