import React, { useEffect, useRef, useState } from "react";
import { invoke } from "../utils/tauri";
import { SettingsIcon } from "./ui/Icons";
import styles from "./DailyAccountabilityModal.module.css";

export default function DailyAccountabilityModal({ isOpen, questionText, onAnswered, onOpenSettings }) {
  const modalRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);

  // Focus trap implementation and prevention of escape key
  useEffect(() => {
    if (!isOpen) return;

    // Prevent body scrolling
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        // Block Escape key completely
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    const focusableElementsString = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const modalElement = modalRef.current;
    
    // Find all focusable elements inside modal
    const focusableElements = Array.from(modalElement.querySelectorAll(focusableElementsString));
    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements[focusableElements.length - 1];

    if (firstFocusableElement) {
      firstFocusableElement.focus();
    } else {
      modalElement.focus();
    }

    const handleTabKey = (e) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) { // Shift + Tab
        if (document.activeElement === firstFocusableElement) {
          lastFocusableElement.focus();
          e.preventDefault();
        }
      } else { // Tab
        if (document.activeElement === lastFocusableElement) {
          firstFocusableElement.focus();
          e.preventDefault();
        }
      }
    };

    modalElement.addEventListener("keydown", handleTabKey);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      if (modalElement) {
        modalElement.removeEventListener("keydown", handleTabKey);
      }
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAnswer = async (answer) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await invoke("submit_daily_question_response", { response: answer });
      onAnswered();
    } catch (e) {
      console.error("Failed to submit response:", e);
      alert("Failed to save response. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="daily-checkin-title">
      <div 
        ref={modalRef} 
        className={styles.container}
        tabIndex="-1"
      >
        {onOpenSettings && (
          <button 
            type="button" 
            className={styles.settingsBtn} 
            onClick={onOpenSettings} 
            title="Open Settings"
          >
            <SettingsIcon width={18} height={18} />
          </button>
        )}
        <div id="daily-checkin-title" className={styles.title}>
          Daily Accountability Check-in
        </div>
        <div className={styles.question}>
          {questionText || "Have you read the book of king?"}
        </div>
        <div className={styles.buttons}>
          <button 
            type="button" 
            className={styles.yesBtn} 
            disabled={submitting}
            onClick={() => handleAnswer("yes")}
          >
            {submitting ? "Saving..." : "YES"}
          </button>
          <button 
            type="button" 
            className={styles.noBtn} 
            disabled={submitting}
            onClick={() => handleAnswer("no")}
          >
            NO
          </button>
        </div>
      </div>
    </div>
  );
}
