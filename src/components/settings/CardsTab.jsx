import React, { useState, useEffect, useRef } from "react";
import { invoke } from "../../utils/tauri";
import { toast } from "../../utils/toast";
import { Modal } from "../ui/Modal";
import { generateRecallAiPrompt } from "../../utils/aiPrompt";
import styles from "./CardsTab.module.css";

export default function CardsTab() {
  const [concepts, setConcepts] = useState([]);
  const [activeConcept, setActiveConcept] = useState(null);
  const [showAiPromptModal, setShowAiPromptModal] = useState(false);
  const [promptTopic, setPromptTopic] = useState("Rust lifetimes and memory safety");
  
  const fileInputRef = useRef(null);

  const loadConcepts = async () => {
    try {
      const list = await invoke("get_recall_concepts");
      setConcepts(list || []);
    } catch (err) {
      console.error("Failed to load recall concepts", err);
      toast.error("Failed to load recall concepts.");
    }
  };

  useEffect(() => {
    loadConcepts();
  }, []);

  const handleImportJson = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = event.target.result;
        await invoke("import_recall_json", { jsonStr: jsonContent });
        toast.success("Recall cards imported and merged successfully!");
        loadConcepts();
      } catch (err) {
        console.error("Import failed", err);
        toast.error("Import failed: " + err);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };

  const handleExportJson = async () => {
    try {
      const data = await invoke("export_recall_json");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `active_recall_export_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Recall cards exported successfully!");
    } catch (err) {
      console.error("Export failed", err);
      toast.error("Export failed: " + err);
    }
  };

  const handleCopyPrompt = () => {
    const promptText = generateRecallAiPrompt(promptTopic);
    navigator.clipboard.writeText(promptText)
      .then(() => toast.success("AI Prompt copied to clipboard!"))
      .catch((err) => toast.error("Failed to copy text: " + err));
  };

  return (
    <div className={styles['tab-pane']}>
      <div className={styles['header-row']}>
        <h3 className={styles['settings-group-title']} style={{ margin: 0, borderBottom: "none", paddingBottom: 0 }}>
          Active Recall Decks
        </h3>
        <div className={styles['header-actions']}>
          <button 
            type="button" 
            className={styles['action-btn']}
            onClick={() => setShowAiPromptModal(true)}
          >
            AI Prompt
          </button>
          <button 
            type="button" 
            className={styles['action-btn']}
            onClick={() => fileInputRef.current?.click()}
          >
            Import JSON
          </button>
          <button 
            type="button" 
            className={styles['action-btn']}
            onClick={handleExportJson}
          >
            Export JSON
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportJson} 
            accept=".json" 
            style={{ display: "none" }} 
          />
        </div>
      </div>

      {concepts.length === 0 ? (
        <div className={styles['empty-state']}>
          <p>No recall cards found. Use the AI Prompt to generate some cards, then import them!</p>
        </div>
      ) : (
        <div className={styles['concepts-grid']}>
          {concepts.map((concept) => (
            <div 
              key={concept.concept_id} 
              className={styles['concept-card']}
              onClick={() => setActiveConcept(concept)}
            >
              <h4 className={styles['concept-title']}>{concept.concept_title}</h4>
              {concept.source_title && (
                <span className={styles['concept-source']}>
                  Source: {concept.source_title}
                </span>
              )}
              <div className={styles['concept-tags']}>
                {concept.tags.map((tag, idx) => (
                  <span key={idx} className={styles['tag-badge']}>{tag}</span>
                ))}
              </div>
              <div className={styles['concept-footer']}>
                <span className={styles['card-count']}>
                  {concept.variants?.length || 0} {concept.variants?.length === 1 ? 'card' : 'cards'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal showing variants */}
      {activeConcept && (
        <Modal 
          isOpen={true} 
          onClose={() => setActiveConcept(null)}
          title={activeConcept.concept_title}
        >
          <div className={styles['variants-container']}>
            {activeConcept.source_url && (
              <div className={styles['source-info']}>
                <strong>Documentation:</strong>{" "}
                <a href={activeConcept.source_url} target="_blank" rel="noopener noreferrer">
                  {activeConcept.source_title || activeConcept.source_url}
                </a>
              </div>
            )}
            
            <div className={styles['variants-list']}>
              {activeConcept.variants?.map((variant) => {
                const isNew = variant.state === 0;
                const formattedDueDate = new Date(variant.due_date).toLocaleDateString();
                const stateLabel = ["New", "Learning", "Review", "Relearning"][variant.state] || "New";

                return (
                  <div key={variant.variant_id} className={styles['variant-card']}>
                    <div className={styles['variant-header']}>
                      <span className={`${styles['difficulty-badge']} ${styles[variant.difficulty_level.toLowerCase()]}`}>
                        {variant.difficulty_level}
                      </span>
                      <span className={`${styles['srs-state-badge']} ${styles[stateLabel.toLowerCase()]}`}>
                        {stateLabel}
                      </span>
                    </div>

                    <div className={styles['variant-body']}>
                      <div className={styles['section']}>
                        <strong>Scenario / Question:</strong>
                        <p>{variant.scenario_prose}</p>
                        {variant.scenario_code_snippet && (
                          <pre className={styles['code-block']}>
                            <code>{variant.scenario_code_snippet}</code>
                          </pre>
                        )}
                      </div>

                      <div className={styles['section']}>
                        <strong>Target Answer:</strong>
                        <p>{variant.target_answer_prose}</p>
                        {variant.target_answer_code && (
                          <pre className={styles['code-block']}>
                            <code>{variant.target_answer_code}</code>
                          </pre>
                        )}
                      </div>

                      {variant.common_trap && (
                        <div className={styles['section']}>
                          <strong>Common Trap:</strong>
                          <p className={styles['trap-text']}>{variant.common_trap}</p>
                        </div>
                      )}

                      {variant.explanation && (
                        <div className={styles['section']}>
                          <strong>Explanation:</strong>
                          <p className={styles['explanation-text']}>{variant.explanation}</p>
                        </div>
                      )}
                    </div>

                    <div className={styles['variant-srs-footer']}>
                      <div className={styles['srs-stat']}>
                        <span>Stability:</span> <strong>{variant.stability.toFixed(2)}d</strong>
                      </div>
                      <div className={styles['srs-stat']}>
                        <span>Difficulty:</span> <strong>{variant.difficulty.toFixed(1)}/10</strong>
                      </div>
                      <div className={styles['srs-stat']}>
                        <span>Next Due:</span> <strong>{isNew ? "Now" : formattedDueDate}</strong>
                      </div>
                      <div className={styles['srs-stat']}>
                        <span>Reviews:</span> <strong>{variant.reps}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}

      {/* AI Prompt Modal */}
      {showAiPromptModal && (
        <Modal 
          isOpen={true} 
          onClose={() => setShowAiPromptModal(false)}
          title="Generate Recall Cards via AI"
        >
          <div className={styles['prompt-modal-content']}>
            <p className={styles['prompt-info']}>
              Type a topic below to customize the prompt, then click copy. Paste it into Claude or ChatGPT to generate cards in the exact required JSON format!
            </p>
            
            <div className={styles['input-group']}>
              <label className={styles['input-label']}>Topic / Technology:</label>
              <input 
                type="text" 
                className={styles['prompt-topic-input']}
                value={promptTopic}
                onChange={(e) => setPromptTopic(e.target.value)}
                placeholder="e.g., Rust lifetimes and memory safety"
              />
            </div>

            <div className={styles['textarea-container']}>
              <textarea 
                className={styles['prompt-textarea']}
                readOnly
                value={generateRecallAiPrompt(promptTopic)}
              />
            </div>

            <div className={styles['modal-actions']}>
              <button 
                type="button" 
                className={styles['primary-btn']}
                onClick={handleCopyPrompt}
              >
                Copy Prompt to Clipboard
              </button>
              <button 
                type="button" 
                className={styles['secondary-btn']}
                onClick={() => setShowAiPromptModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
