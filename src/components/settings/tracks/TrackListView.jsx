import React from "react";
import styles from "./TrackListView.module.css";
import { TrashIcon } from "../../ui/Icons";

export default function TrackListView({
  sortedTracks,
  settingsProgress,
  onViewTrack,
  onDeleteTrack,
  onOpenAiWorkoutModal,
  onImportClick,
  parentStyles = {}
}) {
  return (
    <div className={styles['tracks-container']}>
      <div className={styles['tracks-header-row']}>
        <h3 className={parentStyles['settings-group-title']} style={{ margin: 0 }}>
          Available Skill Tracks
        </h3>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            className={styles['track-copy-prompt-btn']}
            onClick={onOpenAiWorkoutModal}
          >
            Custom AI Workout
          </button>
          <button
            type="button"
            className={styles['track-import-btn']}
            onClick={onImportClick}
          >
            Import Track (.json)
          </button>
        </div>
      </div>
      
      <div className={styles['tracks-instructions']}>
        <p className={parentStyles['settings-item-desc']} style={{ margin: 0 }}>
          Double-click a track to inspect workouts, configure difficulty, and select your progression.
        </p>
      </div>

      {sortedTracks.map((track) => {
        const isActive = settingsProgress.active_track_id === track.id;
        return (
          <div
            key={track.id}
            className={`${styles['track-selection-card']} ${isActive ? styles['selected'] : ""}`}
            onDoubleClick={() => onViewTrack(track.id)}
            title="Double click to open exercises"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <h4 className={styles['track-selection-title']}>{track.name}</h4>
                {isActive && <span className={styles['active-track-label']}>Active</span>}
              </div>
              {track.id !== "split_training_program" && (
                <button
                  type="button"
                  className={styles['track-delete-btn']}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTrack(track.id);
                  }}
                  title="Delete Custom Track"
                >
                  <TrashIcon />
                </button>
              )}
            </div>
            <p className={styles['track-selection-desc']}>{track.description}</p>
          </div>
        );
      })}
    </div>
  );
}
