import React from "react";
import styles from "./TrackDetailView.module.css";
import { ArrowLeftIcon } from "../../ui/Icons";
import TrackHeader from "./TrackHeader";
import TrackLevelList from "./TrackLevelList";

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

      <TrackHeader
        selectedTrack={selectedTrack}
        isActive={isActive}
        previewTier={previewTier}
        setPreviewTier={setPreviewTier}
        completedSessions={completedSessions}
        progressPercent={progressPercent}
        onDeactivate={onDeactivate}
        onActivateTrack={onActivateTrack}
      />

      <TrackLevelList
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        isActive={isActive}
        totalExcludedCount={totalExcludedCount}
        displayLevels={displayLevels}
        visibleLevels={visibleLevels}
        excluded={excluded}
        selectedTrack={selectedTrack}
        completedSessions={completedSessions}
        onToggleExclude={onToggleExclude}
        onWatchVideo={onWatchVideo}
        parentStyles={parentStyles}
      />
    </div>
  );
}
