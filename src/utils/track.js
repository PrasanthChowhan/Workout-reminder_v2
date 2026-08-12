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
    const validCategories = [
      "Mobility", "Strength", "Power", "Core", "Skill", "Stability",
      "Neural Dynamics", "Static Stretch", "Dynamic Stretch", "Active Stretch", "PNF Stretch",
      "Static / Active Stretch", "Eccentric / Dynamic Mobility", "Static / PNF Stretch",
      "End-Range Static Stretch", "Passive Static Stretch"
    ];
    const allowedExerciseKeys = [
      "id", "name", "description", "execution_notes", "category", "muscle_groups",
      "difficulty", "equipment", "duration_secs", "sets", "reps_min", "reps_max",
      "is_unilateral", "rest_secs", "video_url", "image_url"
    ];

    for (let i = 0; i < track.exercises.length; i++) {
      const ex = track.exercises[i];
      if (!ex || typeof ex !== "object") {
        return `Exercise ${i + 1}: Must be an object.`;
      }
      
      // Check for hallucinated / additional properties
      const extraKeys = Object.keys(ex).filter(key => !allowedExerciseKeys.includes(key));
      if (extraKeys.length > 0) {
        return `Exercise ${i + 1}: Found invalid additional properties: ${extraKeys.join(", ")}.`;
      }

      if (typeof ex.id !== "string" || !ex.id.trim()) {
        return `Exercise ${i + 1}: Missing or invalid 'id'.`;
      }
      if (typeof ex.name !== "string" || !ex.name.trim()) {
        return `Exercise ${i + 1}: Missing or invalid 'name'.`;
      }
      if (typeof ex.description !== "string" || !ex.description.trim()) {
        return `Exercise ${i + 1}: Missing or invalid 'description'.`;
      }
      if (typeof ex.execution_notes !== "string" || !ex.execution_notes.trim()) {
        return `Exercise ${i + 1}: Missing or invalid 'execution_notes'.`;
      }
      if (typeof ex.category !== "string" || !validCategories.includes(ex.category)) {
        return `Exercise ${i + 1}: Missing or invalid 'category' (must be one of: ${validCategories.join(", ")}).`;
      }
      if (!Array.isArray(ex.muscle_groups) || ex.muscle_groups.length === 0) {
        return `Exercise ${i + 1}: Missing or invalid 'muscle_groups' (must be a non-empty array of strings).`;
      }
      if (typeof ex.difficulty !== "string" || !["Beginner", "Intermediate", "Advanced", "Expert"].includes(ex.difficulty)) {
        return `Exercise ${i + 1}: Missing or invalid 'difficulty' (must be Beginner, Intermediate, Advanced, or Expert).`;
      }
      if (!Array.isArray(ex.equipment)) {
        return `Exercise ${i + 1}: Missing or invalid 'equipment' (must be an array of strings).`;
      }
      if (typeof ex.duration_secs !== "number" || isNaN(ex.duration_secs) || ex.duration_secs < 0) {
        return `Exercise ${i + 1}: Missing or invalid 'duration_secs' (must be a non-negative number).`;
      }
      if (typeof ex.sets !== "number" || isNaN(ex.sets) || ex.sets < 1) {
        return `Exercise ${i + 1}: Missing or invalid 'sets' (must be a number >= 1).`;
      }
      if (ex.reps_min !== null && (typeof ex.reps_min !== "number" || isNaN(ex.reps_min) || ex.reps_min < 1)) {
        return `Exercise ${i + 1}: 'reps_min' must be a positive integer or null.`;
      }
      if (ex.reps_max !== null && (typeof ex.reps_max !== "number" || isNaN(ex.reps_max) || ex.reps_max < 1)) {
        return `Exercise ${i + 1}: 'reps_max' must be a positive integer or null.`;
      }
      if (typeof ex.is_unilateral !== "boolean") {
        return `Exercise ${i + 1}: 'is_unilateral' must be a boolean.`;
      }
      if (typeof ex.rest_secs !== "number" || isNaN(ex.rest_secs) || ex.rest_secs < 0) {
        return `Exercise ${i + 1}: 'rest_secs' must be a non-negative number.`;
      }
      if (ex.video_url !== null && (typeof ex.video_url !== "string" || !ex.video_url.startsWith("http"))) {
        return `Exercise ${i + 1}: 'video_url' must be a valid URL string or null.`;
      }
      if (ex.image_url !== null && typeof ex.image_url !== "string") {
        return `Exercise ${i + 1}: 'image_url' must be a string or null.`;
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

    const levelsMap = new Map();
    for (let i = 0; i < displayLevels.length; i++) {
      levelsMap.set(displayLevels[i].level_number, displayLevels[i]);
    }
    const updatedExcludedSet = new Set(updatedExcluded);

    for (let num = currentLevelNumber; num <= displayLevels.length; num++) {
      const lvl = levelsMap.get(num);
      if (lvl && lvl.title !== exerciseTitle && !updatedExcludedSet.has(lvl.title)) {
        resolvedLevelNum = num;
        break;
      }
    }
    if (!resolvedLevelNum) {
      for (let num = currentLevelNumber - 1; num >= 1; num--) {
        const lvl = levelsMap.get(num);
        if (lvl && lvl.title !== exerciseTitle && !updatedExcludedSet.has(lvl.title)) {
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

