import React, { useState, useEffect } from "react";
import { invoke } from "../../utils/tauri";
import buttonStyles from "../../styles/buttons.module.css";

export default function GeneralTab({ settingsForm, setSettingsForm, parentStyles }) {
  const [reminderState, setReminderState] = useState({ type: "Active" });
  const [snoozeMins, setSnoozeMins] = useState("30");

  const fetchReminderState = async () => {
    try {
      const state = await invoke("get_timer_state");
      setReminderState(state.reminder_state);
    } catch (e) {
      console.error("Failed to fetch timer state", e);
    }
  };

  useEffect(() => {
    fetchReminderState();
  }, []);

  const handleSnooze = async () => {
    try {
      if (snoozeMins === "restart") {
        await invoke("snooze_until_restart");
      } else {
        await invoke("snooze_for", { minutes: parseInt(snoozeMins, 10) });
      }
      fetchReminderState();
      window.dispatchEvent(new CustomEvent("timer-state-changed"));
    } catch (e) {
      console.error("Snooze failed", e);
    }
  };

  const handlePauseIndefinitely = async () => {
    try {
      await invoke("pause_indefinitely");
      fetchReminderState();
      window.dispatchEvent(new CustomEvent("timer-state-changed"));
    } catch (e) {
      console.error("Pause failed", e);
    }
  };

  const handleResume = async () => {
    try {
      await invoke("resume_reminders");
      fetchReminderState();
      window.dispatchEvent(new CustomEvent("timer-state-changed"));
    } catch (e) {
      console.error("Resume failed", e);
    }
  };

  const getStatusText = () => {
    if (reminderState.type === "Active") {
      return "Active";
    }
    if (reminderState.type === "PausedManual") {
      return "Paused indefinitely";
    }
    if (reminderState.type === "PausedUntilRestart") {
      return "Snoozed until next restart";
    }
    if (reminderState.type === "PausedUntil" && reminderState.until) {
      const dt = new Date(reminderState.until);
      return `Snoozed until ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return "Unknown";
  };

  const isSnoozedOrPaused = reminderState.type !== "Active";

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

      <div className={parentStyles['settings-group']} style={{ marginTop: "2rem" }}>
        <h3 className={parentStyles['settings-group-title']}>Reminders Control</h3>
        <div className={parentStyles['settings-field']} style={{ marginBottom: "1rem" }}>
          <label className={parentStyles['settings-label']}>Current Status</label>
          <span style={{ 
            fontFamily: "var(--font-mono)", 
            color: isSnoozedOrPaused ? "var(--color-brand-orange)" : "#10B981",
            fontWeight: "bold"
          }}>
            {getStatusText()}
          </span>
        </div>

        {isSnoozedOrPaused ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className={parentStyles['settings-field']}>
              <button 
                type="button" 
                className={buttonStyles['primary-btn']}
                onClick={handleResume}
              >
                Resume Reminders
              </button>
            </div>
            
            <p className={parentStyles['settings-item-desc']}>
              Override current status:
            </p>
          </div>
        ) : null}

        <div className={parentStyles['settings-field']} style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", marginTop: "0.5rem" }}>
          <select 
            value={snoozeMins} 
            onChange={(e) => setSnoozeMins(e.target.value)}
            className={parentStyles['settings-input']}
            style={{ width: "160px" }}
          >
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="120">2 hours</option>
            <option value="restart">Until restart</option>
          </select>

          <button 
            type="button" 
            className={buttonStyles['secondary-btn']} 
            onClick={handleSnooze}
          >
            Snooze
          </button>

          <button 
            type="button" 
            className={buttonStyles['secondary-btn']}
            onClick={handlePauseIndefinitely}
          >
            Pause Indefinitely
          </button>
        </div>
      </div>

      <div className={parentStyles['settings-group']} style={{ marginTop: "2rem" }}>
        <h3 className={parentStyles['settings-group-title']}>Daily Accountability Check-in</h3>
        
        <div className={`${parentStyles['settings-field']} ${parentStyles['checkbox-field']}`}>
          <label className={parentStyles['settings-label']}>Enable mandatory daily accountability check-in</label>
          <input
            type="checkbox"
            className={parentStyles['settings-checkbox']}
            checked={!!settingsForm.daily_prompt_enabled}
            onChange={(e) => {
              const checked = e.target.checked;
              if (checked) {
                const confirmEnable = window.confirm(
                  "Enable Daily Accountability Check-in?\n\nYou will be required to answer your daily question before using the app each day.\n\nThis can be disabled later from Settings."
                );
                if (confirmEnable) {
                  setSettingsForm({ ...settingsForm, daily_prompt_enabled: true });
                }
              } else {
                setSettingsForm({ ...settingsForm, daily_prompt_enabled: false });
              }
            }}
          />
        </div>
        <p className={parentStyles['settings-item-desc']} style={{ marginTop: "0.5rem", marginBottom: "1.5rem" }}>
          When enabled, the app will require you to answer this question once per day before using the application. This is intended as a self-imposed accountability tool.
        </p>

        {settingsForm.daily_prompt_enabled && (
          <div className={parentStyles['settings-field']} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-start" }}>
            <label className={parentStyles['settings-label']}>Question:</label>
            <input
              type="text"
              className={parentStyles['settings-input']}
              style={{ width: "100%", maxWidth: "400px", textAlign: "left" }}
              value={settingsForm.daily_prompt || ""}
              onChange={(e) => setSettingsForm({ ...settingsForm, daily_prompt: e.target.value })}
              placeholder="e.g. Have you read the book of king?"
            />
          </div>
        )}
      </div>
    </div>
  );
}
