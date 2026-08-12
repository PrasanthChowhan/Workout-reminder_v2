import { describe, it, expect } from 'vitest';
import { validateTrack } from './track';

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
