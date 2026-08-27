import React, { useState, useRef } from "react";
import { Modal } from "../ui/Modal";
import { ArrowLeftIcon, StarIcon } from "../ui/Icons";
import AiRecallModal from "./cards/AiRecallModal";
import CardBrowser from "./cards/CardBrowser";
import styles from "./CardsTab.module.css";
import useRecallConcepts from "../../hooks/useRecallConcepts";

export default function CardsTab() {
  const [activeConcept, setActiveConcept] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [showAiRecallModal, setShowAiRecallModal] = useState(false);
  const [isBrowserView, setIsBrowserView] = useState(false);
  
  const fileInputRef = useRef(null);

  const {
    concepts,
    handleImportJson,
    handleExportJson,
    handleApplyRecallCards,
    toggleConceptStar,
    toggleSourceStar
  } = useRecallConcepts();

  const onFileChange = (e) => {
    const file = e.target.files[0];
    handleImportJson(file, () => {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    });
  };

  const groupedConcepts = concepts.reduce((groups, concept) => {
    const sourceKey = concept.source_title || "General / Uncategorized";
    if (!groups[sourceKey]) {
      groups[sourceKey] = {
        sourceTitle: concept.source_title,
        sourceUrl: concept.source_url,
        items: []
      };
    }
    if (concept.source_url && !groups[sourceKey].sourceUrl) {
      groups[sourceKey].sourceUrl = concept.source_url;
    }
    groups[sourceKey].items.push(concept);
    return groups;
  }, {});

  return (
    <div className={styles['tab-pane']}>
      <div className={styles['header-row']}>
        <h3 className={styles['settings-group-title']} style={{ margin: 0, borderBottom: "none", paddingBottom: 0 }}>
          Active Recall Decks
        </h3>
        <div className={styles['header-actions']}>
          <button 
            type="button" 
            className={`${styles['action-btn']} ${isBrowserView ? styles['active'] : ''}`}
            onClick={() => setIsBrowserView(!isBrowserView)}
          >
            {isBrowserView ? "Topic View" : "Browser View"}
          </button>
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
      ) : isBrowserView ? (
        <CardBrowser />
      ) : selectedSource === null ? (
        <div className={styles['source-cards-grid']}>
          {Object.entries(groupedConcepts).map(([sourceName, group]) => {
            const totalVariants = group.items.reduce((sum, item) => sum + (item.variants?.length || 0), 0);
            const allStarred = group.items.every((c) => c.is_starred);
            const someStarred = group.items.some((c) => c.is_starred);

            return (
              <div 
                key={sourceName} 
                className={styles['source-card']}
                onDoubleClick={() => setSelectedSource(sourceName)}
                title="Double click to inspect topics"
              >
                <div className={styles['concept-header-row']}>
                  <h4 className={styles['source-card-title']}>{sourceName}</h4>
                  <button 
                    type="button"
                    className={`${styles['star-btn']} ${someStarred ? styles['starred'] : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      // If all are starred, unstar all. Otherwise, star all.
                      toggleSourceStar(sourceName, !allStarred);
                    }}
                    title={allStarred ? "Unstar All Topics" : "Star All Topics"}
                  >
                    <StarIcon width={18} height={18} filled={allStarred} />
                  </button>
                </div>
                {group.sourceUrl && (
                  <span className={styles['source-card-url']}>
                    {group.sourceUrl}
                  </span>
                )}
                <div className={styles['source-card-footer']}>
                  <span className={styles['source-topics-count']}>
                    {group.items.length} {group.items.length === 1 ? 'topic' : 'topics'}
                  </span>
                  <span className={styles['source-cards-count']}>
                    {totalVariants} {totalVariants === 1 ? 'card' : 'cards'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles['selected-source-view']}>
          <button 
            type="button" 
            className={styles['back-btn']} 
            onClick={() => setSelectedSource(null)}
          >
            <ArrowLeftIcon width={14} height={14} style={{ marginRight: "0.25rem" }} />
            Back to Sources
          </button>
          
          <div className={styles['source-header-inline']}>
            <h4 className={styles['selected-source-title']}>
              Source: {selectedSource}
            </h4>
            {groupedConcepts[selectedSource]?.sourceUrl && (
              <a 
                href={groupedConcepts[selectedSource].sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles['source-header-link']}
              >
                Open Documentation
              </a>
            )}
          </div>

          <div className={styles['concepts-grid']}>
            {groupedConcepts[selectedSource]?.items.map((concept) => (
              <div 
                key={concept.concept_id} 
                className={styles['concept-card']}
                onClick={() => setActiveConcept(concept)}
              >
                <div className={styles['concept-header-row']}>
                  <h4 className={styles['concept-title']}>{concept.concept_title}</h4>
                  <button 
                    type="button"
                    className={`${styles['star-btn']} ${concept.is_starred ? styles['starred'] : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleConceptStar(concept.concept_id, !concept.is_starred);
                    }}
                    title={concept.is_starred ? "Unstar Topic" : "Star Topic (Prioritize)"}
                  >
                    <StarIcon width={18} height={18} filled={concept.is_starred} />
                  </button>
                </div>
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
