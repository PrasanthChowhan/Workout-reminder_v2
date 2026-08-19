import React from 'react';
import styles from './Toast.module.css';
import { CheckIcon, AlertCircleIcon, InfoIcon, CopyIcon } from './ui/Icons';
import { toast } from '../utils/toast';

export const ToastContainer = ({ toasts, onCloseToast }) => {
  if (!toasts || toasts.length === 0) return null;

  const handleCopy = (e, text) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className={styles['toast-container']}>
      {toasts.map((t) => (
        <div 
          key={t.id} 
          className={`${styles['toast']} ${styles[t.type] || ''}`}
          onClick={() => onCloseToast(t.id)}
        >
          <div className={styles['toast-body']}>
            {t.type === "success" ? (
              <CheckIcon className={`${styles['toast-icon']} ${styles['success']}`} width={18} height={18} strokeWidth={3} />
            ) : t.type === "error" ? (
              <AlertCircleIcon className={`${styles['toast-icon']} ${styles['error']}`} width={18} height={18} strokeWidth={2.5} />
            ) : (
              <InfoIcon className={`${styles['toast-icon']} ${styles['info']}`} width={18} height={18} strokeWidth={2.5} />
            )}
            <span className={styles['toast-message']}>{t.message}</span>
          </div>
          {t.type === "error" && (
            <button 
              className={styles['toast-copy-btn']}
              onClick={(e) => handleCopy(e, t.message)}
              title="Copy to clipboard"
            >
              <CopyIcon width={16} height={16} />
            </button>
          )}
          <button className={styles['toast-close-btn']}>&times;</button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
