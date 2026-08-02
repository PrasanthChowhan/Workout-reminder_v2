import React from "react";
import { openUrl } from "../utils/tauri";
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
  onCompleteBreak 
 }) {
  const handleOpenSource = () => {
    if (sessionCard?.source) {
      openUrl(sessionCard.source);
    }
  };

  return (
    <section className={`active-break-card ${styles['recall-card']}`} data-purpose="primary-session-card">
      <div className={styles['recall-card-top']}>
        <div className={styles['recall-card-header']}>
          <span className={styles['recall-card-title-label']}>Active Recall Session</span>
          <button className={styles['recall-help-btn']} title="Help / Tips">
            <svg className={styles['help-icon']} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <path d="M12 17h.01"></path>
            </svg>
          </button>
        </div>
        <div className={styles['recall-card-body']}>
          <span className={styles['recall-card-category']}>
            {sessionCard?.category || "GENERAL"}
          </span>
          <h2 className={styles['recall-card-question']}>
            {sessionCard?.question || "Are both study and body break concepts clear?"}
          </h2>
          
          {showAnswer ? (
            <div className={`${styles['recall-card-answer']} ${styles['visible']}`}>
              <p>
                {sessionCard?.answer || "Yes! Continue doing healthy breaks."}
              </p>
            </div>
          ) : (
            <div className={styles['recall-card-answer']} style={{ display: "block" }}>
              <p style={{ opacity: 0.4, fontStyle: "italic", fontSize: "1rem" }}>
                Answer is hidden. Click "Show Answer" below to reveal.
              </p>
            </div>
          )}
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
            <svg className={styles['source-icon']} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" x2="21" y1="14" y2="3"></line>
            </svg>
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
            <svg className={styles['btn-arrow-icon']} fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" viewBox="0 0 24 24">
              <line x1="5" x2="19" y1="12" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        ) : (
          <button 
            className={`${styles['recall-primary-btn']} ${styles['success']}`}
            data-purpose="primary-action"
            onClick={() => onCompleteBreak("done")}
          >
            Done Session
            <svg className={styles['btn-check-icon']} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
        )}
      </div>
    </section>
  );
}
