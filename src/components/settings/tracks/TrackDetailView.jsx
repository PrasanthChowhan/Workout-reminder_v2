import React from "react";
import styles from "./TrackDetailView.module.css";
import { ArrowLeftIcon, VideoIcon } from "../../ui/Icons";

export default function TrackDetailView({
  selectedTrack,
  isActive,
  completedSessions,
  progressPercent,
  previewTier,
  setPreviewTier,
  filterMode,
  setFilterMode,
  onBack,
  onDeactivate,
  onActivateTrack,
  onToggleExclude,
  onWatchVideo,
  parentStyles = {}
}) {
  const excluded = selectedTrack?.metadata?.excluded_exercises || [];

  // Calculate total excluded exercises count across the entire program (all difficulties)
  const totalExcludedCount = selectedTrack.exercises
    ? selectedTrack.exercises.filter((ex) => excluded.includes(ex.name)).length
    : (selectedTrack.levels || []).filter((lvl) => excluded.includes(lvl.title)).length;

  let displayLevels = [];
  if (filterMode === "only-excluded") {
    if (selectedTrack.exercises) {
      const excludedExercises = selectedTrack.exercises.filter((ex) =>
        excluded.includes(ex.name)
      );
      displayLevels = excludedExercises.map((ex, index) => ({
        level_number: index + 1,
        title: ex.name,
        description: ex.description,
        target_duration_secs: ex.duration_secs,
        video_url: ex.video_url || ex.url || ex.video_link || null,
        difficulty: ex.difficulty
      }));
    } else {
      const excludedLevels = (selectedTrack.levels || []).filter((lvl) =>
        excluded.includes(lvl.title)
      );
      displayLevels = excludedLevels.map((lvl) => ({
        ...lvl,
        difficulty: "All Levels"
      }));
    }
  } else {
    if (isActive) {
      displayLevels = selectedTrack.levels || [];
    } else {
      if (selectedTrack.exercises) {
        const filteredExercises = selectedTrack.exercises.filter(
          (ex) => ex.difficulty.toLowerCase() === previewTier.toLowerCase()
        );

        displayLevels = filteredExercises.map((ex, index) => ({
          level_number: index + 1,
          title: ex.name,
          description: ex.description,
          target_duration_secs: ex.duration_secs,
          video_url: ex.video_url || ex.url || ex.video_link || null
        }));
      } else {
        displayLevels = selectedTrack.levels || [];
      }
    }
  }

  const visibleLevels =
    filterMode === "hide"
      ? displayLevels.filter((lvl) => !excluded.includes(lvl.title))
      : displayLevels;

  return (
    <div className={styles['active-track-panel']}>
      <button type="button" className={styles['back-btn']} onClick={onBack}>
        <ArrowLeftIcon width={14} height={14} style={{ marginRight: "0.25rem" }} />
        Back to Programs
      </button>

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

      {/* Levels / Exercises list */}
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
              isActive && completedSessions !== undefined; // Parent passes whether it's active
            const duration = level.target_duration_secs;
            const isExcluded = excluded.includes(level.title);

            return (
              <div
                key={level.level_number}
                className={`${styles['level-item-card']} ${
                  isActiveLevel && selectedTrack.current_level_number === level.level_number
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
                    {isActive &&
                      selectedTrack.current_level_number === level.level_number && (
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
                  <span className={styles['level-item-duration']}>Target hold: {duration}s</span>
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
          })
        )}
      </div>
    </div>
  );
}
