import React from "react";

export default function TimersTab({ settingsForm, setSettingsForm, parentStyles }) {
  return (
    <div className={parentStyles['tab-pane']}>
      <div className={parentStyles['settings-group']}>
        <h3 className={parentStyles['settings-group-title']}>Micro-Breaks</h3>
        <div className={`${parentStyles['settings-field']} ${parentStyles['checkbox-field']}`}>
          <label className={parentStyles['settings-label']}>Enable Micro-Breaks</label>
          <input
            type="checkbox"
            className={parentStyles['settings-checkbox']}
            checked={!!settingsForm.micro_break_enabled}
            onChange={(e) => setSettingsForm({ ...settingsForm, micro_break_enabled: e.target.checked })}
          />
        </div>
        {settingsForm.micro_break_enabled && (
          <>
            <div className={parentStyles['settings-field']} style={{ marginTop: "1rem" }}>
              <label className={parentStyles['settings-label']}>Interval (minutes)</label>
              <input
                type="number"
                className={parentStyles['settings-input']}
                value={settingsForm.micro_break_interval_mins}
                onChange={(e) => setSettingsForm({ ...settingsForm, micro_break_interval_mins: e.target.value })}
                min="1"
                required
              />
            </div>
            <div className={parentStyles['settings-field']} style={{ marginTop: "1rem" }}>
              <label className={parentStyles['settings-label']}>Duration (seconds)</label>
              <input
                type="number"
                className={parentStyles['settings-input']}
                value={settingsForm.micro_break_duration_secs}
                onChange={(e) => setSettingsForm({ ...settingsForm, micro_break_duration_secs: e.target.value })}
                min="5"
                required
              />
            </div>
          </>
        )}
      </div>
      
      <div className={parentStyles['settings-group']} style={{ marginTop: "1.5rem" }}>
        <h3 className={parentStyles['settings-group-title']}>Active Breaks</h3>
        <div className={parentStyles['settings-field']}>
          <label className={parentStyles['settings-label']}>Interval (minutes)</label>
          <input
            type="number"
            className={parentStyles['settings-input']}
            value={settingsForm.active_break_interval_mins}
            onChange={(e) => setSettingsForm({ ...settingsForm, active_break_interval_mins: e.target.value })}
            min="1"
            required
          />
        </div>
        <div className={parentStyles['settings-field']} style={{ marginTop: "1rem" }}>
          <label className={parentStyles['settings-label']}>Duration (minutes)</label>
          <input
            type="number"
            className={parentStyles['settings-input']}
            value={settingsForm.active_break_duration_mins}
            onChange={(e) => setSettingsForm({ ...settingsForm, active_break_duration_mins: e.target.value })}
            min="1"
            required
          />
        </div>
      </div>
    </div>
  );
}
