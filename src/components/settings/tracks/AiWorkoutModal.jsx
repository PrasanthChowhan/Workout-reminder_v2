import React, { useState } from "react";
import Modal from "../../ui/Modal";
import { generateAiPrompt } from "../../../utils/aiPrompt";
import trainingProgramSchema from "../../../../docs/schemas/training-program.schema.json";
import { toast } from "../../../utils/toast";
import styles from "./AiWorkoutModal.module.css";

const GOAL_PRESETS = [
  { value: "hip mobility", label: "Hip Mobility" },
  { value: "core strengthening", label: "Core Strengthening" },
  { value: "shoulder stability", label: "Shoulder Stability" },
  { value: "lower body strength", label: "Lower Body Strength" },
  { value: "posture improvement", label: "Posture Improvement" },
  { value: "lower back pain relief", label: "Lower Back Pain Relief" },
  { value: "wrist & forearm mobility", label: "Wrist & Forearm Mobility" },
  { value: "hamstring flexibility", label: "Hamstring Flexibility" }
];

const EQUIPMENT_PRESETS = [
  { value: "[]", label: "Bodyweight (No Equipment)" },
  { value: '["Mat"]', label: "Mat Only" },
  { value: '["Resistance Band"]', label: "Resistance Band Only" },
  { value: '["Mat", "Resistance Band"]', label: "Mat & Resistance Band" }
];

const DURATION_PRESETS = [
  { value: "5", label: "5 Minutes" },
  { value: "10", label: "10 Minutes" },
  { value: "15", label: "15 Minutes" },
  { value: "20", label: "20 Minutes" },
  { value: "30", label: "30 Minutes" }
];

const INJURY_PRESETS = [
  { value: "none", label: "None (Healthy)" },
  { value: "knee pain", label: "Knee Pain / Limitations" },
  { value: "wrist pain", label: "Wrist Pain / Carpal Tunnel" },
  { value: "lower back pain", label: "Lower Back Pain" },
  { value: "shoulder pain", label: "Shoulder Pain / Stiffness" }
];

const STYLE_PRESETS = [
  { value: "general", label: "General" },
  { value: "mobility-focused", label: "Mobility Focused" },
  { value: "strength-focused", label: "Strength Focused" },
  { value: "rehab-friendly", label: "Rehab & Recovery" },
  { value: "yoga/stretching", label: "Yoga & Stretching" }
];

export default function AiWorkoutModal({
  isOpen,
  onClose,
  onApplyProgram,
  parentStyles = {}
}) {
  // Custom AI prompt input states
  const [aiGoalSelect, setAiGoalSelect] = useState("hip mobility");
  const [aiGoalCustom, setAiGoalCustom] = useState("");
  const [aiLevel, setAiLevel] = useState("beginner");
  const [aiEquipmentSelect, setAiEquipmentSelect] = useState("[]");
  const [aiEquipmentCustom, setAiEquipmentCustom] = useState("");
  const [aiDurationSelect, setAiDurationSelect] = useState("15");
  const [aiDurationCustom, setAiDurationCustom] = useState("");
  const [aiInjuriesSelect, setAiInjuriesSelect] = useState("none");
  const [aiInjuriesCustom, setAiInjuriesCustom] = useState("");
  const [aiStyleSelect, setAiStyleSelect] = useState("general");
  const [aiStyleCustom, setAiStyleCustom] = useState("");
  const [pastedJson, setPastedJson] = useState("");

  const handleCopyPrompt = async () => {
    try {
      const getParamValue = (selectVal, customVal) => {
        return selectVal === "custom" ? customVal : selectVal;
      };

      const fullPrompt = generateAiPrompt(trainingProgramSchema, {
        userGoal: getParamValue(aiGoalSelect, aiGoalCustom) || "hip mobility",
        userLevel: aiLevel === "progression" ? "Progression (Beginner to Advanced)" : aiLevel.charAt(0).toUpperCase() + aiLevel.slice(1),
        availableEquipment: getParamValue(aiEquipmentSelect, aiEquipmentCustom) || "[]",
        sessionDuration: getParamValue(aiDurationSelect, aiDurationCustom) || "15",
        injuries: getParamValue(aiInjuriesSelect, aiInjuriesCustom) || "none",
        preferredStyle: getParamValue(aiStyleSelect, aiStyleCustom) || "general"
      });
      await navigator.clipboard.writeText(fullPrompt);
      toast.success("AI Prompt copied with custom parameters!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to copy prompt.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Custom AI Workout">
      <div className={styles['ai-routine-info']}>
        <span className={styles['ai-routine-tag']}>Instructions</span>
        <p
          className={parentStyles['settings-item-desc']}
          style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)", lineHeight: "1.5" }}
        >
          Generate custom training programs using AI. Follow these steps:
        </p>
        <ol
          className={parentStyles['settings-item-desc']}
          style={{
            margin: "0.5rem 0 0 1.25rem",
            padding: 0,
            fontSize: "0.8rem",
            color: "var(--color-text-muted)",
            lineHeight: "1.5"
          }}
        >
          <li>Click <strong>"Copy AI Prompt"</strong> below to copy the system prompt & JSON schema.</li>
          <li>Paste the prompt into any AI tool (Gemini, Claude, ChatGPT, etc.) to generate your custom program.</li>
          <li>Paste the resulting JSON block in the textarea below and click <strong>"Apply Program"</strong>.</li>
        </ol>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "1.5rem" }}>
        {/* Goal / Focus Topic & Difficulty Level */}
        <div className={styles['ai-input-grid']}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label className={styles['levels-list-title']}>Goal / Focus Topic</label>
            <select
              className={styles['ai-select']}
              value={aiGoalSelect}
              onChange={(e) => setAiGoalSelect(e.target.value)}
            >
              {GOAL_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>{preset.label}</option>
              ))}
              <option value="custom">Custom...</option>
            </select>
            {aiGoalSelect === "custom" && (
              <input
                type="text"
                className={styles['ai-input']}
                style={{ marginTop: "0.35rem" }}
                value={aiGoalCustom}
                onChange={(e) => setAiGoalCustom(e.target.value)}
                placeholder="e.g., handstand prep, neck release"
                autoFocus
              />
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label className={styles['levels-list-title']}>Difficulty Level</label>
            <select
              className={styles['ai-select']}
              value={aiLevel}
              onChange={(e) => setAiLevel(e.target.value)}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="progression">Progression (Beginner to Advanced)</option>
            </select>
          </div>
        </div>

        {/* Available Equipment & Duration */}
        <div className={styles['ai-input-grid']}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label className={styles['levels-list-title']}>Available Equipment</label>
            <select
              className={styles['ai-select']}
              value={aiEquipmentSelect}
              onChange={(e) => setAiEquipmentSelect(e.target.value)}
            >
              {EQUIPMENT_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>{preset.label}</option>
              ))}
              <option value="custom">Custom...</option>
            </select>
            {aiEquipmentSelect === "custom" && (
              <input
                type="text"
                className={styles['ai-input']}
                style={{ marginTop: "0.35rem" }}
                value={aiEquipmentCustom}
                onChange={(e) => setAiEquipmentCustom(e.target.value)}
                placeholder='e.g., ["Mat", "Resistance Band"] or []'
                autoFocus
              />
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label className={styles['levels-list-title']}>Duration (Minutes)</label>
            <select
              className={styles['ai-select']}
              value={aiDurationSelect}
              onChange={(e) => setAiDurationSelect(e.target.value)}
            >
              {DURATION_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>{preset.label}</option>
              ))}
              <option value="custom">Custom...</option>
            </select>
            {aiDurationSelect === "custom" && (
              <input
                type="number"
                min="5"
                max="60"
                className={styles['ai-input']}
                style={{ marginTop: "0.35rem" }}
                value={aiDurationCustom}
                onChange={(e) => setAiDurationCustom(e.target.value)}
                placeholder="e.g. 15"
                autoFocus
              />
            )}
          </div>
        </div>

        {/* Injuries / Limitations & Preferred Style */}
        <div className={styles['ai-input-grid']}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label className={styles['levels-list-title']}>Injuries / Limitations</label>
            <select
              className={styles['ai-select']}
              value={aiInjuriesSelect}
              onChange={(e) => setAiInjuriesSelect(e.target.value)}
            >
              {INJURY_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>{preset.label}</option>
              ))}
              <option value="custom">Custom...</option>
            </select>
            {aiInjuriesSelect === "custom" && (
              <input
                type="text"
                className={styles['ai-input']}
                style={{ marginTop: "0.35rem" }}
                value={aiInjuriesCustom}
                onChange={(e) => setAiInjuriesCustom(e.target.value)}
                placeholder="e.g., knee pain, none"
                autoFocus
              />
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label className={styles['levels-list-title']}>Preferred Style</label>
            <select
              className={styles['ai-select']}
              value={aiStyleSelect}
              onChange={(e) => setAiStyleSelect(e.target.value)}
            >
              {STYLE_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>{preset.label}</option>
              ))}
              <option value="custom">Custom...</option>
            </select>
            {aiStyleSelect === "custom" && (
              <input
                type="text"
                className={styles['ai-input']}
                style={{ marginTop: "0.35rem" }}
                value={aiStyleCustom}
                onChange={(e) => setAiStyleCustom(e.target.value)}
                placeholder="e.g., strength-focused, rehab"
                autoFocus
              />
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "1.5rem" }}>
        <button
          type="button"
          className={styles['track-copy-prompt-btn']}
          onClick={handleCopyPrompt}
        >
          Copy AI Prompt
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <label className={styles['levels-list-title']} style={{ display: "block" }}>
          Paste AI Response (JSON)
        </label>
        <textarea
          className={styles['json-textarea']}
          placeholder='{ "id": "my_custom_routine", "name": "...", "description": "...", "exercises": [...] }'
          value={pastedJson}
          onChange={(e) => setPastedJson(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
        <button
          type="button"
          className={`${styles['workout-overlay-btn']} ${styles['secondary']}`}
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          className={`${styles['workout-overlay-btn']} ${styles['primary']}`}
          onClick={() => onApplyProgram(pastedJson)}
        >
          Apply Program
        </button>
      </div>
    </Modal>
  );
}
