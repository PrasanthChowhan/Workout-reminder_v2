import React, { useState } from "react";
import { toast } from "../../utils/toast";
import { TrashIcon } from "../ui/Icons";
import styles from "./StretchesTab.module.css";
import formStyles from "../../styles/forms.module.css";

/**
 * StretchesTab renders the custom stretches CRUD list.
 * 
 * @param {object} props
 * @param {Array} props.editableStretches List of stretch objects
 * @param {function} props.setEditableStretches Callback to update stretches list
 */
export default function StretchesTab({ editableStretches, setEditableStretches }) {
  const [newStretch, setNewStretch] = useState({ name: "", description: "", duration_secs: 30 });

  const handleAddStretch = () => {
    if (!newStretch.name.trim() || !newStretch.description.trim()) return;
    const duration = Number(newStretch.duration_secs) || 30;
    const stretch = {
      name: newStretch.name.trim(),
      description: newStretch.description.trim(),
      duration_secs: duration,
      difficulty_level: "All Levels",
      sets: 2,
      reps: `Hold ${duration}s`
    };
    setEditableStretches([...editableStretches, stretch]);
    setNewStretch({ name: "", description: "", duration_secs: 30 });
    toast.success("Guided stretch added successfully!");
  };

  const handleDeleteStretch = (name) => {
    setEditableStretches(editableStretches.filter(s => s.name !== name));
    toast.info("Guided stretch deleted.");
  };

  return (
    <div className={styles['tab-pane']}>
      <div className={styles['settings-add-form']}>
        <h3 className={styles['settings-group-title']} style={{ marginTop: 0, borderBottom: "none" }}>
          Add Guided Stretch
        </h3>
        <div className={styles['add-form-row']}>
          <input 
            type="text" 
            placeholder="Stretch Name (e.g., Wrist Stretch)" 
            className={styles['settings-input-text']} 
            value={newStretch.name}
            onChange={(e) => setNewStretch({ ...newStretch, name: e.target.value })}
          />
          <input 
            type="number" 
            placeholder="Secs" 
            className={`${styles['settings-input-text']} ${formStyles['duration']}`}
            value={newStretch.duration_secs}
            onChange={(e) => setNewStretch({ ...newStretch, duration_secs: e.target.value })}
            min="5"
          />
        </div>
        <div className={styles['add-form-row']} style={{ marginTop: "0.5rem" }}>
          <input 
            type="text" 
            placeholder="Instructions/Description" 
            className={styles['settings-input-text']} 
            value={newStretch.description}
            onChange={(e) => setNewStretch({ ...newStretch, description: e.target.value })}
          />
          <button type="button" className={styles['settings-add-btn']} onClick={handleAddStretch}>
            Add Stretch
          </button>
        </div>
      </div>

      <div className={styles['settings-items-list']}>
        {editableStretches.map((stretch) => (
          <div key={stretch.name} className={styles['settings-list-item']}>
            <div className={styles['settings-item-info']}>
              <h4 className={styles['settings-item-title']}>
                {stretch.name} ({stretch.duration_secs}s)
              </h4>
              <p className={styles['settings-item-desc']}>{stretch.description}</p>
            </div>
            <button 
              type="button" 
              className={styles['settings-item-delete']} 
              onClick={() => handleDeleteStretch(stretch.name)} 
              title="Delete Stretch"
            >
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
