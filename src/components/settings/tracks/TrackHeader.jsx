import React from "react";
import styles from "./TrackDetailView.module.css";

export default function TrackHeader({
  selectedTrack,
  isActive,
  previewTier,
  setPreviewTier,
  completedSessions,
  progressPercent,
  onDeactivate,
  onActivateTrack,
}) {
  return (
    <div
      className={styles['active-track-header']}
      style={
        !isActive
          ? {
              backgroundColor: "rgba(255, 255, 255, 0.01)",
              borderColor: "rgba(255, 255, 255, 0.05)"
            }
          : {}
      }
    >
      <div className={styles['active-track-name-row']}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <h3 className={styles['track-selection-title']}>{selectedTrack.name}</h3>
          {isActive && <span className={styles['active-track-label']}>Active Track</span>}
        </div>
        {isActive ? (
          <button
            type="button"
            className={styles['deactivate-track-btn']}
            style={{ margin: 0, padding: "0.4rem 0.8rem", fontSize: "0.7rem" }}
            onClick={onDeactivate}
          >
            Deactivate
          </button>
        ) : (
          <button
            type="button"
            className={styles['track-action-btn']}
            style={{ padding: "0.4rem 0.8rem", fontSize: "0.7rem" }}
            onClick={() => onActivateTrack(previewTier)}
          >
            Choose Track & Start
          </button>
        )}
      </div>
      <p
        className={styles['track-selection-desc']}
        style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}
      >
        {selectedTrack.description}
      </p>

      <div className={styles['active-track-info-row']}>
        <span>
          Tier:{" "}
          <strong>
            {(isActive ? selectedTrack.metadata?.onboarding_tier || previewTier : previewTier)?.toUpperCase()}
          </strong>
        </span>
        <div>
          <label style={{ marginRight: "0.5rem" }}>Difficulty Tier:</label>
          <select
            className={styles['active-track-tier-select']}
            value={isActive ? (selectedTrack.metadata?.onboarding_tier || "beginner") : previewTier}
            onChange={(e) => setPreviewTier(e.target.value)}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
        </div>
      </div>

      {isActive && (
        <>
          <div
            className={styles['active-track-info-row']}
            style={{ marginTop: "0.75rem", marginBottom: 0 }}
          >
            <span>
              Completed Sessions (Current Level): {completedSessions} / 5
            </span>
          </div>
          <div className={styles['active-track-progress-bar-container']}>
            <div
              className={styles['active-track-progress-bar']}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </>
      )}
    </div>
  );
}
