import React from "react";
import { openUrl } from "../utils/tauri";
import { ExternalLinkIcon, ArrowRightIcon, CheckIcon } from "./ui/Icons";
import styles from "./ActiveRecallCard.module.css";

/**
 * ActiveRecallCard represents the right layout panel for active recall questions, answers, and source references.
 * 
 * @param {object} props
 * @param {object} props.sessionCard Active recall card session object
 * @param {boolean} props.showAnswer Whether the answer is currently revealed
 * @param {function} props.setShowAnswer Function to set the answer visibility state
 * @param {function} props.onCompleteBreak Callback to trigger when the session is successfully completed
 */
export default function ActiveRecallCard({ 
  sessionCard, 
  showAnswer, 
  setShowAnswer, 
  onCompleteBreak,
  onUpdateMetadata
 }) {
  const handleOpenSource = () => {
    if (sessionCard?.source) {
      openUrl(sessionCard.source);
    }
  };

  return (
    <section className={`active-break-card ${styles['recall-card']}`} data-purpose="primary-session-card">
      <div className={styles['recall-card-top']}>
        <div className={styles['recall-card-body']}>
          <span className={styles['recall-card-category']}>
            {sessionCard?.category || "GENERAL"}
          </span>
          <h2 className={styles['recall-card-question']}>
            {sessionCard?.question || "Are both study and body break concepts clear?"}
          </h2>
          
          <div className={`${styles['recall-card-answer-hint']} ${showAnswer ? styles['hidden'] : ""}`}>
            <p style={{ opacity: 0.4, fontStyle: "italic", fontSize: "1rem" }}>
              Answer is hidden. Click "Show Answer" below to reveal.
            </p>
          </div>
          
          <div className={`${styles['recall-card-answer-wrapper']} ${showAnswer ? styles['visible'] : ""}`}>
            <div className={styles['recall-card-answer-content']}>
              <p>
                {sessionCard?.answer || "Yes! Continue doing healthy breaks."}
              </p>
              
              <div className={styles['difficulty-section']}>
                <span className={styles['difficulty-label']}>DIFFICULTY RATING:</span>
                <div className={styles['difficulty-buttons']}>
                  <button
                    onClick={() => onUpdateMetadata && onUpdateMetadata(sessionCard.id, { difficulty: "easy" })}
                    className={`${styles['diff-btn']} ${styles['easy']} ${sessionCard?.metadata?.difficulty === "easy" ? styles['active'] : ""}`}
                  >
                    Easy
                  </button>
                  <button
                    onClick={() => onUpdateMetadata && onUpdateMetadata(sessionCard.id, { difficulty: "medium" })}
                    className={`${styles['diff-btn']} ${styles['medium']} ${sessionCard?.metadata?.difficulty === "medium" ? styles['active'] : ""}`}
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => onUpdateMetadata && onUpdateMetadata(sessionCard.id, { difficulty: "hard" })}
                    className={`${styles['diff-btn']} ${styles['hard']} ${sessionCard?.metadata?.difficulty === "hard" ? styles['active'] : ""}`}
                  >
                    Hard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles['recall-card-footer']}>
        {sessionCard?.source ? (
          <button 
            className={styles['recall-source-btn']}
            data-purpose="source-link"
            onClick={handleOpenSource}
            title="Open source documentation"
          >
            View Source
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
          <button 
            className={`${styles['recall-primary-btn']} ${styles['success']}`}
            data-purpose="primary-action"
            onClick={() => onCompleteBreak("done")}
          >
            Done Session
            <CheckIcon className={styles['btn-check-icon']} />
          </button>
        )}
      </div>
    </section>
  );
}
