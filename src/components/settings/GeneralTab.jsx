import React from "react";

export default function GeneralTab({ settingsForm, setSettingsForm, parentStyles }) {
  return (
    <div className={parentStyles['tab-pane']}>
      <div className={parentStyles['settings-group']}>
        <h3 className={parentStyles['settings-group-title']}>System Settings</h3>
        <div className={`${parentStyles['settings-field']} ${parentStyles['checkbox-field']}`}>
          <label className={parentStyles['settings-label']}>Run at Startup</label>
          <input
            type="checkbox"
            className={parentStyles['settings-checkbox']}
            checked={settingsForm.run_at_start}
            onChange={(e) => setSettingsForm({ ...settingsForm, run_at_start: e.target.checked })}
          />
        </div>
        <p className={parentStyles['settings-item-desc']} style={{ marginTop: "0.5rem" }}>
          Automatically launch Workout & Break Reminder when you log into Windows.
        </p>
      </div>
    </div>
  );
}
