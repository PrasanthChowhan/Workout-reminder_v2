import React, { useState, useEffect } from "react";
import { openUrl } from "../utils/tauri";
import { getYoutubeId } from "../utils/youtube";
import { CloseIcon, PictureIcon, PlayIcon, InfoIcon, MaximizeIcon } from "./ui/Icons";
import EmbeddedPlayer from "./EmbeddedPlayer";
import styles from "./PhysicalResetCard.module.css";

/**
 * PhysicalResetCard represents the left layout container showing stretch visuals, difficulty metadata, sets, and instructions.
 * 
 * @param {object} props
 * @param {object} props.sessionStretch Active stretch session object
 */
export default function PhysicalResetCard({ sessionStretch }) {
  const [showDetails, setShowDetails] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);

  // Reset video playback and error states when the active stretch changes
  useEffect(() => {
    setIsPlayingVideo(false);
    setImageError(false);
    setThumbnailError(false);
  }, [sessionStretch]);

  const handleWatchVideo = () => {
    if (sessionStretch?.video_url && sessionStretch.video_url !== "N/A") {
      setIsPlayingVideo(!isPlayingVideo);
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
              <CloseIcon className={styles['close-icon']} />
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
                          setIsPlayingVideo(true);
                          setShowDetails(false);
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
          {isPlayingVideo && sessionStretch?.video_url && sessionStretch.video_url !== "N/A" ? (
            <EmbeddedPlayer
              videoUrl={sessionStretch.video_url}
              title={sessionStretch.name || "Physical Reset"}
              subtitle={`${sessionStretch.difficulty_level || "All Levels"} · ${sessionStretch.reps || `${sessionStretch.duration_secs ?? 30}s Hold`}`}
              durationSecs={sessionStretch.duration_secs || 60}
              onClose={() => setIsPlayingVideo(false)}
            />
          ) : (() => {
            const hasImageUrl = sessionStretch?.image_url && 
                               sessionStretch.image_url !== "N/A" && 
                               sessionStretch.image_url.trim() !== "";
            
            if (hasImageUrl && !imageError) {
              return (
                <img 
                  alt={sessionStretch?.name || "Physical Reset Visual"} 
                  className={styles['stretch-image']} 
                  src={sessionStretch.image_url}
                  onError={() => setImageError(true)}
                />
              );
            }

            const youtubeId = getYoutubeId(sessionStretch?.video_url);
            if (youtubeId && !thumbnailError) {
              return (
                <img 
                  alt={`${sessionStretch?.name || "Physical Reset"} Video Thumbnail`} 
                  className={styles['stretch-image']} 
                  src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                  onError={() => setThumbnailError(true)}
                />
              );
            }

            // Fallback placeholder when no image/thumbnail is available
            const category = sessionStretch?.category || "STRETCH";
            return (
              <div className={styles['placeholder-container']}>
                <svg className={styles['placeholder-svg']} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Telemetry/Coordinate circles */}
                  <circle cx="50" cy="50" r="42" stroke="rgba(255, 122, 69, 0.1)" strokeWidth="0.75" strokeDasharray="3 3" />
                  <circle cx="50" cy="50" r="30" stroke="rgba(82, 196, 26, 0.12)" strokeWidth="0.75" />
                  <circle cx="50" cy="50" r="18" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="0.5" />
                  
                  {/* Crosshair guidelines */}
                  <line x1="50" y1="5" x2="50" y2="95" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.5" strokeDasharray="2 2" />
                  <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.5" strokeDasharray="2 2" />
                  
                  {/* Abstract stretching/posture line-art skeleton */}
                  {/* Spine/head */}
                  <path d="M50 28 C51 38, 49 46, 46 60" stroke="var(--color-brand-orange, #ff7a45)" strokeWidth="2.5" strokeLinecap="round" className={styles['pulse-path']} />
                  <circle cx="50" cy="20" r="3.5" stroke="var(--color-brand-orange, #ff7a45)" strokeWidth="1.5" fill="#26292f" />
                  
                  {/* Arms stretching / holding pose */}
                  <path d="M50 30 C38 28, 28 24, 22 18" stroke="#52c41a" strokeWidth="2" strokeLinecap="round" />
                  <path d="M50 30 C62 28, 72 24, 78 18" stroke="#52c41a" strokeWidth="2" strokeLinecap="round" />
                  
                  {/* Hips and legs */}
                  <path d="M46 60 L32 82" stroke="rgba(232, 230, 227, 0.4)" strokeWidth="2" strokeLinecap="round" />
                  <path d="M46 60 L62 80" stroke="rgba(232, 230, 227, 0.4)" strokeWidth="2" strokeLinecap="round" />
                  
                  {/* Telemetry joint markers */}
                  <circle cx="22" cy="18" r="1.5" fill="#52c41a" />
                  <circle cx="78" cy="18" r="1.5" fill="#52c41a" />
                  <circle cx="50" cy="30" r="1.2" fill="var(--color-brand-orange, #ff7a45)" />
                  <circle cx="46" cy="60" r="1.2" fill="var(--color-brand-orange, #ff7a45)" />
                </svg>
                <div className={styles['placeholder-label']}>
                  <span className={styles['placeholder-text-accent']}>[ {category.toUpperCase()}_SYS ]</span>
                  <span className={styles['placeholder-text-sub']}>NO_IMAGE_STREAM</span>
                </div>
              </div>
            );
          })()}
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
        {isPlayingVideo && (
          <p className={styles['youtube-disclaimer']}>
            Video streamed via YouTube. All intellectual property belongs strictly to the respective owner.
          </p>
        )}
      </div>
      <div className={styles['stretch-card-footer']}>
        <div className={styles['stretch-actions']}>
          <button 
            className={`${styles['stretch-action-btn']} ${styles['stretch-toggle-btn']}`} 
            title={sessionStretch?.video_url && sessionStretch.video_url !== "N/A" 
              ? (isPlayingVideo ? "Show pose illustration" : `Watch: ${sessionStretch.video_url}`) 
              : "Watch demo video"}
            disabled={!sessionStretch?.video_url || sessionStretch.video_url === "N/A"}
            style={{ 
              opacity: (sessionStretch?.video_url && sessionStretch.video_url !== "N/A") ? 1 : 0.5, 
              cursor: (sessionStretch?.video_url && sessionStretch.video_url !== "N/A") ? "pointer" : "not-allowed" 
            }}
            onClick={handleWatchVideo}
          >
            {isPlayingVideo ? (
              <PictureIcon className={styles['action-icon']} />
            ) : (
              <PlayIcon className={styles['action-icon']} />
            )}
            {isPlayingVideo ? "Pose" : "Watch"}
          </button>
          <button 
            className={`${styles['stretch-action-btn']} ${showDetails ? styles['active'] : ""}`}
            title="Show stretch details"
            onClick={() => setShowDetails(true)}
          >
            <InfoIcon className={styles['action-icon']} />
            Details
          </button>
        </div>
        <button className={styles['stretch-maximize-btn']} title="Maximize">
          <MaximizeIcon className={styles['action-icon']} />
        </button>
      </div>
    </section>
  );
}
