import React, { useState } from "react";
import TracksTab from "./TracksTab";
import CardsTab from "./CardsTab";
import PromptsTab from "./PromptsTab";
import StretchesTab from "./StretchesTab";

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
    <div className="settings-overlay" onClick={onCancel}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2 className="settings-title">Configuration</h2>
          <button className="settings-close-btn" onClick={onCancel} title="Close Settings">
            <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" x2="6" y1="6" y2="18"></line>
              <line x1="6" x2="18" y1="6" y2="18"></line>
            </svg>
          </button>
        </div>
        
        {/* Tab navigation */}
        <div className="settings-tabs">
          <button 
            type="button" 
            className={`settings-tab-btn ${activeTab === "general" ? "active" : ""}`}
            onClick={() => setActiveTab("general")}
          >
            General
          </button>
          <button 
            type="button" 
            className={`settings-tab-btn ${activeTab === "timers" ? "active" : ""}`}
            onClick={() => setActiveTab("timers")}
          >
            Timers
          </button>
          <button 
            type="button" 
            className={`settings-tab-btn ${activeTab === "tracks" ? "active" : ""}`}
            onClick={() => setActiveTab("tracks")}
          >
            Physical Tracks
          </button>
          <button 
            type="button" 
            className={`settings-tab-btn ${activeTab === "cards" ? "active" : ""}`}
            onClick={() => setActiveTab("cards")}
          >
            Recall Cards
          </button>
          <button 
            type="button" 
            className={`settings-tab-btn ${activeTab === "prompts" ? "active" : ""}`}
            onClick={() => setActiveTab("prompts")}
          >
            Reflection Prompts
          </button>
          <button 
            type="button" 
            className={`settings-tab-btn ${activeTab === "stretches" ? "active" : ""}`}
            onClick={() => setActiveTab("stretches")}
          >
            Stretches
          </button>
        </div>

        <form onSubmit={handleSaveSettings} className="settings-form">
          <div className="settings-tab-content">
            {activeTab === "general" && (
              <div className="tab-pane">
                <div className="settings-group">
                  <h3 className="settings-group-title">System Settings</h3>
                  <div className="settings-field checkbox-field">
                    <label className="settings-label">Run at Startup</label>
                    <input
                      type="checkbox"
                      className="settings-checkbox"
                      checked={settingsForm.run_at_start}
                      onChange={(e) => setSettingsForm({ ...settingsForm, run_at_start: e.target.checked })}
                    />
                  </div>
                  <p className="settings-item-desc" style={{ marginTop: "0.5rem" }}>
                    Automatically launch Workout & Break Reminder when you log into Windows.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "timers" && (
              <div className="tab-pane">
                <div className="settings-group">
                  <h3 className="settings-group-title">Micro-Breaks</h3>
                  <div className="settings-field">
                    <label className="settings-label">Interval (minutes)</label>
                    <input
                      type="number"
                      className="settings-input"
                      value={settingsForm.micro_break_interval_mins}
                      onChange={(e) => setSettingsForm({ ...settingsForm, micro_break_interval_mins: e.target.value })}
                      min="1"
                      required
                    />
                  </div>
                  <div className="settings-field" style={{ marginTop: "1rem" }}>
                    <label className="settings-label">Duration (seconds)</label>
                    <input
                      type="number"
                      className="settings-input"
                      value={settingsForm.micro_break_duration_secs}
                      onChange={(e) => setSettingsForm({ ...settingsForm, micro_break_duration_secs: e.target.value })}
                      min="5"
                      required
                    />
                  </div>
                </div>
                
                <div className="settings-group" style={{ marginTop: "1.5rem" }}>
                  <h3 className="settings-group-title">Active Breaks</h3>
                  <div className="settings-field">
                    <label className="settings-label">Interval (minutes)</label>
                    <input
                      type="number"
                      className="settings-input"
                      value={settingsForm.active_break_interval_mins}
                      onChange={(e) => setSettingsForm({ ...settingsForm, active_break_interval_mins: e.target.value })}
                      min="1"
                      required
                    />
                  </div>
                  <div className="settings-field" style={{ marginTop: "1rem" }}>
                    <label className="settings-label">Duration (seconds)</label>
                    <input
                      type="number"
                      className="settings-input"
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
              />
            )}

            {activeTab === "cards" && (
              <CardsTab 
                editableCards={editableCards}
                setEditableCards={setEditableCards}
              />
            )}

            {activeTab === "prompts" && (
              <PromptsTab 
                editablePrompts={editablePrompts}
                setEditablePrompts={setEditablePrompts}
              />
            )}

            {activeTab === "stretches" && (
              <StretchesTab 
                editableStretches={editableStretches}
                setEditableStretches={setEditableStretches}
              />
            )}
          </div>
          
          <div className="settings-footer">
            <button type="button" className="settings-cancel-btn" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="settings-save-btn">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
