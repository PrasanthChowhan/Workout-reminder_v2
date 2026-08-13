import React, { useState } from "react";
import TracksTab from "./TracksTab";
import CardsTab from "./CardsTab";
import PromptsTab from "./PromptsTab";
import GeneralTab from "./GeneralTab";
import TimersTab from "./TimersTab";
import AboutTab from "./AboutTab";
import Progress from "../../pages/Progress";
import { SettingsIcon, TimersIcon, TracksIcon, CardsIcon, PromptsIcon, InfoIcon, CloseIcon, ChevronLeft, ChevronRight, ProfileIcon } from "../ui/Icons";
import styles from "./SettingsModal.module.css";

const tabs = [
  {
    id: "general",
    label: "General",
    icon: <SettingsIcon width={18} height={18} />
  },
  {
    id: "timers",
    label: "Timers",
    icon: <TimersIcon width={18} height={18} />
  },
  {
    id: "progress",
    label: "Progress Tracker",
    icon: <ProfileIcon width={18} height={18} />
  },
  {
    id: "tracks",
    label: "Physical Tracks",
    icon: <TracksIcon width={18} height={18} />
  },
  {
    id: "cards",
    label: "Recall Cards",
    icon: <CardsIcon width={18} height={18} />
  },
  {
    id: "prompts",
    label: "Reflection Prompts",
    icon: <PromptsIcon width={18} height={18} />
  },
  {
    id: "about",
    label: "About & Legal",
    icon: <InfoIcon width={18} height={18} />
  }
];

/**
 * SettingsModal is the configuration modal orchestration overlay.
 * It manages local draft settings states and updates the parent configuration onSave.
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

  const [settingsForm, setSettingsForm] = useState({
    micro_break_interval_mins: config?.settings?.micro_break_interval_mins ?? 20,
    active_break_interval_mins: config?.settings?.active_break_interval_mins ?? 50,
    micro_break_duration_secs: config?.settings?.micro_break_duration_secs ?? 20,
    active_break_duration_mins: Math.round((config?.settings?.active_break_duration_secs ?? 300) / 60),
    run_at_start: config?.settings?.run_at_start ?? false,
    daily_prompt: config?.settings?.daily_prompt ?? "Have you read the book of king?",
    daily_prompt_enabled: config?.settings?.daily_prompt_enabled ?? false,
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

    const micro_break_interval_mins = Math.max(1, Math.round(Number(settingsForm.micro_break_interval_mins)) || 20);
    const active_break_interval_mins = Math.max(1, Math.round(Number(settingsForm.active_break_interval_mins)) || 50);
    const micro_break_duration_secs = Math.max(5, Math.round(Number(settingsForm.micro_break_duration_secs)) || 20);
    const active_break_duration_secs = Math.max(10, Math.round(Number(settingsForm.active_break_duration_mins) * 60) || 300);

    const finalizedConfig = {
      ...draftConfig,
      settings: {
        micro_break_interval_mins,
        active_break_interval_mins,
        micro_break_duration_secs,
        active_break_duration_secs,
        run_at_start: !!settingsForm.run_at_start,
        daily_prompt: settingsForm.daily_prompt,
        daily_prompt_enabled: !!settingsForm.daily_prompt_enabled,
      },
      reflection_prompts: editablePrompts,
      stretches: editableStretches,
      user_progress: settingsProgress
    };

    onSave(finalizedConfig);
  };

  return (
    <div className={styles['settings-overlay']}>
      <div className={`${styles['settings-modal']} ${isSidebarCollapsed ? styles['sidebar-collapsed'] : ""}`}>
        <div className={styles['settings-header']}>
          <h2 className={styles['settings-title']}>Configuration</h2>
          <button className={styles['settings-close-btn']} onClick={onCancel} title="Close Settings">
            <CloseIcon width={20} height={20} />
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
              {isSidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
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
              {tab.icon}
              <span className={styles['tab-label']}>{tab.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSaveSettings} className={styles['settings-form']}>
          <div className={styles['settings-tab-content']}>
            {activeTab === "general" && (
              <GeneralTab
                settingsForm={settingsForm}
                setSettingsForm={setSettingsForm}
                parentStyles={styles}
              />
            )}

             {activeTab === "timers" && (
              <TimersTab
                settingsForm={settingsForm}
                setSettingsForm={setSettingsForm}
                parentStyles={styles}
              />
            )}

            {activeTab === "progress" && (
              <Progress />
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
              <CardsTab />
            )}

            {activeTab === "prompts" && (
              <PromptsTab 
                editablePrompts={editablePrompts}
                setEditablePrompts={setEditablePrompts}
              />
            )}



            {activeTab === "about" && (
              <AboutTab parentStyles={styles} />
            )}
          </div>
          
          {activeTab !== "progress" && (
            <div className={styles['settings-footer']}>
              <button type="button" className={styles['settings-cancel-btn']} onClick={onCancel}>
                Cancel
              </button>
              <button type="submit" className={styles['settings-save-btn']}>
                Save Changes
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
