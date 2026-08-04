import React, { useState, useEffect } from "react";
import { formatTime } from "./utils/time";
import { invoke, registerListener } from "./utils/tauri";
import { useHoldToConfirm } from "./hooks/useHoldToConfirm";

// UI Components
import PhysicalResetCard from "./components/PhysicalResetCard";
import ActiveRecallCard from "./components/ActiveRecallCard";
import SkipReasonModal from "./components/SkipReasonModal";
import SettingsModal from "./components/settings/SettingsModal";
import { DevIssueReporter } from "tauri-plugin-dev-issues";
import { toast } from "./utils/toast";

/**
 * App is the high-level orchestrator component.
 * It manages active configurations, countdown timer loop, event listener registrations,
 * and high-level layout presentation.
 */
export default function App() {
  const [breakCountdown, setBreakCountdown] = useState(300);
  const [sessionStretch, setSessionStretch] = useState(null);
  const [sessionCard, setSessionCard] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [appConfig, setAppConfig] = useState(null);

  // Modal visibility states
  const [showSkipReasonModal, setShowSkipReasonModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Toast notifications state
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToastEvent = (e) => {
      const { message, type } = e.detail;
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    window.addEventListener("app-toast", handleToastEvent);
    return () => window.removeEventListener("app-toast", handleToastEvent);
  }, []);

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

    // Listen to events from Tauri backend using the safe registry helper
    const unlistenStartBreak = registerListener("start-break", () => {
      triggerBreak();
    });
    const unlistenOpenSettings = registerListener("open-settings", () => {
      setShowSettings(true);
    });

    return () => {
      unlistenStartBreak();
      unlistenOpenSettings();
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
      const config = await invoke("get_app_config");
      setAppConfig(config);
      
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

  // Hold-to-skip button animation states & handler via custom hook
  const { holdProgress, startHolding, cancelHolding } = useHoldToConfirm(() => {
    setShowSkipReasonModal(true);
  }, 2000);

  const handleSkipSubmit = (reason) => {
    handleCompleteBreak(`skipped: ${reason}`);
    setShowSkipReasonModal(false);
  };

  const handleSaveSettings = async (newConfig) => {
    try {
      await invoke("save_app_config", { newConfig });
      setAppConfig(newConfig);
      setShowSettings(false);
      triggerBreak();
      toast.success("Configuration saved successfully.");
    } catch (err) {
      console.error("Failed to save configuration", err);
      toast.error("Failed to save configuration.");
    }
  };

  const handleUpdateCardMetadata = async (cardId, newMetadata) => {
    try {
      const updatedConfig = await invoke("update_flashcard_metadata", { cardId, metadata: newMetadata });
      setAppConfig(updatedConfig);
      setSessionCard(prev => {
        if (prev && prev.id === cardId) {
          const updatedCard = updatedConfig.active_recall_cards.find(c => c.id === cardId);
          return updatedCard || { ...prev, metadata: { ...prev.metadata, ...newMetadata } };
        }
        return prev;
      });
    } catch (err) {
      console.error("Failed to update card metadata", err);
    }
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
          onClick={() => setShowSettings(true)}
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
        {/* Left Card: Physical Reset Posture Card */}
        <PhysicalResetCard sessionStretch={sessionStretch} />

        {/* Right Card: Active Recall Flashcard */}
        <ActiveRecallCard 
          sessionCard={sessionCard}
          showAnswer={showAnswer}
          setShowAnswer={setShowAnswer}
          onCompleteBreak={handleCompleteBreak}
          onUpdateMetadata={handleUpdateCardMetadata}
        />
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

      {/* Settings Dialog Modal */}
      {showSettings && appConfig && (
        <SettingsModal 
          config={appConfig}
          onSave={handleSaveSettings}
          onCancel={() => setShowSettings(false)}
        />
      )}

      {/* Skip Reason Modal Popup */}
      {showSkipReasonModal && (
        <SkipReasonModal 
          onSubmit={handleSkipSubmit}
          onCancel={() => setShowSkipReasonModal(false)}
        />
      )}

      {/* Dev Issue Reporter (only enabled in development environment) */}
      {import.meta.env.DEV && <DevIssueReporter />}

      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className={`toast ${t.type}`}
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
          >
            <div className="toast-body">
              {t.type === "success" ? (
                <svg className="toast-icon success" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : t.type === "error" ? (
                <svg className="toast-icon error" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" x2="9" y1="9" y2="15"></line>
                  <line x1="9" x2="15" y1="9" y2="15"></line>
                </svg>
              ) : (
                <svg className="toast-icon info" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" x2="12" y1="16" y2="12"></line>
                  <line x1="12" x2="12.01" y1="8" y2="8"></line>
                </svg>
              )}
              <span className="toast-message">{t.message}</span>
            </div>
            <button className="toast-close-btn">&times;</button>
          </div>
        ))}
      </div>
    </div>
  );
}
