import React, { useState } from "react";
import { toast } from "../../utils/toast";

/**
 * PromptsTab renders the reflection prompts CRUD list.
 * 
 * @param {object} props
 * @param {Array} props.editablePrompts List of reflection prompt strings
 * @param {function} props.setEditablePrompts Callback to update reflection prompts list
 * @param {object} props.styles Parent settings CSS module styles object
 */
export default function PromptsTab({ editablePrompts, setEditablePrompts, styles }) {
  const [newPrompt, setNewPrompt] = useState("");

  const handleAddPrompt = () => {
    if (!newPrompt.trim()) return;
    setEditablePrompts([...editablePrompts, newPrompt.trim()]);
    setNewPrompt("");
    toast.success("Reflection prompt added successfully!");
  };

  const handleDeletePrompt = (indexToDelete) => {
    setEditablePrompts(editablePrompts.filter((_, idx) => idx !== indexToDelete));
    toast.info("Reflection prompt deleted.");
  };

  return (
    <div className={styles['tab-pane'] || "tab-pane"}>
      <div className={`${styles['settings-add-form']} ${styles['flex-row']}`}>
        <input 
          type="text" 
          placeholder="New reflection prompt..." 
          className={styles['settings-input-text']} 
          value={newPrompt}
          onChange={(e) => setNewPrompt(e.target.value)}
        />
        <button type="button" className={styles['settings-add-btn']} onClick={handleAddPrompt}>Add Prompt</button>
      </div>

      <div className={styles['settings-items-list']}>
        {editablePrompts.map((prompt, index) => (
          <div key={index} className={styles['settings-list-item']}>
            <span className={styles['settings-item-text']}>{prompt}</span>
            <button type="button" className={styles['settings-item-delete']} onClick={() => handleDeletePrompt(index)} title="Delete Prompt">
              <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
