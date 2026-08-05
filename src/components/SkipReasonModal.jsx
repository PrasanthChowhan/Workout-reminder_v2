import React, { useState } from "react";
import { CloseIcon, CheckIcon } from "./ui/Icons";
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
  const [submitState, setSubmitState] = useState("idle");

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!skipReason.trim() || submitState !== "idle") return;

    setSubmitState("submitting");

    // Simulate slight delay for interaction feedback before closing
    setTimeout(() => {
      setSubmitState("submitted");
      setTimeout(() => {
        onSubmit(skipReason.trim());
      }, 500); // 500ms to show the "Skipped" text before closing
    }, 200);
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
            <CloseIcon width={20} height={20} />
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
          
          <button type="submit" className={`${styles['skip-reason-submit-btn']} ${submitState === 'submitted' ? styles['submitted'] : ''}`} disabled={submitState !== "idle"}>
            {submitState === 'submitting' ? (
              <span>Logging...</span>
            ) : submitState === 'submitted' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <span>Skipped</span>
                <CheckIcon width={14} height={14} />
              </div>
            ) : (
              <span>Confirm Skip & Exit</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
