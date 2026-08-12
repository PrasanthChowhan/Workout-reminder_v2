import React, { useState, useEffect } from "react";
import { formatTime } from "./utils/time";
import { invoke, registerListener } from "./utils/tauri";
import { useHoldToConfirm } from "./hooks/useHoldToConfirm";

// UI Components
import PhysicalResetCard from "./components/PhysicalResetCard";
import ActiveRecallCard from "./components/ActiveRecallCard";
import SkipReasonModal from "./components/SkipReasonModal";
import SettingsModal from "./components/settings/SettingsModal";
import ToastContainer from "./components/Toast";
import { SettingsIcon, CheckIcon } from "./components/ui/Icons";
import { DevIssueReporter } from "tauri-plugin-react-issue-reporter";
import { toast } from "./utils/toast";
import buttonStyles from "./styles/buttons.module.css";

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
        const { config, session_data } = await invoke("get_initial_break_data", { breakType: "active" });
        setAppConfig(config);
        setSessionStretch(session_data.stretch);
        setSessionCard(session_data.card);
        const duration = config?.settings?.active_break_duration_secs || 300;
        setBreakCountdown(duration);
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
      const { config, session_data } = await invoke("get_initial_break_data", { breakType: "active" });
      setAppConfig(config);
      setSessionStretch(session_data.stretch);
      setSessionCard(session_data.card);
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
      await invoke("save_app_config", { newConfig: newConfig });
      setAppConfig(newConfig);
      setShowSettings(false);
      triggerBreak();
      toast.success("Configuration saved successfully.");
    } catch (err) {
      console.error("Failed to save configuration", err);
      toast.error("Failed to save configuration.");
    }
  };

  const handleRateCard = async (variantId, rating) => {
    const ratingsMap = { 1: "Again", 2: "Hard", 3: "Good", 4: "Easy" };
    const ratingName = ratingsMap[rating] || "Submitted";
    try {
      await invoke("update_variant_srs", { variantId, rating });
      toast.success(`Card rated: ${ratingName}`);
      handleCompleteBreak("done");
    } catch (err) {
      console.error("Failed to rate card", err);
      toast.error("Failed to update spaced repetition progress.");
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
          <SettingsIcon />
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
          onRateCard={handleRateCard}
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
          <div className="hold-progress-bar" style={{ transform: `scaleX(${holdProgress / 100})` }}></div>
          <span>{holdProgress > 0 ? "Holding..." : "Didn't Do"}</span>
        </button>
        <button 
          className={buttonStyles["footer-primary-btn"]}
          onClick={() => handleCompleteBreak("done")}
        >
          Done Session
          <CheckIcon className="footer-check-icon" />
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
      <ToastContainer 
        toasts={toasts} 
        onCloseToast={(id) => setToasts((prev) => prev.filter((x) => x.id !== id))} 
      />
    </div>
  );
}
