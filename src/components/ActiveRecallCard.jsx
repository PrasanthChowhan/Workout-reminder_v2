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
      {showHint && sessionCard?.hint && (
        <div className={styles['hint-overlay']}>
          <div className={styles['hint-overlay-header']}>
            <h3 className={styles['hint-overlay-title']}>Hint</h3>
            <button 
              onClick={() => setShowHint(false)} 
              className={styles['hint-close-btn']}
            >
              Close
            </button>
          </div>
          <p className={styles['hint-overlay-text']}>{sessionCard.hint}</p>
        </div>
      )}

      <div className={`${styles['recall-card-top']} ${showAnswer ? styles['answer-visible'] : ""}`}>
        <div className={`${styles['spacer-top']} ${showAnswer ? styles['shrunk'] : ""}`} />
        <div className={styles['recall-card-body']}>
          <h2 className={styles['recall-card-question']}>
            {sessionCard?.scenario_prose || "Are both study and body break concepts clear?"}
          </h2>

          {sessionCard?.scenario_code_snippet && (
            <pre className={styles['code-block']}>
              <code>{sessionCard.scenario_code_snippet}</code>
            </pre>
          )}
          
          <div className={`${styles['recall-card-answer-hint']} ${showAnswer ? styles['hidden'] : ""}`}>
            <p style={{ opacity: 0.4, fontStyle: "italic", fontSize: "1rem", margin: 0 }}>
              Answer is hidden. Click "Show Answer" below to reveal.
            </p>
            {sessionCard?.hint && (
              <button 
                onClick={() => setShowHint(true)} 
                className={styles['hint-pill-btn']}
              >
                Hint
              </button>
            )}
          </div>
          
          <div className={`${styles['recall-card-answer-wrapper']} ${showAnswer ? styles['visible'] : ""}`}>
            <div className={styles['recall-card-answer-content']}>
              <div className={styles['answer-box']}>
                <strong className={styles['answer-label']}>Answer:</strong>
                <span>{sessionCard?.target_answer_prose || "Yes! Continue doing healthy breaks."}</span>
              </div>

              {sessionCard?.target_answer_code && (
                <pre className={styles['code-block']}>
                  <code>{sessionCard.target_answer_code}</code>
                </pre>
              )}

              {sessionCard?.common_trap && (
                <div className={styles['trap-box']}>
                  <strong className={styles['trap-label']}>Common Trap:</strong>
                  <span>{sessionCard.common_trap}</span>
                </div>
              )}

              {sessionCard?.explanation && (
                <div className={styles['explanation-box']}>
                  <strong className={styles['explanation-label']}>Explanation:</strong>
                  <span>{sessionCard.explanation}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={`${styles['spacer-bottom']} ${showAnswer ? styles['shrunk'] : ""}`} />
      </div>

      <div className={styles['recall-card-footer']}>
        {sessionCard?.source_url ? (
          <button 
            className={styles['recall-source-btn']}
            data-purpose="source-link"
            onClick={handleOpenSource}
            title={sessionCard.source_title || "Open source documentation"}
          >
            Source
            <ExternalLinkIcon className={styles['source-icon']} />
          </button>
        ) : (
          <div />
        )}
        
        {!showAnswer ? (
          <button 
            className={styles['recall-primary-btn']} 
            data-purpose="primary-action"
            onClick={() => setShowAnswer(true)}
          >
            Show Answer
            <ArrowRightIcon className={styles['btn-arrow-icon']} />
          </button>
        ) : (
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
        )}
      </div>
    </section>
  );
});

export default ActiveRecallCard;
