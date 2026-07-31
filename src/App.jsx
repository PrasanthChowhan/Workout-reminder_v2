import React, { useState, useEffect } from "react";

// Access Tauri APIs globally
const { invoke } = window.__TAURI__ ? window.__TAURI__.core : { invoke: () => Promise.resolve({}) };
const { listen } = window.__TAURI__ ? window.__TAURI__.event : { listen: () => () => {} };

export default function App() {
  const [breakCountdown, setBreakCountdown] = useState(300);
  const [sessionStretch, setSessionStretch] = useState(null);
  const [sessionCard, setSessionCard] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [appConfig, setAppConfig] = useState(null);

  // Skip reason states
  const [showSkipReasonModal, setShowSkipReasonModal] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  
  // Settings view states
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [settingsForm, setSettingsForm] = useState({
    micro_break_interval_mins: 20,
    active_break_interval_mins: 50,
    micro_break_duration_secs: 20,
    active_break_duration_secs: 300,
    run_at_start: false,
  });

  // Editable lists states (for categories)
  const [editableCards, setEditableCards] = useState([]);
  const [editablePrompts, setEditablePrompts] = useState([]);
  const [editableStretches, setEditableStretches] = useState([]);

  // Physical Tracks local settings state
  const [settingsProgress, setSettingsProgress] = useState({
    active_track_id: null,
    current_level_number: null,
    onboarding_tier: null,
    completed_sessions_count: 0
  });
  const [onboardingTrackId, setOnboardingTrackId] = useState(null);
  const [onboardingTier, setOnboardingTier] = useState("beginner");

  // Drafts for adding new items
  const [newCard, setNewCard] = useState({ category: "", question: "", answer: "" });
  const [newPrompt, setNewPrompt] = useState("");
  const [newStretch, setNewStretch] = useState({ name: "", description: "", duration_secs: 30 });

  // Hold-to-confirm button states
  const [holdProgress, setHoldProgress] = useState(0);
  const holdAnimRef = React.useRef(null);
  const holdStartRef = React.useRef(null);

  // Keep a reference to the latest appConfig to avoid listener stale closures
  const appConfigRef = React.useRef(appConfig);
  useEffect(() => {
    appConfigRef.current = appConfig;
  }, [appConfig]);

  // Sync settings form on mount when appConfig is loaded or changed
  const handleOpenSettings = () => {
    const config = appConfigRef.current;
    if (config) {
      setSettingsForm({
        micro_break_interval_mins: config.settings.micro_break_interval_mins,
        active_break_interval_mins: config.settings.active_break_interval_mins,
        micro_break_duration_secs: config.settings.micro_break_duration_secs,
        active_break_duration_secs: config.settings.active_break_duration_secs,
        run_at_start: config.settings.run_at_start || false,
      });
      setEditableCards(config.active_recall_cards || []);
      setEditablePrompts(config.reflection_prompts || []);
      setEditableStretches(config.stretches || []);
      setSettingsProgress(config.user_progress || {
        active_track_id: null,
        current_level_number: null,
        onboarding_tier: null,
        completed_sessions_count: 0,
        last_completed_at: null,
        level_started_at: null
      });
      setOnboardingTrackId(null);
      setActiveTab("general");
      setShowSettings(true);
    } else {
      invoke("get_app_config").then((loadedConfig) => {
        setAppConfig(loadedConfig);
        setSettingsForm({
          micro_break_interval_mins: loadedConfig.settings.micro_break_interval_mins,
          active_break_interval_mins: loadedConfig.settings.active_break_interval_mins,
          micro_break_duration_secs: loadedConfig.settings.micro_break_duration_secs,
          active_break_duration_secs: loadedConfig.settings.active_break_duration_secs,
          run_at_start: loadedConfig.settings.run_at_start || false,
        });
        setEditableCards(loadedConfig.active_recall_cards || []);
        setEditablePrompts(loadedConfig.reflection_prompts || []);
        setEditableStretches(loadedConfig.stretches || []);
        setSettingsProgress(loadedConfig.user_progress || {
          active_track_id: null,
          current_level_number: null,
          onboarding_tier: null,
          completed_sessions_count: 0,
          last_completed_at: null,
          level_started_at: null
        });
        setOnboardingTrackId(null);
        setActiveTab("general");
        setShowSettings(true);
      });
    }
  };

  // Load configuration and default first break data on mount
  useEffect(() => {
    const init = async () => {
      try {
        const config = await invoke("get_app_config");
        setAppConfig(config);
        
        const sessionData = await invoke("get_session_data", { breakType: "active" });
        setSessionStretch(sessionData.stretch);
        setSessionCard(sessionData.card);
        setBreakCountdown(config?.settings?.active_break_duration_secs || 300);
      } catch (e) {
        console.error("Failed to load initial config/data", e);
      }
    };

    init();

    // Listen to start-break events from Tauri backend
    let unlistenStartBreak;
    let unlistenOpenSettings;
    const setupListeners = async () => {
      if (window.__TAURI__) {
        unlistenStartBreak = await listen("start-break", (event) => {
          triggerBreak();
        });
        unlistenOpenSettings = await listen("open-settings", (event) => {
          handleOpenSettings();
        });
      }
    };
    setupListeners();

    return () => {
      if (unlistenStartBreak) unlistenStartBreak();
      if (unlistenOpenSettings) unlistenOpenSettings();
    };
  }, []);

  // Countdown timer interval
  useEffect(() => {
    let interval;
    if (breakCountdown > 0) {
      interval = setInterval(() => {
        setBreakCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleCompleteBreak("skipped");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [breakCountdown]);

  const triggerBreak = async () => {
    setShowAnswer(false);
    try {
      const config = appConfig || await invoke("get_app_config");
      if (!appConfig) setAppConfig(config);
      
      const sessionData = await invoke("get_session_data", { breakType: "active" });
      setSessionStretch(sessionData.stretch);
      setSessionCard(sessionData.card);
      setBreakCountdown(config?.settings?.active_break_duration_secs || 300);
    } catch (e) {
      console.error("Failed to load session details", e);
    }
  };

  const handleCompleteBreak = async (action) => {
    try {
      await invoke("complete_break", { action });
      setShowAnswer(false);
      // Pre-load next break contents
      triggerBreak();
    } catch (e) {
      console.error("Failed to complete break", e);
    }
  };

  const handleHideToTray = () => {
    if (window.__TAURI__ && window.__TAURI__.window) {
      window.__TAURI__.window.getCurrentWindow().hide();
    }
  };

  const startHolding = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    holdStartRef.current = Date.now();
    setHoldProgress(0);

    const tick = () => {
      if (!holdStartRef.current) return;
      const elapsed = Date.now() - holdStartRef.current;
      const progress = Math.min((elapsed / 2000) * 100, 100);
      setHoldProgress(progress);

      if (progress >= 100) {
        setShowSkipReasonModal(true);
        cancelHolding();
      } else {
        holdAnimRef.current = requestAnimationFrame(tick);
      }
    };

    holdAnimRef.current = requestAnimationFrame(tick);
  };

  const cancelHolding = () => {
    holdStartRef.current = null;
    if (holdAnimRef.current) {
      cancelAnimationFrame(holdAnimRef.current);
      holdAnimRef.current = null;
    }
    setHoldProgress(0);
  };

  const handleSkipSubmit = (e) => {
    if (e) e.preventDefault();
    if (!skipReason.trim()) return;
    handleCompleteBreak(`skipped: ${skipReason.trim()}`);
    setShowSkipReasonModal(false);
    setSkipReason("");
  };

  const handleAddCard = () => {
    if (!newCard.category.trim() || !newCard.question.trim() || !newCard.answer.trim()) return;
    const card = {
      id: Math.random().toString(36).substring(2, 9),
      category: newCard.category.trim(),
      question: newCard.question.trim(),
      answer: newCard.answer.trim(),
      source: null
    };
    setEditableCards([...editableCards, card]);
    setNewCard({ category: "", question: "", answer: "" });
  };

  const handleDeleteCard = (id) => {
    setEditableCards(editableCards.filter(c => c.id !== id));
  };

  const handleAddPrompt = () => {
    if (!newPrompt.trim()) return;
    setEditablePrompts([...editablePrompts, newPrompt.trim()]);
    setNewPrompt("");
  };

  const handleDeletePrompt = (indexToDelete) => {
    setEditablePrompts(editablePrompts.filter((_, idx) => idx !== indexToDelete));
  };

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

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!appConfig) return;
    
    const newConfig = {
      ...appConfig,
      settings: {
        micro_break_interval_mins: Number(settingsForm.micro_break_interval_mins),
        active_break_interval_mins: Number(settingsForm.active_break_interval_mins),
        micro_break_duration_secs: Number(settingsForm.micro_break_duration_secs),
        active_break_duration_secs: Number(settingsForm.active_break_duration_secs),
        run_at_start: settingsForm.run_at_start,
      },
      active_recall_cards: editableCards,
      reflection_prompts: editablePrompts,
      stretches: editableStretches,
      user_progress: settingsProgress
    };
    
    try {
      await invoke("save_app_config", { newConfig });
      setAppConfig(newConfig);
      setShowSettings(false);
      triggerBreak();
    } catch (err) {
      console.error("Failed to save configuration", err);
    }
  };

  const handleCancelSettings = () => {
    if (appConfig?.settings) {
      setSettingsForm({
        micro_break_interval_mins: appConfig.settings.micro_break_interval_mins,
        active_break_interval_mins: appConfig.settings.active_break_interval_mins,
        micro_break_duration_secs: appConfig.settings.micro_break_duration_secs,
        active_break_duration_secs: appConfig.settings.active_break_duration_secs,
        run_at_start: appConfig.settings.run_at_start || false,
      });
    }
    setEditableCards([]);
    setEditablePrompts([]);
    setEditableStretches([]);
    setSettingsProgress(appConfig?.user_progress || {
      active_track_id: null,
      current_level_number: null,
      onboarding_tier: null,
      completed_sessions_count: 0
    });
    setOnboardingTrackId(null);
    setShowSettings(false);
  };

  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="active-break-screen">
      {/* Background Decorative Element */}
      <div className="bg-arc"></div>

      {/* Top Header */}
      <header className="active-break-header" data-purpose="top-navigation">
        <h1 className="active-break-timer-display">
          {formatTime(breakCountdown)}
        </h1>
        {/* Settings Icon - opens Settings modal */}
        <button 
          className="active-break-settings-btn" 
          data-purpose="settings-trigger"
          onClick={handleOpenSettings}
          title="Open Settings"
        >
          <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
      </header>

      {/* Content Container */}
      <main className="active-break-content" data-purpose="main-cards-layout">
        {/* Left Card: Physical Reset */}
        <section className="active-break-card stretch-card" data-purpose="side-card">
          <div className="stretch-image-container">
            <div className="stretch-image-wrapper">
              <img 
                alt="Physical Reset Visual" 
                className="stretch-image" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSP8ayYz8e6S4ObUs1uRNgHu5sZYSPPvwLt9vnm-bHqWlnZgnesLBve65puWHeWFesdANeGDFIbwSdsDTh_7WHRSqCroYDIhN2lLDh2XgAR6kUP4hdiqc-FRVaTQfHK2rrcH_tQodqwbCZTwh8ViS1HY3WWroP3djtu6S5c3h2xcp_lPfvFaa5U0dMOtId93Dits67UWE4cOOuZjHwFc9x9tJ07bs0mgQhYnbm931-l4sF9bDNG2Jhcw"
              />
            </div>
            <div className="stretch-time-badge">
              {sessionStretch ? sessionStretch.duration_secs : 30} Second
            </div>
          </div>
          <div className="stretch-text-content">
            <div className="stretch-meta-badges">
              <span className="stretch-badge difficulty">
                {sessionStretch?.difficulty_level || "All Levels"}
              </span>
              <span className="stretch-badge sets">
                {sessionStretch ? `${sessionStretch.sets} Sets` : "2 Sets"}
              </span>
              <span className="stretch-badge reps">
                {sessionStretch?.reps ? sessionStretch.reps : `${sessionStretch?.duration_secs || 30}s Hold`}
              </span>
            </div>
            <h2 className="stretch-title">
              {sessionStretch ? sessionStretch.name : "Physical Reset"}
            </h2>
            <p className="stretch-description">
              {sessionStretch ? sessionStretch.description : "Quick desk-side mobility routine to realign posture and improve blood flow."}
            </p>
          </div>
          <div className="stretch-card-footer">
            <div className="stretch-actions">
              <button className="stretch-action-btn" title="Watch demo video">
                <svg className="action-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>
                Watch
              </button>
              <button className="stretch-action-btn" title="Show stretch details">
                <svg className="action-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 16v-4"></path><path d="M12 8h.01"></path><circle cx="12" cy="12" r="10"></circle></svg>
                Details
              </button>
            </div>
            <button className="stretch-maximize-btn" title="Maximize">
              <svg className="action-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m15 3 6 6M9 21l-6-6M21 3l-6 6M3 21l6-6"></path></svg>
            </button>
          </div>
        </section>

        {/* Right Card: Active Recall Session */}
        <section className="active-break-card recall-card" data-purpose="primary-session-card">
          <div className="recall-card-top">
            <div className="recall-card-header">
              <span className="recall-card-title-label">Active Recall Session</span>
              <button className="recall-help-btn" title="Help / Tips">
                <svg className="help-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
              </button>
            </div>
            <div className="recall-card-body">
              <span className="recall-card-category">
                {sessionCard ? sessionCard.category : "GENERAL"}
              </span>
              <h2 className="recall-card-question">
                {sessionCard ? sessionCard.question : "Are both study and body break concepts clear?"}
              </h2>
              
              {showAnswer ? (
                <div className="recall-card-answer visible">
                  <p>
                    {sessionCard ? sessionCard.answer : "Yes! Continue doing healthy breaks."}
                  </p>
                </div>
              ) : (
                <div className="recall-card-answer" style={{ display: "block" }}>
                  <p style={{ opacity: 0.4, fontStyle: "italic", fontSize: "1rem" }}>
                    Answer is hidden. Click "Show Answer" below to reveal.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="recall-card-footer">
            {sessionCard?.source ? (
              <button 
                className="recall-source-btn"
                data-purpose="source-link"
                onClick={() => {
                  if (window.__TAURI__) {
                    window.__TAURI__.core.invoke("plugin:opener|open", { path: sessionCard.source }).catch(err => {
                      console.error("Failed to open source URL", err);
                    });
                  } else {
                    window.open(sessionCard.source, "_blank");
                  }
                }}
                title="Open source documentation"
              >
                View Source
                <svg className="source-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" x2="21" y1="14" y2="3"></line></svg>
              </button>
            ) : (
              <div />
            )}
            
            {!showAnswer ? (
              <button 
                className="recall-primary-btn" 
                data-purpose="primary-action"
                onClick={() => setShowAnswer(true)}
              >
                Show Answer
                <svg className="btn-arrow-icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" viewBox="0 0 24 24"><line x1="5" x2="19" y1="12" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>
            ) : (
              <button 
                className="recall-primary-btn success"
                data-purpose="primary-action"
                onClick={() => handleCompleteBreak("done")}
              >
                Done Session
                <svg className="btn-check-icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </button>
            )}
          </div>
        </section>
      </main>

      {/* Bottom Actions */}
      <footer className="active-break-footer" data-purpose="bottom-bar">
        <button 
          className={`footer-secondary-btn hold-btn ${holdProgress > 0 ? "holding" : ""}`}
          onMouseDown={startHolding}
          onMouseUp={cancelHolding}
          onMouseLeave={cancelHolding}
          onTouchStart={startHolding}
          onTouchEnd={cancelHolding}
          title="Press and hold for 2 seconds to skip"
        >
          <div className="hold-progress-bar" style={{ width: `${holdProgress}%` }}></div>
          <span>{holdProgress > 0 ? "Holding..." : "Didn't Do"}</span>
        </button>
        <button 
          className="footer-primary-btn" 
          onClick={() => handleCompleteBreak("done")}
        >
          Done Session
          <svg className="footer-check-icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </button>
      </footer>

      {showSettings && (
        <div className="settings-overlay" onClick={handleCancelSettings}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <h2 className="settings-title">Configuration</h2>
              <button className="settings-close-btn" onClick={handleCancelSettings} title="Close Settings">
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

                {activeTab === "tracks" && (
                  <div className="tab-pane">
                    {onboardingTrackId ? (
                      /* Onboarding Flow Screen */
                      <div className="onboarding-container">
                        <h3 className="onboarding-title">
                          Setup Track: {appConfig?.tracks?.find(t => t.id === onboardingTrackId)?.name || onboardingTrackId}
                        </h3>
                        <p className="onboarding-desc">
                          Select your starting flexibility tier. This will configure your initial stretch level and safe hold duration.
                        </p>
                        <div className="onboarding-tiers">
                          {[
                            {
                              id: "beginner",
                              name: "Beginner",
                              multiplier: "0.75x duration",
                              description: "Starts at Level 1 (Wall Straddle). Fully supported passive stretches, lower duration to prevent strain."
                            },
                            {
                              id: "intermediate",
                              name: "Intermediate",
                              multiplier: "1.00x duration",
                              description: "Starts at Level 2 (Half Split). Introduces active unilateral movement. Standard hold duration."
                            },
                            {
                              id: "advanced",
                              name: "Advanced",
                              multiplier: "1.25x duration",
                              description: "Starts at Level 3 (Frog Stretch). Deep active/bilateral stretches. Extended hold duration."
                            }
                          ].map(tier => (
                            <div
                              key={tier.id}
                              className={`onboarding-tier-card ${onboardingTier === tier.id ? "selected" : ""}`}
                              onClick={() => setOnboardingTier(tier.id)}
                            >
                              <div className="onboarding-tier-header">
                                <span className={`onboarding-tier-name ${tier.id}`}>{tier.name}</span>
                                <span className="onboarding-tier-mult">{tier.multiplier}</span>
                              </div>
                              <p className="onboarding-tier-desc">{tier.description}</p>
                            </div>
                          ))}
                        </div>
                        <div className="onboarding-actions">
                          <button
                            type="button"
                            className="track-action-btn"
                            onClick={() => {
                              // Onboard: set active track
                              const startingLevel = onboardingTier === "beginner" ? 1 : onboardingTier === "intermediate" ? 2 : 3;
                              setSettingsProgress({
                                active_track_id: onboardingTrackId,
                                onboarding_tier: onboardingTier,
                                current_level_number: startingLevel,
                                completed_sessions_count: 0,
                                last_completed_at: null,
                                level_started_at: new Date().toISOString()
                              });
                              setOnboardingTrackId(null);
                            }}
                          >
                            Confirm & Start Track
                          </button>
                          <button
                            type="button"
                            className="onboarding-back-btn"
                            onClick={() => setOnboardingTrackId(null)}
                          >
                            Back
                          </button>
                        </div>
                      </div>
                    ) : settingsProgress.active_track_id ? (
                      /* Active Track Progress Screen */
                      <div className="active-track-panel">
                        {(() => {
                          const activeTrack = appConfig?.tracks?.find(t => t.id === settingsProgress.active_track_id);
                          if (!activeTrack) return null;
                          const completedSessions = settingsProgress.completed_sessions_count || 0;
                          const progressPercent = Math.min((completedSessions / 5) * 100, 100);
                          
                          return (
                            <>
                              <div className="active-track-header">
                                <div className="active-track-name-row">
                                  <h3 className="track-selection-title">{activeTrack.name}</h3>
                                  <span className="active-track-label">Active Track</span>
                                </div>
                                <p className="track-selection-desc" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                  {activeTrack.description}
                                </p>
                                <div className="active-track-info-row">
                                  <span>
                                    Tier: <strong>{settingsProgress.onboarding_tier?.toUpperCase()}</strong>
                                  </span>
                                  <div>
                                    <label style={{ marginRight: '0.5rem' }}>Change Tier:</label>
                                    <select
                                      className="active-track-tier-select"
                                      value={settingsProgress.onboarding_tier || "beginner"}
                                      onChange={(e) => {
                                        setSettingsProgress({
                                          ...settingsProgress,
                                          onboarding_tier: e.target.value
                                        });
                                      }}
                                    >
                                      <option value="beginner">Beginner (0.75x)</option>
                                      <option value="intermediate">Intermediate (1.0x)</option>
                                      <option value="advanced">Advanced (1.25x)</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="active-track-info-row" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                                  <span>Completed Sessions (Current Level): {completedSessions} / 5</span>
                                </div>
                                <div className="active-track-progress-bar-container">
                                  <div className="active-track-progress-bar" style={{ width: `${progressPercent}%` }}></div>
                                </div>
                              </div>

                              <div className="levels-list-container">
                                <h4 className="levels-list-title">Track Levels</h4>
                                {activeTrack.levels.map(level => {
                                  const isActive = settingsProgress.current_level_number === level.level_number;
                                  const isCompleted = settingsProgress.current_level_number > level.level_number;
                                  const isLocked = settingsProgress.current_level_number < level.level_number;
                                  
                                  // Compute duration multiplier
                                  const mult = settingsProgress.onboarding_tier === "beginner" ? 0.75 : settingsProgress.onboarding_tier === "advanced" ? 1.25 : 1.0;
                                  const rawDur = level.target_duration_secs * mult;
                                  const duration = Math.max(30, Math.min(90, Math.round(rawDur)));

                                  return (
                                    <div
                                      key={level.level_number}
                                      className={`level-item-card ${isActive ? "active" : ""}`}
                                    >
                                      <div className="level-item-header">
                                        <div className="level-item-title-col">
                                          <span className="level-item-number">L{level.level_number}</span>
                                          <span className="level-item-title">{level.title}</span>
                                        </div>
                                        <span className={`level-item-badge ${isActive ? "active" : isCompleted ? "completed" : "locked"}`}>
                                          {isActive ? "Active" : isCompleted ? "Completed" : "Locked"}
                                        </span>
                                      </div>
                                      <p className="level-item-desc">{level.description}</p>
                                      <div className="level-item-footer">
                                        <span className="level-item-duration">Target hold: {duration}s</span>
                                        {!isActive && (
                                          <button
                                            type="button"
                                            className="level-select-btn"
                                            onClick={() => {
                                              setSettingsProgress({
                                                ...settingsProgress,
                                                current_level_number: level.level_number,
                                                completed_sessions_count: 0
                                              });
                                            }}
                                          >
                                            Activate Level
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              <button
                                type="button"
                                className="deactivate-track-btn"
                                onClick={() => {
                                  setSettingsProgress({
                                    active_track_id: null,
                                    current_level_number: null,
                                    onboarding_tier: null,
                                    completed_sessions_count: 0,
                                    last_completed_at: null,
                                    level_started_at: null
                                  });
                                }}
                              >
                                Deactivate Track
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      /* Track Selection Screen */
                      <div className="tracks-container">
                        <h3 className="settings-group-title" style={{ marginTop: 0 }}>Available Skill Tracks</h3>
                        <p className="settings-item-desc" style={{ marginBottom: "1rem" }}>
                          Choose a tailored physical progression track to follow during active breaks.
                        </p>
                        {appConfig?.tracks?.map(track => (
                          <div key={track.id} className="track-selection-card">
                            <h4 className="track-selection-title">{track.name}</h4>
                            <p className="track-selection-desc">{track.description}</p>
                            <button
                              type="button"
                              className="track-action-btn"
                              onClick={() => {
                                setOnboardingTrackId(track.id);
                                setOnboardingTier("beginner");
                              }}
                            >
                              Choose Track
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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

                {activeTab === "cards" && (
                  <div className="tab-pane">
                    <div className="settings-add-form">
                      <h3 className="settings-group-title" style={{ marginTop: 0, borderBottom: "none" }}>Add Active Recall Card</h3>
                      <div className="add-form-row">
                        <input 
                          type="text" 
                          placeholder="Category (e.g., Rust)" 
                          className="settings-input-text" 
                          value={newCard.category}
                          onChange={(e) => setNewCard({ ...newCard, category: e.target.value })}
                        />
                        <input 
                          type="text" 
                          placeholder="Question" 
                          className="settings-input-text" 
                          value={newCard.question}
                          onChange={(e) => setNewCard({ ...newCard, question: e.target.value })}
                        />
                      </div>
                      <div className="add-form-row" style={{ marginTop: "0.5rem" }}>
                        <input 
                          type="text" 
                          placeholder="Answer" 
                          className="settings-input-text" 
                          value={newCard.answer}
                          onChange={(e) => setNewCard({ ...newCard, answer: e.target.value })}
                        />
                        <button type="button" className="settings-add-btn" onClick={handleAddCard}>Add Card</button>
                      </div>
                    </div>

                    <div className="settings-items-list">
                      {editableCards.map((card) => (
                        <div key={card.id} className="settings-list-item">
                          <div className="settings-item-info">
                            <span className="settings-item-badge">{card.category}</span>
                            <h4 className="settings-item-title">{card.question}</h4>
                            <p className="settings-item-desc">{card.answer}</p>
                          </div>
                          <button type="button" className="settings-item-delete" onClick={() => handleDeleteCard(card.id)} title="Delete Card">
                            <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "prompts" && (
                  <div className="tab-pane">
                    <div className="settings-add-form flex-row">
                      <input 
                        type="text" 
                        placeholder="New reflection prompt..." 
                        className="settings-input-text" 
                        value={newPrompt}
                        onChange={(e) => setNewPrompt(e.target.value)}
                      />
                      <button type="button" className="settings-add-btn" onClick={handleAddPrompt}>Add Prompt</button>
                    </div>

                    <div className="settings-items-list">
                      {editablePrompts.map((prompt, index) => (
                        <div key={index} className="settings-list-item">
                          <span className="settings-item-text">{prompt}</span>
                          <button type="button" className="settings-item-delete" onClick={() => handleDeletePrompt(index)} title="Delete Prompt">
                            <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "stretches" && (
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
                )}
              </div>
              
              <div className="settings-footer">
                <button type="button" className="settings-cancel-btn" onClick={handleCancelSettings}>
                  Cancel
                </button>
                <button type="submit" className="settings-save-btn">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSkipReasonModal && (
        <div className="skip-reason-overlay" onClick={() => setShowSkipReasonModal(false)}>
          <div className="skip-reason-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header" style={{ marginBottom: "1rem" }}>
              <h2 className="skip-reason-title">Skip Session Reason</h2>
              <button 
                className="settings-close-btn" 
                onClick={() => setShowSkipReasonModal(false)}
                title="Cancel skipping"
              >
                <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                  <line x1="18" x2="6" y1="6" y2="18"></line>
                  <line x1="6" x2="18" y1="6" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <p className="skip-reason-subtitle">
              Logging the reason for skipping breaks helps track your focus habits and posture cycles.
            </p>
            
            <form onSubmit={handleSkipSubmit}>
              <input
                type="text"
                className="skip-reason-input"
                placeholder="Or type a custom reason..."
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                autoFocus
                required
              />
              
              <div className="skip-chips-container">
                {[
                  "Flow State / Deep Focus",
                  "In a Meeting / Call",
                  "Already Stretched / Walked",
                  "Urgent Code Fix Required",
                  "Away from Desk"
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    className={`skip-chip ${skipReason === reason ? "active" : ""}`}
                    onClick={() => setSkipReason(reason)}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              
              <button type="submit" className="skip-reason-submit-btn">
                Confirm Skip & Exit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
