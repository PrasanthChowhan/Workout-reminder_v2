import React, { useEffect, useRef } from 'react';
import styles from './Modal.module.css';
import { CloseIcon } from './Icons';

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  showCloseButton = true,
  ariaLabelledby = 'modal-title'
}) => {
  const modalRef = useRef(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Focus trap implementation
  useEffect(() => {
    if (!isOpen) return;

    const focusableElementsString = 'button, [href], input, select, textarea, [tabindex]:not([-1])';
    const modalElement = modalRef.current;
    
    // Find all focusable elements inside modal
    const focusableElements = Array.from(modalElement.querySelectorAll(focusableElementsString));
    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements[focusableElements.length - 1];

    // Initial focus on modal content/first element
    if (firstFocusableElement) {
      firstFocusableElement.focus();
    } else {
      modalElement.focus();
    }

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

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

    modalElement.addEventListener('keydown', handleTabKey);
    return () => {
      modalElement.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles['modal-overlay']} onClick={onClose}>
      <div 
        ref={modalRef}
        className={styles['modal-container']} 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? ariaLabelledby : undefined}
        tabIndex="-1"
      >
        <div className={styles['modal-header']}>
          {title && <h2 id={ariaLabelledby} className={styles['modal-title']}>{title}</h2>}
          {showCloseButton && (
            <button 
              type="button"
              className={styles['modal-close-btn']} 
              onClick={onClose}
              title="Close dialog"
            >
              <CloseIcon width={20} height={20} />
            </button>
          )}
        </div>
        <div className={styles['modal-body']}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
