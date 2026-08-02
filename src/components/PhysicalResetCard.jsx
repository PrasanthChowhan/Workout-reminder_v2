import React, { useState } from "react";
import { openUrl } from "../utils/tauri";
import styles from "./PhysicalResetCard.module.css";

/**
 * PhysicalResetCard represents the left layout container showing stretch visuals, difficulty metadata, sets, and instructions.
 * 
 * @param {object} props
 * @param {object} props.sessionStretch Active stretch session object
 */
export default function PhysicalResetCard({ sessionStretch }) {
  const [showDetails, setShowDetails] = useState(false);

  const handleWatchVideo = () => {
    if (sessionStretch?.video_url && sessionStretch.video_url !== "N/A") {
      openUrl(sessionStretch.video_url);
    }
  };

  const fallbackImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuBSP8ayYz8e6S4ObUs1uRNgHu5sZYSPPvwLt9vnm-bHqWlnZgnesLBve65puWHeWFesdANeGDFIbwSdsDTh_7WHRSqCroYDIhN2lLDh2XgAR6kUP4hdiqc-FRVaTQfHK2rrcH_tQodqwbCZTwh8ViS1HY3WWroP3djtu6S5c3h2xcp_lPfvFaa5U0dMOtId93Dits67UWE4cOOuZjHwFc9x9tJ07bs0mgQhYnbm931-l4sF9bDNG2Jhcw";

  // Parse details out of description if formatted with bullet points
  const parseDescription = (desc) => {
    if (!desc) return { mainDesc: "", metadata: null };
    const parts = desc.split("\n\n");
    if (parts.length > 1) {
      const mainDesc = parts[0];
      const metaString = parts.slice(1).join("\n\n");
      const metadata = {};
      const lines = metaString.split("\n");
      lines.forEach(line => {
        const match = line.match(/^•\s*([^:]+):\s*(.+)$/);
        if (match) {
          metadata[match[1].trim()] = match[2].trim();
        }
      });
      return { mainDesc, metadata };
    }
    return { mainDesc: desc, metadata: null };
  };

  const { mainDesc, metadata } = parseDescription(sessionStretch?.description);

  // Construct unified details object for structured rendering
  const displayMetadata = { ...metadata };

  if (!displayMetadata["Category"] && sessionStretch?.category) {
    displayMetadata["Category"] = sessionStretch.category;
  }
  if (!displayMetadata["Target"] && (sessionStretch?.target_muscles || sessionStretch?.muscle_groups)) {
    const targets = sessionStretch.target_muscles || sessionStretch.muscle_groups;
    displayMetadata["Target"] = Array.isArray(targets) ? targets.join(", ") : targets;
  }
  if (!displayMetadata["Side"] && sessionStretch?.is_unilateral !== undefined) {
    displayMetadata["Side"] = sessionStretch.is_unilateral ? "Unilateral (Perform per side)" : "Bilateral";
  }
  if (!displayMetadata["Equipment"] && sessionStretch?.equipment) {
    displayMetadata["Equipment"] = (Array.isArray(sessionStretch.equipment) && sessionStretch.equipment.length > 0)
      ? sessionStretch.equipment.join(", ")
      : "None";
  }
  if (!displayMetadata["Rest"] && sessionStretch?.rest_secs !== undefined) {
    displayMetadata["Rest"] = sessionStretch.rest_secs ? `${sessionStretch.rest_secs}s` : "None";
  }
  if (!displayMetadata["Instructions"] && sessionStretch?.reps) {
    displayMetadata["Instructions"] = `${sessionStretch.reps}${sessionStretch.sets ? ` (${sessionStretch.sets} Sets)` : ""}`;
  }
  if (!displayMetadata["Video URL"] && sessionStretch?.video_url && sessionStretch.video_url !== "N/A") {
    displayMetadata["Video URL"] = sessionStretch.video_url;
  }

  return (
    <section className={`active-break-card ${styles['stretch-card']}`} style={{ position: "relative", overflow: "hidden" }} data-purpose="side-card">
      {/* Details Overlay */}
      {showDetails && Object.keys(displayMetadata).length > 0 && (
        <div className={styles['stretch-details-overlay']}>
          <div className={styles['stretch-details-header']}>
            <h3 className={styles['stretch-details-title']}>Exercise Details</h3>
            <button 
              className={styles['stretch-details-close-btn']}
              onClick={() => setShowDetails(false)}
              title="Close Details"
            >
              <svg className={styles['close-icon']} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M18 6 6 18M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div className={styles['stretch-details-body']}>
            {Object.entries(displayMetadata).map(([key, value]) => {
              if (!value) return null;
              const isUrl = typeof value === "string" && (value.startsWith("http://") || value.startsWith("https://"));
              return (
                <div className={styles['stretch-detail-item']} key={key}>
                  <span className={styles['stretch-detail-label']}>{key}</span>
                  <span className={styles['stretch-detail-value']}>
                    {isUrl ? (
                      <a 
                        href={value} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={styles['detail-link']}
                        onClick={(e) => {
                          e.preventDefault();
                          openUrl(value);
                        }}
                      >
                        Watch Video
                      </a>
                    ) : (
                      value
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={styles['stretch-image-container']}>
        <div className={styles['stretch-image-wrapper']}>
          <img 
            alt="Physical Reset Visual" 
            className={styles['stretch-image']} 
            src={sessionStretch?.image_url || sessionStretch?.asset_url || fallbackImage}
          />
        </div>
      </div>
      <div className={styles['stretch-text-content']}>
        <div className={styles['stretch-meta-badges']}>
          <span className={`${styles['stretch-badge']} ${styles['difficulty']}`}>
            {sessionStretch?.difficulty_level || "All Levels"}
          </span>
          <span className={`${styles['stretch-badge']} ${styles['sets']}`}>
            {sessionStretch?.sets ? `${sessionStretch.sets} Sets` : "2 Sets"}
          </span>
          <span className={`${styles['stretch-badge']} ${styles['reps']}`}>
            {sessionStretch?.reps || `${sessionStretch?.duration_secs ?? 30}s Hold`}
          </span>
        </div>
        <h2 className={styles['stretch-title']}>
          {sessionStretch?.name || "Physical Reset"}
        </h2>
        <p className={styles['stretch-description']}>
          {mainDesc || "Quick desk-side mobility routine to realign posture and improve blood flow."}
        </p>
      </div>
      <div className={styles['stretch-card-footer']}>
        <div className={styles['stretch-actions']}>
          <button 
            className={styles['stretch-action-btn']} 
            title={sessionStretch?.video_url && sessionStretch.video_url !== "N/A" ? `Watch: ${sessionStretch.video_url}` : "Watch demo video"}
            disabled={!sessionStretch?.video_url || sessionStretch.video_url === "N/A"}
            style={{ 
              opacity: (sessionStretch?.video_url && sessionStretch.video_url !== "N/A") ? 1 : 0.5, 
              cursor: (sessionStretch?.video_url && sessionStretch.video_url !== "N/A") ? "pointer" : "not-allowed" 
            }}
            onClick={handleWatchVideo}
          >
            <svg className={styles['action-icon']} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polygon points="6 3 20 12 6 21 6 3"></polygon>
            </svg>
            Watch
          </button>
          <button 
            className={`${styles['stretch-action-btn']} ${showDetails ? styles['active'] : ""}`}
            title="Show stretch details"
            onClick={() => setShowDetails(true)}
          >
            <svg className={styles['action-icon']} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
            Details
          </button>
        </div>
        <button className={styles['stretch-maximize-btn']} title="Maximize">
          <svg className={styles['action-icon']} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="m15 3 6 6M9 21l-6-6M21 3l-6 6M3 21l6-6"></path>
          </svg>
        </button>
      </div>
    </section>
  );
}
