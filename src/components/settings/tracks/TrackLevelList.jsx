import React from "react";
import styles from "./TrackDetailView.module.css";
import TrackLevelItem from "./TrackLevelItem";

export default function TrackLevelList({
  filterMode,
  setFilterMode,
  isActive,
  totalExcludedCount,
  displayLevels,
  visibleLevels,
  excluded,
  selectedTrack,
  completedSessions,
  onToggleExclude,
  onWatchVideo,
  parentStyles
}) {
  return (
    <div className={styles['levels-list-container']}>
      <div className={styles['levels-list-header-row']}>
        <h4 className={styles['levels-list-title']}>
          {filterMode === "only-excluded"
            ? "Excluded Exercises (Across Program)"
            : isActive
            ? "Track Levels"
            : "Progression Preview"}
        </h4>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label className={styles['filter-label']}>Filter:</label>
          <select
            className={styles['filter-select']}
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
          >
            <option value="all">Show All</option>
            <option value="hide">Hide Excluded</option>
            {totalExcludedCount > 0 && (
              <option value="only-excluded">Excluded Only ({totalExcludedCount})</option>
            )}
          </select>
        </div>
      </div>

      {displayLevels.length === 0 ? (
        <p className={parentStyles['settings-item-desc']}>
          No exercises available for this tier.
        </p>
      ) : visibleLevels.length === 0 ? (
        <p className={parentStyles['settings-item-desc']}>
          All exercises in this tier are excluded.
        </p>
      ) : (
        visibleLevels.map((level) => {
          const isActiveLevel =
            isActive && completedSessions !== undefined;
          const isExcluded = excluded.includes(level.title);

          return (
            <TrackLevelItem
              key={level.level_number}
              level={level}
              isActiveLevel={isActiveLevel}
              isSelectedTrackCurrentLevel={selectedTrack.current_level_number === level.level_number}
              isExcluded={isExcluded}
              onToggleExclude={onToggleExclude}
              onWatchVideo={onWatchVideo}
              isActive={isActive}
            />
          );
        })
      )}
    </div>
  );
}
