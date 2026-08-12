import React, { useState } from "react";
import { toast } from "../../utils/toast";
import { TrashIcon } from "../ui/Icons";
import styles from "./PromptsTab.module.css";
import formStyles from "../../styles/forms.module.css";

/**
 * PromptsTab renders the reflection prompts CRUD list.
 * 
 * @param {object} props
 * @param {Array} props.editablePrompts List of reflection prompt strings
 * @param {function} props.setEditablePrompts Callback to update reflection prompts list
 */
export default function PromptsTab({ editablePrompts, setEditablePrompts }) {
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
    <div className={styles['tab-pane']}>
      <div className={`${styles['settings-add-form']} ${formStyles['flex-row']}`}>
        <input 
          type="text" 
          placeholder="New reflection prompt..." 
          className={styles['settings-input-text']} 
          value={newPrompt}
          onChange={(e) => setNewPrompt(e.target.value)}
        />
        <button type="button" className={styles['settings-add-btn']} onClick={handleAddPrompt}>
          Add Prompt
        </button>
      </div>

      <div className={styles['settings-items-list']}>
        {editablePrompts.map((prompt, index) => (
          <div key={index} className={styles['settings-list-item']}>
            <span className={styles['settings-item-text']}>{prompt}</span>
            <button 
              type="button" 
              className={styles['settings-item-delete']} 
              onClick={() => handleDeletePrompt(index)} 
              title="Delete Prompt"
            >
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
