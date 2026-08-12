import React, { useState } from "react";
import { openUrl } from "../utils/tauri";
import { ExternalLinkIcon, ArrowRightIcon } from "./ui/Icons";
import styles from "./ActiveRecallCard.module.css";

/**
 * ActiveRecallCard represents the right layout panel for active recall questions, answers, and FSRS spaced repetition.
 */
const ActiveRecallCard = React.memo(function ActiveRecallCard({
  sessionCard, 
  showAnswer, 
  setShowAnswer, 
  onRateCard
}) {
  const [showHint, setShowHint] = useState(false);

  const handleOpenSource = () => {
    if (sessionCard?.source_url) {
      openUrl(sessionCard.source_url);
    }
  };

  return (
    <section className={`active-break-card ${styles['recall-card']}`} data-purpose="primary-session-card">
      <div className={styles['recall-card-top']}>
        <div className={styles['recall-card-body']}>
          <span className={styles['recall-card-category']}>
            {sessionCard?.concept_title || "GENERAL"}
          </span>
          <h2 className={styles['recall-card-question']}>
            {sessionCard?.scenario_prose || "Are both study and body break concepts clear?"}
          </h2>

          {sessionCard?.scenario_code_snippet && (
            <pre className={styles['code-block']}>
              <code>{sessionCard.scenario_code_snippet}</code>
            </pre>
          )}

          {sessionCard?.hint && (
            <div className={styles['hint-section']}>
              {!showHint ? (
                <button 
                  onClick={() => setShowHint(true)} 
                  className={styles['hint-toggle-btn']}
                >
                  Show Hint
                </button>
              ) : (
                <p className={styles['hint-text']}>
                  <em>Hint:</em> {sessionCard.hint}
                </p>
              )}
            </div>
          )}
          
          <div className={`${styles['recall-card-answer-hint']} ${showAnswer ? styles['hidden'] : ""}`}>
            <p style={{ opacity: 0.4, fontStyle: "italic", fontSize: "1rem" }}>
              Answer is hidden. Click "Show Answer" below to reveal.
            </p>
          </div>
          
          <div className={`${styles['recall-card-answer-wrapper']} ${showAnswer ? styles['visible'] : ""}`}>
            <div className={styles['recall-card-answer-content']}>
              <div className={styles['recall-card-answer']}>
                <p>{sessionCard?.target_answer_prose || "Yes! Continue doing healthy breaks."}</p>
              </div>

              {sessionCard?.target_answer_code && (
                <pre className={styles['code-block']}>
                  <code>{sessionCard.target_answer_code}</code>
                </pre>
              )}

              {sessionCard?.common_trap && (
                <div className={styles['trap-box']}>
                  <strong>Common Trap:</strong> {sessionCard.common_trap}
                </div>
              )}

              {sessionCard?.explanation && (
                <div className={styles['explanation-box']}>
                  <strong>Explanation:</strong> {sessionCard.explanation}
                </div>
              )}
              
              <div className={styles['difficulty-section']}>
                <span className={styles['difficulty-label']}>RATE ANSWER (FSRS):</span>
                <div className={styles['difficulty-buttons']}>
                  <button
                    onClick={() => onRateCard && onRateCard(sessionCard.variant_id, 1)}
                    className={`${styles['diff-btn']} ${styles['again']}`}
                  >
                    Again
                  </button>
                  <button
                    onClick={() => onRateCard && onRateCard(sessionCard.variant_id, 2)}
                    className={`${styles['diff-btn']} ${styles['hard']}`}
                  >
                    Hard
                  </button>
                  <button
                    onClick={() => onRateCard && onRateCard(sessionCard.variant_id, 3)}
                    className={`${styles['diff-btn']} ${styles['good']}`}
                  >
                    Good
                  </button>
                  <button
                    onClick={() => onRateCard && onRateCard(sessionCard.variant_id, 4)}
                    className={`${styles['diff-btn']} ${styles['easy']}`}
                  >
                    Easy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
 
      <div className={styles['recall-card-footer']}>
        {sessionCard?.source_url ? (
          <button 
            className={styles['recall-source-btn']}
            data-purpose="source-link"
            onClick={handleOpenSource}
            title={sessionCard.source_title || "Open source documentation"}
          >
            {sessionCard.source_title || "View Source"}
            <ExternalLinkIcon className={styles['source-icon']} />
          </button>
        ) : (
          <div />
        )}
        
        {!showAnswer && (
          <button 
            className={styles['recall-primary-btn']} 
            data-purpose="primary-action"
            onClick={() => setShowAnswer(true)}
          >
            Show Answer
            <ArrowRightIcon className={styles['btn-arrow-icon']} />
          </button>
        )}
      </div>
    </section>
  );
});

export default ActiveRecallCard;
