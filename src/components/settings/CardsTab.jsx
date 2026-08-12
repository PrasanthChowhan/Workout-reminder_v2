import React, { useState, useRef } from "react";
import { Modal } from "../ui/Modal";
import AiRecallModal from "./cards/AiRecallModal";
import styles from "./CardsTab.module.css";
import useRecallConcepts from "../../hooks/useRecallConcepts";

export default function CardsTab() {
  const [activeConcept, setActiveConcept] = useState(null);
  const [showAiRecallModal, setShowAiRecallModal] = useState(false);
  
  const fileInputRef = useRef(null);

  const {
    concepts,
    handleImportJson,
    handleExportJson,
    handleApplyRecallCards
  } = useRecallConcepts();

  const onFileChange = (e) => {
    const file = e.target.files[0];
    handleImportJson(file, () => {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    });
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
            onClick={() => setShowAiRecallModal(true)}
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
            onChange={onFileChange}
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
      {showAiRecallModal && (
        <AiRecallModal
          isOpen={showAiRecallModal}
          onClose={() => setShowAiRecallModal(false)}
          onApplyRecallCards={(jsonStr) => handleApplyRecallCards(jsonStr, () => setShowAiRecallModal(false))}
          parentStyles={styles}
        />
      )}
    </div>
  );
}
