import React, { useState } from "react";

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
  };

  const handleDeleteStretch = (name) => {
    setEditableStretches(editableStretches.filter(s => s.name !== name));
  };

  return (
    <div className="tab-pane">
      <div className="settings-add-form">
        <h3 className="settings-group-title" style={{ marginTop: 0, borderBottom: "none" }}>Add Guided Stretch</h3>
        <div className="add-form-row">
          <input 
            type="text" 
            placeholder="Stretch Name (e.g., Wrist Stretch)" 
            className="settings-input-text" 
            value={newStretch.name}
            onChange={(e) => setNewStretch({ ...newStretch, name: e.target.value })}
          />
          <input 
            type="number" 
            placeholder="Secs" 
            className="settings-input-text duration" 
            value={newStretch.duration_secs}
            onChange={(e) => setNewStretch({ ...newStretch, duration_secs: e.target.value })}
            min="5"
          />
        </div>
        <div className="add-form-row" style={{ marginTop: "0.5rem" }}>
          <input 
            type="text" 
            placeholder="Instructions/Description" 
            className="settings-input-text" 
            value={newStretch.description}
            onChange={(e) => setNewStretch({ ...newStretch, description: e.target.value })}
          />
          <button type="button" className="settings-add-btn" onClick={handleAddStretch}>Add Stretch</button>
        </div>
      </div>

      <div className="settings-items-list">
        {editableStretches.map((stretch) => (
          <div key={stretch.name} className="settings-list-item">
            <div className="settings-item-info">
              <h4 className="settings-item-title">{stretch.name} ({stretch.duration_secs}s)</h4>
              <p className="settings-item-desc">{stretch.description}</p>
            </div>
            <button type="button" className="settings-item-delete" onClick={() => handleDeleteStretch(stretch.name)} title="Delete Stretch">
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
