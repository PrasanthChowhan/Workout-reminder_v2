import React from "react";
import { openUrl } from "../utils/tauri";

/**
 * PhysicalResetCard represents the left layout container showing stretch visuals, difficulty metadata, sets, and instructions.
 * 
 * @param {object} props
 * @param {object} props.sessionStretch Active stretch session object
 */
export default function PhysicalResetCard({ sessionStretch }) {
  const handleWatchVideo = () => {
    if (sessionStretch?.video_url && sessionStretch.video_url !== "N/A") {
      openUrl(sessionStretch.video_url);
    }
  };

  const fallbackImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuBSP8ayYz8e6S4ObUs1uRNgHu5sZYSPPvwLt9vnm-bHqWlnZgnesLBve65puWHeWFesdANeGDFIbwSdsDTh_7WHRSqCroYDIhN2lLDh2XgAR6kUP4hdiqc-FRVaTQfHK2rrcH_tQodqwbCZTwh8ViS1HY3WWroP3djtu6S5c3h2xcp_lPfvFaa5U0dMOtId93Dits67UWE4cOOuZjHwFc9x9tJ07bs0mgQhYnbm931-l4sF9bDNG2Jhcw";

  return (
    <section className="active-break-card stretch-card" data-purpose="side-card">
      <div className="stretch-image-container">
        <div className="stretch-image-wrapper">
          <img 
            alt="Physical Reset Visual" 
            className="stretch-image" 
            src={sessionStretch?.image_url || sessionStretch?.asset_url || fallbackImage}
          />
        </div>
        <div className="stretch-time-badge">
          {sessionStretch?.duration_secs ?? 30} Second
        </div>
      </div>
      <div className="stretch-text-content">
        <div className="stretch-meta-badges">
          <span className="stretch-badge difficulty">
            {sessionStretch?.difficulty_level || "All Levels"}
          </span>
          <span className="stretch-badge sets">
            {sessionStretch?.sets ? `${sessionStretch.sets} Sets` : "2 Sets"}
          </span>
          <span className="stretch-badge reps">
            {sessionStretch?.reps || `${sessionStretch?.duration_secs ?? 30}s Hold`}
          </span>
        </div>
        <h2 className="stretch-title">
          {sessionStretch?.name || "Physical Reset"}
        </h2>
        <p className="stretch-description">
          {sessionStretch?.description || "Quick desk-side mobility routine to realign posture and improve blood flow."}
        </p>
      </div>
      <div className="stretch-card-footer">
        <div className="stretch-actions">
          <button 
            className="stretch-action-btn" 
            title="Watch demo video"
            disabled={!sessionStretch?.video_url || sessionStretch.video_url === "N/A"}
            style={{ 
              opacity: (sessionStretch?.video_url && sessionStretch.video_url !== "N/A") ? 1 : 0.5, 
              cursor: (sessionStretch?.video_url && sessionStretch.video_url !== "N/A") ? "pointer" : "not-allowed" 
            }}
            onClick={handleWatchVideo}
          >
            <svg className="action-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="m9 12 2 2 4-4"></path>
            </svg>
            Watch
          </button>
          <button className="stretch-action-btn" title="Show stretch details">
            <svg className="action-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
            Details
          </button>
        </div>
        <button className="stretch-maximize-btn" title="Maximize">
          <svg className="action-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="m15 3 6 6M9 21l-6-6M21 3l-6 6M3 21l6-6"></path>
          </svg>
        </button>
      </div>
    </section>
  );
}
