import { trainingProgramPrompt } from "../prompts/trainingProgramPrompt.js";
import { recallPrompt } from "../prompts/recallPrompt.js";

export const generateAiPrompt = (schemaString, options = {}) => {
  const userGoal = options.userGoal || "hip mobility";
  const userLevel = options.userLevel || "Beginner";
  const availableEquipment = options.availableEquipment || "[]";
  const sessionDuration = options.sessionDuration || "15";
  const injuries = options.injuries || "none";
  const preferredStyle = options.preferredStyle || "general";

  return trainingProgramPrompt
    .replace("{{USER_GOAL}}", userGoal)
    .replace("{{USER_LEVEL}}", userLevel)
    .replace("{{AVAILABLE_EQUIPMENT}}", availableEquipment)
    .replace("{{SESSION_DURATION}}", sessionDuration)
    .replace("{{INJURIES}}", injuries)
    .replace("{{PREFERRED_STYLE}}", preferredStyle)
    .replace("{{SCHEMA_STRING}}", schemaString);
};

export const generateRecallAiPrompt = (topic = "Rust lifetimes and memory safety", schema = {}, options = {}) => {
  const isYoutube = options.isYoutube || false;
  const schemaString = typeof schema === "string" ? schema : JSON.stringify(schema, null, 2);

  const targetText = isYoutube
    ? `the YouTube video content from URL: "${topic}"`
    : `the topic/concept: "${topic}"`;

  return recallPrompt
    .replace("{{TARGET_TEXT}}", targetText)
    .replace("{{SCHEMA_STRING}}", schemaString);
};
