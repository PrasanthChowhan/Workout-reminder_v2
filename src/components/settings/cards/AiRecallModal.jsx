import React, { useState, useMemo, useEffect } from "react";
import Modal from "../../ui/Modal";
import { generateRecallAiPrompt } from "../../../utils/aiPrompt";
import { invoke } from "../../../utils/tauri";
import learningConceptSchema from "../../../../docs/schemas/Learning-concept-program.schema.json";
import { toast } from "../../../utils/toast";
import styles from "./AiRecallModal.module.css";

export default function AiRecallModal({
  isOpen,
  onClose,
  onApplyRecallCards,
  parentStyles = {}
}) {
  const [sourceType, setSourceType] = useState("topic"); // "topic" or "youtube"
  const [topicInput, setTopicInput] = useState("Rust lifetimes and memory safety");
  const [youtubeInput, setYoutubeInput] = useState("");
  const [pastedJson, setPastedJson] = useState("");
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [promptTemplate, setPromptTemplate] = useState("");

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const text = await invoke("read_prompt_file", { name: "active-recall-card-generation-prompt.md" });
        setPromptTemplate(text);
      } catch (err) {
        console.warn("Failed to load prompt template from backend, using fallback", err);
      }
    };
    if (isOpen) {
      loadTemplate();
    }
  }, [isOpen]);

  const currentTopicOrUrl = useMemo(() => {
    return sourceType === "youtube" ? youtubeInput.trim() : topicInput.trim();
  }, [sourceType, topicInput, youtubeInput]);

  const currentPrompt = useMemo(() => {
    const targetText = sourceType === "youtube"
      ? `the YouTube video content from URL: "${currentTopicOrUrl || "https://www.youtube.com/watch?v=..."}"`
      : `the topic/concept: "${currentTopicOrUrl || "Rust lifetimes and memory safety"}"`;

    if (promptTemplate) {
      return promptTemplate
        .replace("{{targetText}}", targetText)
        .replace("{{schemaString}}", JSON.stringify(learningConceptSchema, null, 2));
    }

    return generateRecallAiPrompt(currentTopicOrUrl || "Rust lifetimes and memory safety", learningConceptSchema, {
      isYoutube: sourceType === "youtube"
    });
  }, [promptTemplate, currentTopicOrUrl, sourceType]);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(currentPrompt);
      toast.success("AI Prompt copied to clipboard!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to copy prompt.");
    }
  };

  const { isValidJson, jsonValidationError } = useMemo(() => {
    if (!pastedJson.trim()) {
      return { isValidJson: false, jsonValidationError: "" };
    }
    try {
      const parsed = JSON.parse(pastedJson);
      if (!parsed.concepts || !Array.isArray(parsed.concepts)) {
        return { isValidJson: false, jsonValidationError: "JSON must contain a 'concepts' array." };
      }
      return { isValidJson: true, jsonValidationError: "" };
    } catch (e) {
      return { isValidJson: false, jsonValidationError: e.message };
    }
  }, [pastedJson]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Custom AI Learning Cards">
      <div className={styles['ai-routine-info']}>
        <span className={styles['ai-routine-tag']}>Instructions</span>
        <p
          className={parentStyles['settings-item-desc']}
          style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)", lineHeight: "1.5" }}
        >
          Generate active recall flashcards using AI. Follow these steps:
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
          <li>Configure your topic or YouTube video URL details below.</li>
          <li>Click <strong>"Copy AI Prompt"</strong> and paste it into Claude, ChatGPT, or Gemini.</li>
          <li>Paste the resulting JSON response below and click <strong>"Import Cards"</strong>.</li>
        </ol>
      </div>

      {/* Phase 1: Building the Prompt */}
      <div className={styles['phase-panel']}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "1.25rem" }}>
          
          {/* Source Type Selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label className={styles['levels-list-title']}>Source Type</label>
            <select
              className={styles['ai-select']}
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
            >
              <option value="topic">Topic / Concept</option>
              <option value="youtube">YouTube Video URL</option>
            </select>
          </div>

          {/* Topic or YouTube URL Input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label className={styles['levels-list-title']}>
              {sourceType === "youtube" ? "YouTube Video URL" : "Topic / Technology Name"}
            </label>
            {sourceType === "youtube" ? (
              <input
                type="text"
                className={styles['ai-input']}
                value={youtubeInput}
                onChange={(e) => setYoutubeInput(e.target.value)}
                placeholder="e.g., https://www.youtube.com/watch?v=..."
                autoFocus
              />
            ) : (
              <input
                type="text"
                className={styles['ai-input']}
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="e.g., Rust lifetimes, React fiber architecture"
                autoFocus
              />
            )}
          </div>

        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            type="button"
            className={styles['track-copy-prompt-btn']}
            onClick={handleCopyPrompt}
            disabled={!currentTopicOrUrl}
            style={{ opacity: currentTopicOrUrl ? 1 : 0.5, cursor: currentTopicOrUrl ? "pointer" : "not-allowed" }}
          >
            Copy AI Prompt
          </button>
          <button
            type="button"
            className={styles['preview-prompt-link']}
            onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
          >
            {isPreviewExpanded ? "Hide Preview" : "Preview Prompt"}
          </button>
        </div>

        {isPreviewExpanded && (
          <div className={styles['prompt-preview-container']}>
            <textarea
              readOnly
              className={styles['prompt-preview-textarea']}
              value={currentPrompt}
              onClick={(e) => e.target.select()}
            />
          </div>
        )}
      </div>

      <hr className={styles['phase-divider']} />

      {/* Phase 2: Pasting the Result */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <label className={styles['levels-list-title']} style={{ display: "block" }}>
          Paste AI Response (JSON)
        </label>
        <textarea
          className={styles['json-textarea']}
          placeholder='{ "metadata": { "source_title": "...", "source_url": "..." }, "concepts": [...] }'
          value={pastedJson}
          onChange={(e) => setPastedJson(e.target.value)}
        />
        {pastedJson.trim() && (
          <div className={isValidJson ? styles['validation-valid'] : styles['validation-invalid']}>
            {isValidJson ? "✓ Valid JSON structure" : `✗ Invalid: ${jsonValidationError}`}
          </div>
        )}
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
          disabled={!isValidJson}
          onClick={() => onApplyRecallCards(pastedJson)}
        >
          Import Cards
        </button>
      </div>
    </Modal>
  );
}
