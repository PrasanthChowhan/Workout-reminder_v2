import React from "react";
import styles from "./TrackDetailView.module.css";
import { VideoIcon } from "../../ui/Icons";

export default function TrackLevelItem({
  level,
  isActiveLevel,
  isSelectedTrackCurrentLevel,
  isExcluded,
  onToggleExclude,
  onWatchVideo,
  isActive
}) {
  return (
    <div
      className={`${styles['level-item-card']} ${
        isActiveLevel && isSelectedTrackCurrentLevel
          ? styles['active']
          : ""
      } ${isExcluded ? styles['excluded'] : ""}`}
      style={{ cursor: "default" }}
    >
      <div className={styles['level-item-header']}>
        <div className={styles['level-item-title-col']}>
          <span className={styles['level-item-number']}>L{level.level_number}</span>
          <span className={styles['level-item-title']}>{level.title}</span>
          {level.difficulty && (
            <span className={`${styles['level-item-badge']} ${styles['difficulty']}`}>
              {level.difficulty}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {isActive && isSelectedTrackCurrentLevel && (
            <span className={`${styles['level-item-badge']} ${styles['active']}`}>
              Active
            </span>
          )}
          <button
            type="button"
            className={isExcluded ? styles['exclude-btn-excluded'] : styles['exclude-btn']}
            onClick={(e) => {
              e.stopPropagation();
              onToggleExclude(level.title);
            }}
            title={
              isExcluded
                ? "Include this exercise back into your break and progression list."
                : "Exclude this exercise. It will be skipped during breaks and automatic progression."
            }
          >
            {isExcluded ? "Excluded" : "Exclude"}
          </button>
        </div>
      </div>
      <p className={styles['level-item-desc']}>{level.description}</p>
      <div className={styles['level-item-footer']}>
        <span className={styles['level-item-duration']}>Target hold: {level.target_duration_secs}s</span>
        {level.video_url && level.video_url !== "N/A" && (
          <a
            href={level.video_url}
            className={styles['level-item-video-link']}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onWatchVideo(level.video_url);
            }}
          >
            <VideoIcon width={12} height={12} style={{ marginRight: "0.25rem" }} />
            Watch Video
          </a>
        )}
      </div>
    </div>
  );
}
