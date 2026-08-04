import React, { useState } from "react";
import TracksTab from "./TracksTab";
import CardsTab from "./CardsTab";
import PromptsTab from "./PromptsTab";
import StretchesTab from "./StretchesTab";
import styles from "./SettingsModal.module.css";

const tabs = [
  {
    id: "general",
    label: "General",
    icon: (
      <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    )
  },
  {
    id: "timers",
    label: "Timers",
    icon: (
      <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    )
  },
  {
    id: "tracks",
    label: "Physical Tracks",
    icon: (
      <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    )
  },
  {
    id: "cards",
    label: "Recall Cards",
    icon: (
      <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    )
  },
  {
    id: "prompts",
    label: "Reflection Prompts",
    icon: (
      <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    )
  },
  {
    id: "stretches",
    label: "Stretches",
    icon: (
      <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="5" r="1" />
        <path d="m9 22 2-6h2l2 6" />
        <path d="M12 16v-6" />
        <path d="M7 12h10" />
      </svg>
    )
  },
  {
    id: "about",
    label: "About & Legal",
    icon: (
      <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" x2="12" y1="16" y2="12" />
        <line x1="12" x2="12.01" y1="8" y2="8" />
      </svg>
    )
  }
];

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem("settings_sidebar_collapsed");
      return saved === "true";
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem("settings_sidebar_collapsed", String(next));
      } catch (e) {}
      return next;
    });
  };

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
      <div className={`${styles['settings-modal']} ${isSidebarCollapsed ? styles['sidebar-collapsed'] : ""}`} onClick={(e) => e.stopPropagation()}>
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
        <div className={`${styles['settings-tabs']} ${isSidebarCollapsed ? styles['collapsed'] : ""}`}>
          <div className={styles['sidebar-header']}>
            <button 
              type="button" 
              className={styles['sidebar-toggle-btn']} 
              onClick={toggleSidebar}
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? (
                <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              ) : (
                <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              )}
            </button>
          </div>
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              type="button" 
              className={`${styles['settings-tab-btn']} ${activeTab === tab.id ? styles['active'] : ""}`}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
            >
              <span className={styles['tab-icon']}>{tab.icon}</span>
              <span className={styles['tab-label']}>{tab.label}</span>
            </button>
          ))}
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
