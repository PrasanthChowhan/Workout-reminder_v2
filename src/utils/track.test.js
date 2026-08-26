import { describe, it, expect } from 'vitest';
<<<<<<< HEAD
import { validateTrack, generateLevelsFromExercises } from './track';
=======
import { validateTrack, resolveLevelProgressOnToggle } from './track';
>>>>>>> main

describe('validateTrack', () => {
  const baseValidTrack = {
    id: "track-123",
    name: "Valid Track",
    description: "A valid test track",
  };

  const validExercise = {
    id: "ex-1",
    name: "Squat",
    description: "Squat description",
    execution_notes: "Keep back straight",
    category: "Strength",
    muscle_groups: ["Legs", "Glutes"],
    difficulty: "Beginner",
    equipment: ["None"],
    duration_secs: 60,
    sets: 3,
    reps_min: 10,
    reps_max: 12,
    is_unilateral: false,
    rest_secs: 30,
    video_url: "https://example.com/video",
    image_url: "https://example.com/image.jpg",
  };

  const validLevel = {
    level_number: 1,
    title: "Level 1",
    description: "First level",
    target_duration_secs: 120,
  };

  describe('Happy Paths', () => {
    it('returns null for a valid track with exercises', () => {
      const track = { ...baseValidTrack, exercises: [validExercise] };
      expect(validateTrack(track)).toBeNull();
    });

    it('returns null for a valid track with levels', () => {
      const track = { ...baseValidTrack, levels: [validLevel] };
      expect(validateTrack(track)).toBeNull();
    });
  });

  describe('Base Track Errors', () => {
    it('returns error for empty or non-object track', () => {
      expect(validateTrack(null)).toMatch(/Invalid track object: Empty or not a valid JSON structure./);
      expect(validateTrack(undefined)).toMatch(/Invalid track object: Empty or not a valid JSON structure./);
      expect(validateTrack("string")).toMatch(/Invalid track object: Empty or not a valid JSON structure./);
      expect(validateTrack(123)).toMatch(/Invalid track object: Empty or not a valid JSON structure./);
    });

    it('returns error for empty object', () => {
      expect(validateTrack({})).toMatch(/Invalid track object: The uploaded file contains an empty JSON object./);
    });

    it('returns error for missing or invalid id', () => {
      const track = { name: "Name", description: "Desc", exercises: [] };
      expect(validateTrack(track)).toMatch(/Missing or invalid 'id' parameter. Must be a non-empty string./);
      expect(validateTrack({ ...track, id: "" })).toMatch(/Missing or invalid 'id' parameter. Must be a non-empty string./);
      expect(validateTrack({ ...track, id: "   " })).toMatch(/Missing or invalid 'id' parameter. Must be a non-empty string./);
    });

    it('returns error for missing or invalid name', () => {
      const track = { id: "id", description: "Desc", exercises: [] };
      expect(validateTrack(track)).toMatch(/Missing or invalid 'name' parameter. Must be a non-empty string./);
      expect(validateTrack({ ...track, name: "" })).toMatch(/Missing or invalid 'name' parameter. Must be a non-empty string./);
    });

    it('returns error for missing or invalid description', () => {
      const track = { id: "id", name: "Name", exercises: [] };
      expect(validateTrack(track)).toMatch(/Missing or invalid 'description' parameter. Must be a non-empty string./);
      expect(validateTrack({ ...track, description: "" })).toMatch(/Missing or invalid 'description' parameter. Must be a non-empty string./);
    });

    it('returns schema error if neither exercises nor levels are arrays', () => {
      expect(validateTrack(baseValidTrack)).toMatch(/Track schema error: Must contain either an 'exercises' array \(new schema\) or a 'levels' array \(old schema\)./);
    });
  });

  describe('Exercise Validation Errors', () => {
    it('returns error if exercise is not an object', () => {
      const track = { ...baseValidTrack, exercises: [null] };
      expect(validateTrack(track)).toBe("Exercise 1: Must be an object.");
    });

    it('returns error for invalid additional properties', () => {
      const track = { ...baseValidTrack, exercises: [{ ...validExercise, extraProp: "invalid" }] };
      expect(validateTrack(track)).toMatch(/Exercise 1: Found invalid additional properties: extraProp./);
    });

    it('returns error for missing or invalid exercise properties', () => {
      const testCases = [
        { key: "id", value: "", expected: "Missing or invalid 'id'." },
        { key: "name", value: "  ", expected: "Missing or invalid 'name'." },
        { key: "description", value: 123, expected: "Missing or invalid 'description'." },
        { key: "execution_notes", value: "", expected: "Missing or invalid 'execution_notes'." },
        { key: "category", value: "InvalidCategory", expected: /Missing or invalid 'category' \(must be one of:/ },
        { key: "muscle_groups", value: [], expected: "Missing or invalid 'muscle_groups' (must be a non-empty array of strings)." },
        { key: "muscle_groups", value: "Legs", expected: "Missing or invalid 'muscle_groups' (must be a non-empty array of strings)." },
        { key: "difficulty", value: "SuperExpert", expected: "Missing or invalid 'difficulty' (must be Beginner, Intermediate, Advanced, or Expert)." },
        { key: "equipment", value: "None", expected: "Missing or invalid 'equipment' (must be an array of strings)." },
        { key: "duration_secs", value: -10, expected: "Missing or invalid 'duration_secs' (must be a non-negative number)." },
        { key: "duration_secs", value: "60", expected: "Missing or invalid 'duration_secs' (must be a non-negative number)." },
        { key: "sets", value: 0, expected: "Missing or invalid 'sets' (must be a number >= 1)." },
        { key: "reps_min", value: 0, expected: "'reps_min' must be a positive integer or null." },
        { key: "reps_max", value: -5, expected: "'reps_max' must be a positive integer or null." },
        { key: "is_unilateral", value: "false", expected: "'is_unilateral' must be a boolean." },
        { key: "rest_secs", value: -5, expected: "'rest_secs' must be a non-negative number." },
        { key: "video_url", value: "ftp://example.com", expected: "'video_url' must be a valid URL string or null." },
        { key: "image_url", value: 123, expected: "'image_url' must be a string or null." },
      ];

      for (const { key, value, expected } of testCases) {
        const track = { ...baseValidTrack, exercises: [{ ...validExercise, [key]: value }] };
        const result = validateTrack(track);
        if (expected instanceof RegExp) {
          expect(result).toMatch(expected);
        } else {
          expect(result).toContain(expected);
        }
      }
    });
  });

  describe('Levels Validation Errors', () => {
    it('returns error if level is not an object', () => {
      const track = { ...baseValidTrack, levels: [null] };
      expect(validateTrack(track)).toBe("Level 1: Must be an object.");
    });

    it('returns error for missing or invalid level properties', () => {
      const testCases = [
        { key: "level_number", value: "1", expected: "Missing or invalid 'level_number'." },
        { key: "level_number", value: NaN, expected: "Missing or invalid 'level_number'." },
        { key: "title", value: "", expected: "Missing or invalid 'title'." },
        { key: "description", value: "  ", expected: "Missing or invalid 'description'." },
        { key: "target_duration_secs", value: 0, expected: "Missing or invalid 'target_duration_secs' (must be a positive number)." },
        { key: "target_duration_secs", value: "60", expected: "Missing or invalid 'target_duration_secs' (must be a positive number)." },
      ];

      for (const { key, value, expected } of testCases) {
        const track = { ...baseValidTrack, levels: [{ ...validLevel, [key]: value }] };
        expect(validateTrack(track)).toContain(expected);
      }
    });
  });
});

describe('generateLevelsFromExercises', () => {
  const sampleExercises = [
    {
      name: "Exercise A",
      description: "Desc A",
      category: "Strength",
      muscle_groups: ["Chest"],
      difficulty: "Beginner",
      duration_secs: 60,
      sets: 3,
      reps: "10-12 Reps",
      is_unilateral: false,
      rest_secs: 60,
      equipment: ["Dumbbells"]
    },
    {
      name: "Exercise B",
      description: "Desc B",
      category: "Skill",
      muscle_groups: ["Legs"],
      difficulty: "Intermediate",
      duration_secs: 30,
      sets: 4,
      reps_min: 8,
      reps_max: 10,
      is_unilateral: true,
      equipment: []
    },
    {
      name: "Exercise C",
      description: "Desc C",
      category: "Mobility",
      target_muscles: ["Back"],
      difficulty: "beginner",
      duration_secs: 45,
      sets: 2,
      reps_min: 15,
      rest_secs: 30
    },
    {
      name: "Exercise D",
      description: "Desc D",
      category: "Stability",
      difficulty: "Advanced",
      duration_secs: 60,
      sets: 1,
      // No reps defined, should fall back to duration
    }
  ];

  it('returns empty array if exercises is undefined or null', () => {
    expect(generateLevelsFromExercises(undefined, "Beginner")).toEqual([]);
    expect(generateLevelsFromExercises(null, "Beginner")).toEqual([]);
  });

  it('filters exercises by onboardingTier case-insensitively', () => {
    const levels = generateLevelsFromExercises(sampleExercises, "Beginner");
    expect(levels.length).toBe(2);
    expect(levels[0].title).toBe("Exercise A");
    expect(levels[1].title).toBe("Exercise C");

    const intLevels = generateLevelsFromExercises(sampleExercises, "INTERMEDIATE");
    expect(intLevels.length).toBe(1);
    expect(intLevels[0].title).toBe("Exercise B");
  });

  it('formats reps string correctly based on available data', () => {
    const levels = generateLevelsFromExercises(sampleExercises, "Beginner");
    // Ex A has `reps` explicitly
    expect(levels[0].reps).toBe("10-12 Reps");

    // Ex C has `reps_min` but no `reps_max`
    expect(levels[1].reps).toBe("15 Reps");

    const intLevels = generateLevelsFromExercises(sampleExercises, "Intermediate");
    // Ex B has `reps_min` and `reps_max`
    expect(intLevels[0].reps).toBe("8-10 Reps");

    const advLevels = generateLevelsFromExercises(sampleExercises, "Advanced");
    // Ex D has no reps, falls back to duration
    expect(advLevels[0].reps).toBe("60s Hold");
  });

  it('constructs level objects with correctly mapped fields and formatting', () => {
    const levels = generateLevelsFromExercises(sampleExercises, "Intermediate");
    const level = levels[0];

    expect(level.level_number).toBe(1);
    expect(level.title).toBe("Exercise B");
    expect(level.target_duration_secs).toBe(30);
    expect(level.is_unilateral).toBe(true);
    expect(level.equipment).toEqual([]);
    expect(level.rest_secs).toBe(0); // missing in Ex B, defaults to 0
    expect(level.sets).toBe(4);

    expect(level.description).toContain("Desc B");
    expect(level.description).toContain("Category: Skill");
    expect(level.description).toContain("Target: Legs");
    expect(level.description).toContain("Side: Unilateral (Perform per side)");
    expect(level.description).toContain("Equipment: None");
    expect(level.description).toContain("Rest: None");
    expect(level.description).toContain("Instructions: 8-10 Reps (4 Sets)");
  });

  it('handles formatting of bilateral exercises and equipment correctly', () => {
    const levels = generateLevelsFromExercises(sampleExercises, "Beginner");
    const level = levels[0];

    expect(level.description).toContain("Side: Bilateral");
    expect(level.description).toContain("Equipment: Dumbbells");
    expect(level.description).toContain("Rest: 60s");
  });

  it('handles empty muscle_groups or target_muscles', () => {
      const advLevels = generateLevelsFromExercises(sampleExercises, "Advanced");
      expect(advLevels[0].description).toContain("Target: \n");
describe('resolveLevelProgressOnToggle', () => {
  const displayLevels = [
    { level_number: 1, title: 'Pushup' },
    { level_number: 2, title: 'Pullup' },
    { level_number: 3, title: 'Squat' },
  ];

  it('returns null if isActive is false', () => {
    expect(
      resolveLevelProgressOnToggle(false, displayLevels, 1, 'Pushup', [], [])
    ).toBeNull();
  });

  it('returns null if activeLevel is not found', () => {
    // currentLevelNumber is 4, which doesn't exist in displayLevels
    expect(
      resolveLevelProgressOnToggle(true, displayLevels, 4, 'Pushup', [], [])
    ).toBeNull();
  });

  it('iterates forward to find next unexcluded level when active level is toggled off', () => {
    // Current is 1 (Pushup). Toggling Pushup off.
    // updatedExcluded includes 'Pushup', so Level 2 (Pullup) should be next.
    expect(
      resolveLevelProgressOnToggle(true, displayLevels, 1, 'Pushup', [], ['Pushup'])
    ).toEqual({
      current_level_number: 2,
      completed_sessions_count: 0
    });
  });

  it('skips excluded levels while iterating forward', () => {
    // Current is 1 (Pushup). Toggling Pushup off.
    // 'Pullup' (Level 2) is already excluded. So Level 3 (Squat) should be next.
    expect(
      resolveLevelProgressOnToggle(true, displayLevels, 1, 'Pushup', [], ['Pushup', 'Pullup'])
    ).toEqual({
      current_level_number: 3,
      completed_sessions_count: 0
    });
  });

  it('iterates backward if no valid forward levels exist', () => {
    // Current is 3 (Squat). Toggling Squat off.
    // Nothing forward. So it should find Level 2 (Pullup).
    expect(
      resolveLevelProgressOnToggle(true, displayLevels, 3, 'Squat', [], ['Squat'])
    ).toEqual({
      current_level_number: 2,
      completed_sessions_count: 0
    });
  });

  it('skips excluded levels while iterating backward', () => {
    // Current is 3 (Squat). Toggling Squat off.
    // Level 2 ('Pullup') is already excluded. So it finds Level 1 ('Pushup').
    expect(
      resolveLevelProgressOnToggle(true, displayLevels, 3, 'Squat', [], ['Squat', 'Pullup'])
    ).toEqual({
      current_level_number: 1,
      completed_sessions_count: 0
    });
  });

  it('returns current_level_number: null if no valid levels exist forward or backward', () => {
    // Toggling off the only level not excluded.
    expect(
      resolveLevelProgressOnToggle(true, displayLevels, 1, 'Pushup', [], ['Pushup', 'Pullup', 'Squat'])
    ).toEqual({
      current_level_number: null,
      completed_sessions_count: 0
    });
  });

  it('restores level progress when currentLevelNumber is null and excluded exercise is re-included', () => {
    // Re-including 'Pullup'
    expect(
      resolveLevelProgressOnToggle(true, displayLevels, null, 'Pullup', ['Pullup'], [])
    ).toEqual({
      current_level_number: 2,
      completed_sessions_count: 0
    });
  });

  it('returns null when currentLevelNumber is null but exercise is not in currentExcluded', () => {
    // currentLevelNumber is null, but we are toggling something not previously excluded?
    // According to code, if not in currentExcluded, it returns null.
    expect(
      resolveLevelProgressOnToggle(true, displayLevels, null, 'Pullup', [], [])
    ).toBeNull();
  });

  it('returns null when currentLevelNumber is null and exercise is in currentExcluded but level not found', () => {
    // 'Lunge' not in displayLevels
    expect(
      resolveLevelProgressOnToggle(true, displayLevels, null, 'Lunge', ['Lunge'], [])
    ).toBeNull();
  });

  it('returns null when toggling an exercise that is not the active level', () => {
    // Current is 1 (Pushup). We toggle 'Pullup'.
    // activeLevel.title === exerciseTitle is false. Returns null.
    expect(
      resolveLevelProgressOnToggle(true, displayLevels, 1, 'Pullup', [], ['Pullup'])
    ).toBeNull();
  });
});
