import React, { useState } from "react";
import TracksTab from "./TracksTab";
import CardsTab from "./CardsTab";
import PromptsTab from "./PromptsTab";
import StretchesTab from "./StretchesTab";
import styles from "./SettingsModal.module.css";

/**
 * SettingsModal is the configuration modal orchestration overlay.
 * It manages local draft settings states and updates the parent configuration onSave.
 * 
 * @param {object} props
 * @param {object} props.config Current application configuration from the orchestrator
 * @param {function} props.onSave Callback with finalized, validated settings payload
 * @param {function} props.onCancel Callback to close and discard settings changes
 */
export default function SettingsModal({ config, onSave, onCancel }) {
  const [activeTab, setActiveTab] = useState("general");
  const [draftConfig, setDraftConfig] = useState(config);

  // Local settings drafts
  const [settingsForm, setSettingsForm] = useState({
    micro_break_interval_mins: config?.settings?.micro_break_interval_mins ?? 20,
    active_break_interval_mins: config?.settings?.active_break_interval_mins ?? 50,
    micro_break_duration_secs: config?.settings?.micro_break_duration_secs ?? 20,
    active_break_duration_secs: config?.settings?.active_break_duration_secs ?? 300,
    run_at_start: config?.settings?.run_at_start ?? false,
  });

  const [editableCards, setEditableCards] = useState(config?.active_recall_cards || []);
  const [editablePrompts, setEditablePrompts] = useState(config?.reflection_prompts || []);
  const [editableStretches, setEditableStretches] = useState(config?.stretches || []);
  
  const [settingsProgress, setSettingsProgress] = useState(config?.user_progress || {
    active_track_id: null,
    current_level_number: null,
    onboarding_tier: null,
    completed_sessions_count: 0,
    last_completed_at: null,
    level_started_at: null
  });

  const handleSaveSettings = (e) => {
    if (e) e.preventDefault();
    if (!draftConfig) return;

    // Strict validation/sanitation of integer fields to prevent NaN or negative numbers
    const micro_break_interval_mins = Math.max(1, Math.round(Number(settingsForm.micro_break_interval_mins)) || 20);
    const active_break_interval_mins = Math.max(1, Math.round(Number(settingsForm.active_break_interval_mins)) || 50);
    const micro_break_duration_secs = Math.max(5, Math.round(Number(settingsForm.micro_break_duration_secs)) || 20);
    const active_break_duration_secs = Math.max(10, Math.round(Number(settingsForm.active_break_duration_secs)) || 300);

    const finalizedConfig = {
      ...draftConfig,
      settings: {
        micro_break_interval_mins,
        active_break_interval_mins,
        micro_break_duration_secs,
        active_break_duration_secs,
        run_at_start: !!settingsForm.run_at_start,
      },
      active_recall_cards: editableCards,
      reflection_prompts: editablePrompts,
      stretches: editableStretches,
      user_progress: settingsProgress
    };

    onSave(finalizedConfig);
  };

  return (
    <div className={styles['settings-overlay']} onClick={onCancel}>
      <div className={styles['settings-modal']} onClick={(e) => e.stopPropagation()}>
        <div className={styles['settings-header']}>
          <h2 className={styles['settings-title']}>Configuration</h2>
          <button className={styles['settings-close-btn']} onClick={onCancel} title="Close Settings">
            <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" x2="6" y1="6" y2="18"></line>
              <line x1="6" x2="18" y1="6" y2="18"></line>
            </svg>
          </button>
        </div>
        
        {/* Tab navigation */}
        <div className={styles['settings-tabs']}>
          <button 
            type="button" 
            className={`${styles['settings-tab-btn']} ${activeTab === "general" ? styles['active'] : ""}`}
            onClick={() => setActiveTab("general")}
          >
            General
          </button>
          <button 
            type="button" 
            className={`${styles['settings-tab-btn']} ${activeTab === "timers" ? styles['active'] : ""}`}
            onClick={() => setActiveTab("timers")}
          >
            Timers
          </button>
          <button 
            type="button" 
            className={`${styles['settings-tab-btn']} ${activeTab === "tracks" ? styles['active'] : ""}`}
            onClick={() => setActiveTab("tracks")}
          >
            Physical Tracks
          </button>
          <button 
            type="button" 
            className={`${styles['settings-tab-btn']} ${activeTab === "cards" ? styles['active'] : ""}`}
            onClick={() => setActiveTab("cards")}
          >
            Recall Cards
          </button>
          <button 
            type="button" 
            className={`${styles['settings-tab-btn']} ${activeTab === "prompts" ? styles['active'] : ""}`}
            onClick={() => setActiveTab("prompts")}
          >
            Reflection Prompts
          </button>
          <button 
            type="button" 
            className={`${styles['settings-tab-btn']} ${activeTab === "stretches" ? styles['active'] : ""}`}
            onClick={() => setActiveTab("stretches")}
          >
            Stretches
          </button>
          <button 
            type="button" 
            className={`${styles['settings-tab-btn']} ${activeTab === "about" ? styles['active'] : ""}`}
            onClick={() => setActiveTab("about")}
          >
            About & Legal
          </button>
        </div>

        <form onSubmit={handleSaveSettings} className={styles['settings-form']}>
          <div className={styles['settings-tab-content']}>
            {activeTab === "general" && (
              <div className={styles['tab-pane']}>
                <div className={styles['settings-group']}>
                  <h3 className={styles['settings-group-title']}>System Settings</h3>
                  <div className={`${styles['settings-field']} ${styles['checkbox-field']}`}>
                    <label className={styles['settings-label']}>Run at Startup</label>
                    <input
                      type="checkbox"
                      className={styles['settings-checkbox']}
                      checked={settingsForm.run_at_start}
                      onChange={(e) => setSettingsForm({ ...settingsForm, run_at_start: e.target.checked })}
                    />
                  </div>
                  <p className={styles['settings-item-desc']} style={{ marginTop: "0.5rem" }}>
                    Automatically launch Workout & Break Reminder when you log into Windows.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "timers" && (
              <div className={styles['tab-pane']}>
                <div className={styles['settings-group']}>
                  <h3 className={styles['settings-group-title']}>Micro-Breaks</h3>
                  <div className={styles['settings-field']}>
                    <label className={styles['settings-label']}>Interval (minutes)</label>
                    <input
                      type="number"
                      className={styles['settings-input']}
                      value={settingsForm.micro_break_interval_mins}
                      onChange={(e) => setSettingsForm({ ...settingsForm, micro_break_interval_mins: e.target.value })}
                      min="1"
                      required
                    />
                  </div>
                  <div className={styles['settings-field']} style={{ marginTop: "1rem" }}>
                    <label className={styles['settings-label']}>Duration (seconds)</label>
                    <input
                      type="number"
                      className={styles['settings-input']}
                      value={settingsForm.micro_break_duration_secs}
                      onChange={(e) => setSettingsForm({ ...settingsForm, micro_break_duration_secs: e.target.value })}
                      min="5"
                      required
                    />
                  </div>
                </div>
                
                <div className={styles['settings-group']} style={{ marginTop: "1.5rem" }}>
                  <h3 className={styles['settings-group-title']}>Active Breaks</h3>
                  <div className={styles['settings-field']}>
                    <label className={styles['settings-label']}>Interval (minutes)</label>
                    <input
                      type="number"
                      className={styles['settings-input']}
                      value={settingsForm.active_break_interval_mins}
                      onChange={(e) => setSettingsForm({ ...settingsForm, active_break_interval_mins: e.target.value })}
                      min="1"
                      required
                    />
                  </div>
                  <div className={styles['settings-field']} style={{ marginTop: "1rem" }}>
                    <label className={styles['settings-label']}>Duration (seconds)</label>
                    <input
                      type="number"
                      className={styles['settings-input']}
                      value={settingsForm.active_break_duration_secs}
                      onChange={(e) => setSettingsForm({ ...settingsForm, active_break_duration_secs: e.target.value })}
                      min="10"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "tracks" && (
              <TracksTab 
                appConfig={draftConfig}
                setAppConfig={setDraftConfig}
                settingsProgress={settingsProgress}
                setSettingsProgress={setSettingsProgress}
                parentStyles={styles}
              />
            )}

            {activeTab === "cards" && (
              <CardsTab 
                editableCards={editableCards}
                setEditableCards={setEditableCards}
                styles={styles}
              />
            )}

            {activeTab === "prompts" && (
              <PromptsTab 
                editablePrompts={editablePrompts}
                setEditablePrompts={setEditablePrompts}
                styles={styles}
              />
            )}

            {activeTab === "stretches" && (
              <StretchesTab 
                editableStretches={editableStretches}
                setEditableStretches={setEditableStretches}
                styles={styles}
              />
            )}

            {activeTab === "about" && (
              <div className={styles['tab-pane']}>
                <div className={styles['settings-group']}>
                  <h3 className={styles['settings-group-title']}>Workout & Break Reminder</h3>
                  <p className={styles['settings-item-desc']}>
                    A cognitive companion to help you stay physically active and mentally focused.
                  </p>
                </div>

                <div className={styles['settings-group']} style={{ marginTop: "1.5rem" }}>
                  <h3 className={styles['settings-group-title']}>Medical & Liability Waiver</h3>
                  <p className={styles['settings-item-desc']} style={{ fontSize: "0.75rem", lineHeight: "1.5", color: "var(--color-text-muted)" }}>
                    <strong>NOTICE:</strong> The stretches and exercises suggested by this app are for informational/educational purposes only. They are not a substitute for professional medical advice. Consult a physician before performing them. By continuing, you agree that you participate at your own risk and release the creators from any liability.
                  </p>
                </div>

                <div className={styles['settings-group']} style={{ marginTop: "1.5rem" }}>
                  <h3 className={styles['settings-group-title']}>YouTube Content Attribution</h3>
                  <p className={styles['settings-item-desc']} style={{ fontSize: "0.75rem", lineHeight: "1.5", color: "var(--color-text-muted)" }}>
                    All exercise demonstration videos are streamed directly from YouTube using the official embed API. All trademarks, copyrights, and intellectual property in these videos belong strictly to their respective creators. This app is not affiliated with or endorsed by YouTube or the original creators.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className={styles['settings-footer']}>
            <button type="button" className={styles['settings-cancel-btn']} onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className={styles['settings-save-btn']}>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
