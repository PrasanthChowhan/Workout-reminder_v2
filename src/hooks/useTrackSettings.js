import { useState, useMemo } from "react";
import { validateTrack, generateLevelsFromExercises, resolveLevelProgressOnToggle } from "../utils/track";
import { toast } from "../utils/toast";

export default function useTrackSettings({
  appConfig,
  setAppConfig,
  settingsProgress,
  setSettingsProgress,
  showConfirm
}) {
  const [viewedTrackId, setViewedTrackId] = useState(null);
  const [previewTier, setPreviewTier] = useState("beginner");
  const [filterMode, setFilterMode] = useState("all");

  const handleToggleExclude = (exerciseTitle) => {
    const selectedTrack = appConfig?.tracks?.find(t => t.id === viewedTrackId);
    if (!selectedTrack) return;

    const currentExcluded = selectedTrack.metadata?.excluded_exercises || [];
    let updatedExcluded;

    const isActive = settingsProgress.active_track_id === selectedTrack.id;
    let displayLevels = [];
    if (isActive) {
      displayLevels = selectedTrack.levels || [];
    } else {
      if (selectedTrack.exercises) {
        displayLevels = generateLevelsFromExercises(selectedTrack.exercises, previewTier);
      } else {
        displayLevels = selectedTrack.levels || [];
      }
    }

    if (currentExcluded.includes(exerciseTitle)) {
      updatedExcluded = currentExcluded.filter(name => name !== exerciseTitle);
      if (updatedExcluded.length === 0) {
        setFilterMode("all");
      }
    } else {
      const activeCount = displayLevels.filter(l => !currentExcluded.includes(l.title)).length;
      if (activeCount <= 1) {
        toast.error("You must keep at least one exercise active in the program.");
        return;
      }
      updatedExcluded = [...currentExcluded, exerciseTitle];
    }

    const updatedTracks = appConfig.tracks.map(track => {
      if (track.id === selectedTrack.id) {
        return {
          ...track,
          metadata: { ...track.metadata, excluded_exercises: updatedExcluded }
        };
      }
      return track;
    });

    let newSettingsProgress = { ...settingsProgress };
    const progressUpdate = resolveLevelProgressOnToggle(
      isActive,
      displayLevels,
      settingsProgress.current_level_number,
      exerciseTitle,
      currentExcluded,
      updatedExcluded
    );
    if (progressUpdate) {
      newSettingsProgress = { ...newSettingsProgress, ...progressUpdate };
    }

    setAppConfig({ ...appConfig, tracks: updatedTracks });
    setSettingsProgress(newSettingsProgress);
  };

  const sortedTracks = useMemo(() => {
    if (!appConfig?.tracks) return [];
    const tracksCopy = [...appConfig.tracks];
    return tracksCopy.sort((a, b) => {
      const aActive = settingsProgress.active_track_id === a.id;
      const bActive = settingsProgress.active_track_id === b.id;
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return 0;
    });
  }, [appConfig?.tracks, settingsProgress.active_track_id]);

  const handlePasteTrack = (jsonStr, onSuccess) => {
    try {
      if (!jsonStr || !jsonStr.trim()) {
        toast.error("Please paste the AI-generated JSON response.");
        return;
      }
      
      const importedTrack = JSON.parse(jsonStr.trim());
      const validationError = validateTrack(importedTrack);
      if (validationError) {
        toast.error(`Validation error: ${validationError}`);
        return;
      }

      const updatedTracks = [...(appConfig?.tracks || [])];
      const existingIndex = updatedTracks.findIndex(t => t.id === importedTrack.id);

      if (existingIndex > -1) {
        showConfirm(
          `Track with ID "${importedTrack.id}" already exists. Do you want to overwrite it?`,
          () => {
            const tracksCopy = [...(appConfig?.tracks || [])];
            const idx = tracksCopy.findIndex(t => t.id === importedTrack.id);
            tracksCopy[idx] = importedTrack;
            setAppConfig({ ...appConfig, tracks: tracksCopy });
            setViewedTrackId(importedTrack.id);
            setPreviewTier("beginner");
            if (onSuccess) onSuccess();
            toast.success(`Track "${importedTrack.name}" updated!`);
          }
        );
      } else {
        updatedTracks.push(importedTrack);
        setAppConfig({ ...appConfig, tracks: updatedTracks });
        setViewedTrackId(importedTrack.id);
        setPreviewTier("beginner");
        if (onSuccess) onSuccess();
        toast.success(`Track "${importedTrack.name}" imported!`);
      }
    } catch (err) {
      toast.error("Failed to parse pasted JSON. Please check the format.");
    }
  };

  const handleImportTrack = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedTrack = JSON.parse(event.target.result);
        const validationError = validateTrack(importedTrack);
        if (validationError) {
          toast.error(`Validation error: ${validationError}`);
          return;
        }

        const updatedTracks = [...(appConfig?.tracks || [])];
        const existingIndex = updatedTracks.findIndex(t => t.id === importedTrack.id);

        if (existingIndex > -1) {
          showConfirm(
            `Track with ID "${importedTrack.id}" already exists. Do you want to overwrite it?`,
            () => {
              const tracksCopy = [...(appConfig?.tracks || [])];
              const idx = tracksCopy.findIndex(t => t.id === importedTrack.id);
              tracksCopy[idx] = importedTrack;
              setAppConfig({ ...appConfig, tracks: tracksCopy });
              setViewedTrackId(importedTrack.id);
              setPreviewTier("beginner");
              toast.success(`Track "${importedTrack.name}" updated!`);
            }
          );
        } else {
          updatedTracks.push(importedTrack);
          setAppConfig({ ...appConfig, tracks: updatedTracks });
          setViewedTrackId(importedTrack.id);
          setPreviewTier("beginner");
          toast.success(`Track "${importedTrack.name}" imported!`);
        }
      } catch (err) {
        toast.error("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleDeleteTrack = (trackId) => {
    if (trackId === "split_training_program") return;
    
    showConfirm(
      "Are you sure you want to delete this custom track?",
      () => {
        const updatedTracks = (appConfig?.tracks || []).filter(t => t.id !== trackId);
        
        let newProgress = { ...settingsProgress };
        if (settingsProgress.active_track_id === trackId) {
          newProgress = {
            active_track_id: null,
            current_level_number: null,
            onboarding_tier: null,
            completed_sessions_count: 0,
            last_completed_at: null,
            level_started_at: null
          };
          setSettingsProgress(newProgress);
        }

        setAppConfig({ ...appConfig, tracks: updatedTracks });
        setSettingsProgress(newProgress);
        toast.info("Custom track deleted.");

        if (viewedTrackId === trackId) {
          setViewedTrackId(null);
        }
      }
    );
  };

  const handleActivateTrack = (tier) => {
    const selectedTrack = appConfig?.tracks?.find(t => t.id === viewedTrackId);
    if (!selectedTrack) return;
    
    showConfirm(
      `Are you sure you want to choose "${selectedTrack.name}" as your active track with ${tier.toUpperCase()} tier?`,
      () => {
        let startingLevel = 1;
        let updatedTracks = [...(appConfig?.tracks || [])];

        if (selectedTrack.exercises) {
          const levels = generateLevelsFromExercises(selectedTrack.exercises, tier);
          const trackIndex = updatedTracks.findIndex(t => t.id === viewedTrackId);
          if (trackIndex > -1) {
            updatedTracks[trackIndex] = {
              ...selectedTrack,
              levels: levels.length > 0 ? levels : selectedTrack.levels
            };
          }
          const excluded = selectedTrack.metadata?.excluded_exercises || [];
          const activeLevels = levels.length > 0 ? levels : (selectedTrack.levels || []);
          const firstNonExcluded = activeLevels.find(l => !excluded.includes(l.title));
          startingLevel = firstNonExcluded ? firstNonExcluded.level_number : 1;
        }

        setSettingsProgress({
          active_track_id: viewedTrackId,
          onboarding_tier: tier,
          current_level_number: startingLevel,
          completed_sessions_count: 0,
          last_completed_at: null,
          level_started_at: new Date().toISOString()
        });

        if (selectedTrack.exercises) {
          setAppConfig({ ...appConfig, tracks: updatedTracks });
        }
      }
    );
  };

  const handleDeactivateTrack = () => {
    setSettingsProgress({
      active_track_id: null,
      current_level_number: null,
      onboarding_tier: null,
      completed_sessions_count: 0,
      last_completed_at: null,
      level_started_at: null
    });
  };

  const selectedTrack = viewedTrackId ? appConfig?.tracks?.find(t => t.id === viewedTrackId) : null;
  const isSelectedTrackActive = selectedTrack && settingsProgress.active_track_id === selectedTrack.id;

  return {
    viewedTrackId,
    setViewedTrackId,
    previewTier,
    setPreviewTier,
    filterMode,
    setFilterMode,
    sortedTracks,
    selectedTrack,
    isSelectedTrackActive,
    handleToggleExclude,
    handlePasteTrack,
    handleImportTrack,
    handleDeleteTrack,
    handleActivateTrack,
    handleDeactivateTrack
  };
}
