import React, { useState } from "react";
import styles from "./SkipReasonModal.module.css";

/**
 * SkipReasonModal allows users to log the reason for skipping a break.
 * It encapsulates its own input state and options list.
 * 
 * @param {object} props
 * @param {function} props.onSubmit Callback receiving the finalized skip reason string
 * @param {function} props.onCancel Callback to cancel the modal overlay
 */
export default function SkipReasonModal({ onSubmit, onCancel }) {
  const [skipReason, setSkipReason] = useState("");

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!skipReason.trim()) return;
    onSubmit(skipReason.trim());
    setSkipReason("");
  };

  const presetReasons = [
    "Flow State / Deep Focus",
    "In a Meeting / Call",
    "Already Stretched / Walked",
    "Urgent Code Fix Required",
    "Away from Desk"
  ];

  return (
    <div className={styles['skip-reason-overlay']} onClick={onCancel}>
      <div className={styles['skip-reason-modal']} onClick={(e) => e.stopPropagation()}>
        <div className={styles['settings-header']} style={{ marginBottom: "1rem" }}>
          <h2 className={styles['skip-reason-title']}>Skip Session Reason</h2>
          <button 
            className={styles['settings-close-btn']} 
            onClick={onCancel}
            title="Cancel skipping"
          >
            <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" x2="6" y1="6" y2="18"></line>
              <line x1="6" x2="18" y1="6" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <p className={styles['skip-reason-subtitle']}>
          Logging the reason for skipping breaks helps track your focus habits and posture cycles.
        </p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className={styles['skip-reason-input']}
            placeholder="Or type a custom reason..."
            value={skipReason}
            onChange={(e) => setSkipReason(e.target.value)}
            autoFocus
            required
          />
          
          <div className={styles['skip-chips-container']}>
            {presetReasons.map((reason) => (
              <button
                key={reason}
                type="button"
                className={`${styles['skip-chip']} ${skipReason === reason ? styles['active'] : ""}`}
                onClick={() => setSkipReason(reason)}
              >
                {reason}
              </button>
            ))}
          </div>
          
          <button type="submit" className={styles['skip-reason-submit-btn']}>
            Confirm Skip & Exit
          </button>
        </form>
      </div>
    </div>
  );
}
