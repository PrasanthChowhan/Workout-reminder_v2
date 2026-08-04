import React, { useState, useRef } from "react";
import { validateTrack } from "../../utils/track";
import styles from "./TracksTab.module.css";
import trainingProgramSchema from "../../../docs/schemas/training-program.schema.json";
import { generateAiPrompt } from "../../utils/aiPrompt";
import { openUrl } from "../../utils/tauri";
import EmbeddedPlayer from "../EmbeddedPlayer";
import { toast } from "../../utils/toast";

const DIFFICULTY_LEVELS = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4
};

const getDifficultyPriority = (diff) => {
  if (!diff) return 1;
  return DIFFICULTY_LEVELS[diff.toLowerCase()] || 1;
};

const GOAL_PRESETS = [
  { value: "hip mobility", label: "Hip Mobility" },
  { value: "core strengthening", label: "Core Strengthening" },
  { value: "shoulder stability", label: "Shoulder Stability" },
  { value: "lower body strength", label: "Lower Body Strength" },
  { value: "posture improvement", label: "Posture Improvement" },
  { value: "lower back pain relief", label: "Lower Back Pain Relief" },
  { value: "wrist & forearm mobility", label: "Wrist & Forearm Mobility" },
  { value: "hamstring flexibility", label: "Hamstring Flexibility" },
];

const EQUIPMENT_PRESETS = [
  { value: "[]", label: "Bodyweight (No Equipment)" },
  { value: '["Mat"]', label: "Mat Only" },
  { value: '["Resistance Band"]', label: "Resistance Band Only" },
  { value: '["Mat", "Resistance Band"]', label: "Mat & Resistance Band" },
];

const DURATION_PRESETS = [
  { value: "5", label: "5 Minutes" },
  { value: "10", label: "10 Minutes" },
  { value: "15", label: "15 Minutes" },
  { value: "20", label: "20 Minutes" },
  { value: "30", label: "30 Minutes" },
];

const INJURY_PRESETS = [
  { value: "none", label: "None (Healthy)" },
  { value: "knee pain", label: "Knee Pain / Limitations" },
  { value: "wrist pain", label: "Wrist Pain / Carpal Tunnel" },
  { value: "lower back pain", label: "Lower Back Pain" },
  { value: "shoulder pain", label: "Shoulder Pain / Stiffness" },
];

const STYLE_PRESETS = [
  { value: "general", label: "General" },
  { value: "mobility-focused", label: "Mobility Focused" },
  { value: "strength-focused", label: "Strength Focused" },
  { value: "rehab-friendly", label: "Rehab & Recovery" },
  { value: "yoga/stretching", label: "Yoga & Stretching" },
];


/**
 * TracksTab handles selecting physical tracks, flex tiers, importing custom tracks,
 * deactivating current track, and deleting custom tracks. It implements React-based
 * non-blocking confirmation and notification overlays.
 * 
 * @param {object} props
 * @param {object} props.appConfig Application configuration reference
 * @param {function} props.setAppConfig Parent callback to update active application configuration
 * @param {object} props.settingsProgress Current progress configuration structure
 * @param {function} props.setSettingsProgress Callback to update settings progress
 * @param {object} props.parentStyles General settings CSS module styles object from parent
 */
export default function TracksTab({ 
  appConfig, 
  setAppConfig, 
  settingsProgress, 
  setSettingsProgress,
  parentStyles
}) {
  const [viewedTrackId, setViewedTrackId] = useState(null);
  const [previewTier, setPreviewTier] = useState("beginner");
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);
  // Custom dialog states (to avoid thread-blocking window.confirm)
  const [confirmDialog, setConfirmDialog] = useState(null); // { message, onConfirm }
  const [showAiWorkoutModal, setShowAiWorkoutModal] = useState(false);
  const [pastedJson, setPastedJson] = useState("");
  const [hideExcluded, setHideExcluded] = useState(false);
  
  // Custom AI prompt input states
  const [aiGoalSelect, setAiGoalSelect] = useState("hip mobility");
  const [aiGoalCustom, setAiGoalCustom] = useState("");
  const [aiLevel, setAiLevel] = useState("beginner");
  const [aiEquipmentSelect, setAiEquipmentSelect] = useState("[]");
  const [aiEquipmentCustom, setAiEquipmentCustom] = useState("");
  const [aiDurationSelect, setAiDurationSelect] = useState("15");
  const [aiDurationCustom, setAiDurationCustom] = useState("");
  const [aiInjuriesSelect, setAiInjuriesSelect] = useState("none");
  const [aiInjuriesCustom, setAiInjuriesCustom] = useState("");
  const [aiStyleSelect, setAiStyleSelect] = useState("general");
  const [aiStyleCustom, setAiStyleCustom] = useState("");
  
  const fileInputRef = useRef(null);

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
        const filteredExercises = selectedTrack.exercises.filter(ex => {
          return ex.difficulty.toLowerCase() === previewTier.toLowerCase();
        });
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

    if (currentExcluded.includes(exerciseTitle)) {
      updatedExcluded = currentExcluded.filter(name => name !== exerciseTitle);
    } else {
      const activeCount = displayLevels.filter(l => !currentExcluded.includes(l.title)).length;
      if (activeCount <= 1) {
        toast.error("You must keep at least one exercise active in the program.");
        return;
      }
      updatedExcluded = [...currentExcluded, exerciseTitle];
    }

    // Update track metadata
    const updatedTracks = appConfig.tracks.map(track => {
      if (track.id === selectedTrack.id) {
        return {
          ...track,
          metadata: {
            ...track.metadata,
            excluded_exercises: updatedExcluded
          }
        };
      }
      return track;
    });

    let newSettingsProgress = { ...settingsProgress };
    if (isActive) {
      const activeLevel = displayLevels.find(l => l.level_number === settingsProgress.current_level_number);
      if (activeLevel && activeLevel.title === exerciseTitle && !currentExcluded.includes(exerciseTitle)) {
        // Find a resolved level number
        let resolvedLevelNum = null;
        for (let num = settingsProgress.current_level_number; num <= displayLevels.length; num++) {
          const lvl = displayLevels.find(l => l.level_number === num);
          if (lvl && lvl.title !== exerciseTitle && !updatedExcluded.includes(lvl.title)) {
            resolvedLevelNum = num;
            break;
          }
        }
        if (!resolvedLevelNum) {
          for (let num = settingsProgress.current_level_number - 1; num >= 1; num--) {
            const lvl = displayLevels.find(l => l.level_number === num);
            if (lvl && lvl.title !== exerciseTitle && !updatedExcluded.includes(lvl.title)) {
              resolvedLevelNum = num;
              break;
            }
          }
        }
        if (resolvedLevelNum) {
          newSettingsProgress.current_level_number = resolvedLevelNum;
          newSettingsProgress.completed_sessions_count = 0;
        } else {
          newSettingsProgress.current_level_number = null;
          newSettingsProgress.completed_sessions_count = 0;
        }
      } else if (settingsProgress.current_level_number === null) {
        if (currentExcluded.includes(exerciseTitle)) {
          const lvl = displayLevels.find(l => l.title === exerciseTitle);
          if (lvl) {
            newSettingsProgress.current_level_number = lvl.level_number;
            newSettingsProgress.completed_sessions_count = 0;
          }
        }
      }
    }

    setAppConfig({
      ...appConfig,
      tracks: updatedTracks
    });
    setSettingsProgress(newSettingsProgress);
  };

  // Pin active track at the top
  const sortedTracks = React.useMemo(() => {
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

  const showConfirm = (message, onConfirm) => {
    setConfirmDialog({ message, onConfirm });
  };

  const showNotify = (message) => {
    if (message.toLowerCase().includes("error") || message.toLowerCase().includes("failed") || message.toLowerCase().includes("validation")) {
      toast.error(message);
    } else {
      toast.success(message);
    }
  };

  const handleCopyPrompt = async () => {
    try {
      const getParamValue = (selectVal, customVal) => {
        return selectVal === "custom" ? customVal : selectVal;
      };

      const fullPrompt = generateAiPrompt(trainingProgramSchema, {
        userGoal: getParamValue(aiGoalSelect, aiGoalCustom) || "hip mobility",
        userLevel: aiLevel === "progression" ? "Progression (Beginner to Advanced)" : aiLevel.charAt(0).toUpperCase() + aiLevel.slice(1),
        availableEquipment: getParamValue(aiEquipmentSelect, aiEquipmentCustom) || "[]",
        sessionDuration: getParamValue(aiDurationSelect, aiDurationCustom) || "15",
        injuries: getParamValue(aiInjuriesSelect, aiInjuriesCustom) || "none",
        preferredStyle: getParamValue(aiStyleSelect, aiStyleCustom) || "general"
      });
      await navigator.clipboard.writeText(fullPrompt);
      toast.success("AI Prompt copied with custom parameters!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to copy prompt.");
    }
  };

  const handlePasteTrack = (jsonStr) => {
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
            setAppConfig({
              ...appConfig,
              tracks: tracksCopy
            });
            setViewedTrackId(importedTrack.id);
            setPreviewTier("beginner");
            setShowAiWorkoutModal(false);
            setPastedJson("");
            toast.success(`Track "${importedTrack.name}" updated!`);
          }
        );
      } else {
        updatedTracks.push(importedTrack);
        setAppConfig({
          ...appConfig,
          tracks: updatedTracks
        });
        setViewedTrackId(importedTrack.id);
        setPreviewTier("beginner");
        setShowAiWorkoutModal(false);
        setPastedJson("");
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
              setAppConfig({
                ...appConfig,
                tracks: tracksCopy
              });
              setViewedTrackId(importedTrack.id);
              setPreviewTier("beginner");
              toast.success(`Track "${importedTrack.name}" updated!`);
            }
          );
        } else {
          updatedTracks.push(importedTrack);
          setAppConfig({
            ...appConfig,
            tracks: updatedTracks
          });
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

        const updatedConfig = {
          ...appConfig,
          tracks: updatedTracks
        };

        setAppConfig(updatedConfig);
        setSettingsProgress(newProgress);
        toast.info("Custom track deleted.");

        if (viewedTrackId === trackId) {
          setViewedTrackId(null);
        }
      }
    );
  };

  return (
    <div className={parentStyles['tab-pane'] || "tab-pane"}>
      {viewedTrackId ? (
        /* Detailed Track View */
        (() => {
          const selectedTrack = appConfig?.tracks?.find(t => t.id === viewedTrackId);
          if (!selectedTrack) return <p className={parentStyles['settings-item-desc']}>Track not found.</p>;
          const isActive = settingsProgress.active_track_id === selectedTrack.id;
          const completedSessions = settingsProgress.completed_sessions_count || 0;
          const progressPercent = Math.min((completedSessions / 5) * 100, 100);

          return (
            <div className={styles['active-track-panel']}>
              <button 
                type="button" 
                className={styles['back-btn']} 
                onClick={() => setViewedTrackId(null)}
              >
                <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="14" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: "0.25rem" }}>
                  <line x1="19" x2="5" y1="12" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Back to Programs
              </button>

              <div className={styles['active-track-header']} style={!isActive ? { backgroundColor: "rgba(255, 255, 255, 0.01)", borderColor: "rgba(255, 255, 255, 0.05)" } : {}}>
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
                      onClick={() => {
                        setSettingsProgress({
                          active_track_id: null,
                          current_level_number: null,
                          onboarding_tier: null,
                          completed_sessions_count: 0,
                          last_completed_at: null,
                          level_started_at: null
                        });
                      }}
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles['track-action-btn']}
                      style={{ padding: "0.4rem 0.8rem", fontSize: "0.7rem" }}
                      onClick={() => {
                        showConfirm(
                          `Are you sure you want to choose "${selectedTrack.name}" as your active track with ${previewTier.toUpperCase()} tier?`,
                          () => {
                            let startingLevel = 1;
                            let updatedTracks = [...(appConfig?.tracks || [])];

                            if (selectedTrack && selectedTrack.exercises) {
                              const filteredExercises = selectedTrack.exercises.filter(ex => {
                                return ex.difficulty.toLowerCase() === previewTier.toLowerCase();
                              });

                              const levels = filteredExercises.map((ex, index) => {
                                const repsStr = ex.reps 
                                  ? ex.reps 
                                  : (ex.reps_min && ex.reps_max) 
                                    ? `${ex.reps_min}-${ex.reps_max} Reps` 
                                    : ex.reps_min 
                                      ? `${ex.reps_min} Reps` 
                                      : `${ex.duration_secs}s Hold`;

                                return {
                                  level_number: index + 1,
                                  title: ex.name,
                                  description: `${ex.description}\n\n• Category: ${ex.category}\n• Target: ${(ex.target_muscles || ex.muscle_groups || []).join(", ")}\n• Side: ${ex.is_unilateral ? "Unilateral (Perform per side)" : "Bilateral"}\n• Equipment: ${(ex.equipment && ex.equipment.length > 0) ? ex.equipment.join(", ") : "None"}\n• Rest: ${ex.rest_secs ? ex.rest_secs + 's' : "None"}\n• Instructions: ${repsStr} (${ex.sets} Sets)`,
                                  target_duration_secs: ex.duration_secs,
                                  video_url: ex.video_url || ex.url || ex.video_link || null,
                                  image_url: ex.image_url || null,
                                  is_unilateral: ex.is_unilateral || false,
                                  equipment: ex.equipment || [],
                                  rest_secs: ex.rest_secs || 0,
                                  reps: repsStr,
                                  sets: ex.sets || 3
                                };
                              });

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
                              if (firstNonExcluded) {
                                startingLevel = firstNonExcluded.level_number;
                              } else {
                                startingLevel = 1;
                              }
                            }

                            setSettingsProgress({
                              active_track_id: viewedTrackId,
                              onboarding_tier: previewTier,
                              current_level_number: startingLevel,
                              completed_sessions_count: 0,
                              last_completed_at: null,
                              level_started_at: new Date().toISOString()
                            });

                            if (selectedTrack && selectedTrack.exercises) {
                              setAppConfig({
                                ...appConfig,
                                tracks: updatedTracks
                              });
                            }
                          }
                        );
                      }}
                    >
                      Choose Track & Start
                    </button>
                  )}
                </div>
                <p className={styles['track-selection-desc']} style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  {selectedTrack.description}
                </p>
                
                <div className={styles['active-track-info-row']}>
                  <span>
                    Tier: <strong>{(isActive ? settingsProgress.onboarding_tier : previewTier)?.toUpperCase()}</strong>
                  </span>
                  <div>
                    <label style={{ marginRight: '0.5rem' }}>Difficulty Tier:</label>
                    <select
                      className={styles['active-track-tier-select']}
                      value={isActive ? (settingsProgress.onboarding_tier || "beginner") : previewTier}
                      onChange={(e) => {
                        const newTier = e.target.value;
                        if (isActive) {
                          const track = appConfig?.tracks?.find(t => t.id === viewedTrackId);
                          let updatedTracks = [...(appConfig?.tracks || [])];
                          let newLevelNum = settingsProgress.current_level_number;

                          if (track && track.exercises) {
                            const filteredExercises = track.exercises.filter(ex => {
                              return ex.difficulty.toLowerCase() === newTier.toLowerCase();
                            });

                            const levels = filteredExercises.map((ex, index) => {
                              const repsStr = ex.reps 
                                ? ex.reps 
                                : (ex.reps_min && ex.reps_max) 
                                  ? `${ex.reps_min}-${ex.reps_max} Reps` 
                                  : ex.reps_min 
                                    ? `${ex.reps_min} Reps` 
                                    : `${ex.duration_secs}s Hold`;

                              return {
                                level_number: index + 1,
                                title: ex.name,
                                description: `${ex.description}\n\n• Category: ${ex.category}\n• Target: ${(ex.target_muscles || ex.muscle_groups || []).join(", ")}\n• Side: ${ex.is_unilateral ? "Unilateral (Perform per side)" : "Bilateral"}\n• Equipment: ${(ex.equipment && ex.equipment.length > 0) ? ex.equipment.join(", ") : "None"}\n• Rest: ${ex.rest_secs ? ex.rest_secs + 's' : "None"}\n• Instructions: ${repsStr} (${ex.sets} Sets)`,
                                target_duration_secs: ex.duration_secs,
                                video_url: ex.video_url || ex.url || ex.video_link || null,
                                image_url: ex.image_url || null,
                                is_unilateral: ex.is_unilateral || false,
                                equipment: ex.equipment || [],
                                rest_secs: ex.rest_secs || 0,
                                reps: repsStr,
                                sets: ex.sets || 3
                              };
                            });

                            const trackIndex = updatedTracks.findIndex(t => t.id === viewedTrackId);
                            if (trackIndex > -1) {
                              updatedTracks[trackIndex] = {
                                ...track,
                                levels: levels.length > 0 ? levels : track.levels
                              };
                            }
                            const excluded = track.metadata?.excluded_exercises || [];
                            const firstNonExcluded = levels.find(l => !excluded.includes(l.title));
                            if (firstNonExcluded) {
                              newLevelNum = firstNonExcluded.level_number;
                            } else {
                              newLevelNum = 1;
                            }
                          }

                          setSettingsProgress({
                            ...settingsProgress,
                            onboarding_tier: newTier,
                            current_level_number: newLevelNum,
                            completed_sessions_count: 0
                          });

                          if (track && track.exercises) {
                            setAppConfig({
                              ...appConfig,
                              tracks: updatedTracks
                            });
                          }
                        } else {
                          setPreviewTier(newTier);
                        }
                      }}
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
                    <div className={styles['active-track-info-row']} style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                      <span>Completed Sessions (Current Level): {completedSessions} / 5</span>
                    </div>
                    <div className={styles['active-track-progress-bar-container']}>
                      <div className={styles['active-track-progress-bar']} style={{ width: `${progressPercent}%` }}></div>
                    </div>
                  </>
                )}
              </div>

              {/* Levels / Exercises list */}
              <div className={styles['levels-list-container'] || "levels-list-container"}>
                {(() => {
                  let displayLevels = [];
                  if (isActive) {
                    displayLevels = selectedTrack.levels || [];
                  } else {
                    if (selectedTrack.exercises) {
                      const filteredExercises = selectedTrack.exercises.filter(ex => {
                        return ex.difficulty.toLowerCase() === previewTier.toLowerCase();
                      });

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

                  const excluded = selectedTrack?.metadata?.excluded_exercises || [];
                  const excludedCount = displayLevels.filter(lvl => excluded.includes(lvl.title)).length;
                  const visibleLevels = hideExcluded 
                    ? displayLevels.filter(lvl => !excluded.includes(lvl.title)) 
                    : displayLevels;

                  return (
                    <>
                      <div className={styles['levels-list-header-row']}>
                        <h4 className={styles['levels-list-title']}>
                          {isActive ? "Track Levels" : "Progression Preview"}
                        </h4>
                        {excludedCount > 0 && (
                          <label className={styles['hide-excluded-label']}>
                            <input
                              type="checkbox"
                              className={styles['hide-excluded-checkbox']}
                              checked={hideExcluded}
                              onChange={(e) => setHideExcluded(e.target.checked)}
                            />
                            Hide Excluded ({excludedCount})
                          </label>
                        )}
                      </div>

                      {displayLevels.length === 0 ? (
                        <p className={parentStyles['settings-item-desc']}>No exercises available for this tier.</p>
                      ) : visibleLevels.length === 0 ? (
                        <p className={parentStyles['settings-item-desc']}>All exercises in this tier are excluded.</p>
                      ) : (
                        visibleLevels.map(level => {
                          const isActiveLevel = isActive && settingsProgress.current_level_number === level.level_number;
                          const isCompleted = isActive && settingsProgress.current_level_number > level.level_number;
                          const isLocked = isActive && settingsProgress.current_level_number < level.level_number;

                          const duration = level.target_duration_secs;
                          const isExcluded = excluded.includes(level.title);

                          return (
                            <div
                              key={level.level_number}
                              className={`${styles['level-item-card']} ${isActiveLevel ? styles['active'] : ""} ${isExcluded ? styles['excluded'] : ""}`}
                              style={{ cursor: "default" }}
                            >
                              <div className={styles['level-item-header']}>
                                <div className={styles['level-item-title-col']}>
                                  <span className={styles['level-item-number']}>L{level.level_number}</span>
                                  <span className={styles['level-item-title']}>{level.title}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                  {isActive && isActiveLevel && (
                                    <span className={`${styles['level-item-badge']} ${styles['active']}`}>
                                      Active
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    className={isExcluded ? styles['exclude-btn-excluded'] : styles['exclude-btn']}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleExclude(level.title);
                                    }}
                                    title={isExcluded 
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
                                      setActiveVideoUrl(level.video_url);
                                    }}
                                  >
                                    <svg fill="none" height="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="12" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: "0.25rem" }}>
                                      <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                      <rect height="14" rx="2" ry="2" width="15" x="1" y="5"></rect>
                                    </svg>
                                    Watch Video
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </>
                  );
                })()}
              </div>

            </div>
          );
        })()
      ) : (
        /* Default Programs List View */
        <div className={styles['tracks-container']}>
          <div className={styles['tracks-header-row']}>
            <h3 className={parentStyles['settings-group-title']} style={{ margin: 0 }}>Available Skill Tracks</h3>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                className={styles['track-copy-prompt-btn']}
                onClick={() => {
                  setPastedJson("");
                  setShowAiWorkoutModal(true);
                }}
              >
                Custom AI Workout
              </button>
              <button
                type="button"
                className={styles['track-import-btn']}
                onClick={() => fileInputRef.current?.click()}
              >
                Import Track (.json)
              </button>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept=".json"
            onChange={handleImportTrack}
          />
          <div className={styles['tracks-instructions']}>
            <p className={parentStyles['settings-item-desc']} style={{ margin: 0 }}>
              Double-click a track to inspect workouts, configure difficulty, and select your progression.
            </p>
          </div>

          {sortedTracks.map(track => {
            const isActive = settingsProgress.active_track_id === track.id;
            return (
              <div 
                key={track.id} 
                className={`${styles['track-selection-card']} ${isActive ? styles['selected'] : ""}`}
                onDoubleClick={() => {
                  setViewedTrackId(track.id);
                  setPreviewTier(isActive ? (settingsProgress.onboarding_tier || "beginner") : "beginner");
                }}
                title="Double click to open exercises"
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <h4 className={styles['track-selection-title']}>{track.name}</h4>
                    {isActive && (
                      <span className={styles['active-track-label']}>Active</span>
                    )}
                  </div>
                  {track.id !== "split_training_program" && (
                    <button
                      type="button"
                      className={styles['track-delete-btn']}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTrack(track.id);
                      }}
                      title="Delete Custom Track"
                    >
                      <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  )}
                </div>
                <p className={styles['track-selection-desc']}>{track.description}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom AI Workout Overlay */}
      {showAiWorkoutModal && (
        <div className={styles['dialog-overlay']} style={{ zIndex: 250 }} onClick={() => setShowAiWorkoutModal(false)}>
          <div className={styles['dialog-modal']} style={{ maxWidth: "550px", padding: "2.5rem" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 className={parentStyles['settings-title']} style={{ borderBottom: "none", margin: 0, fontSize: "1.2rem" }}>
                Custom AI Workout
              </h3>
              <button
                type="button"
                className={styles['track-delete-btn']}
                onClick={() => setShowAiWorkoutModal(false)}
                title="Close Modal"
              >
                <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                  <line x1="18" x2="6" y1="6" y2="18"></line>
                  <line x1="6" x2="18" y1="6" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className={styles['ai-routine-info']} style={{ marginBottom: "1.5rem", backgroundColor: "rgba(255, 92, 0, 0.02)", borderColor: "rgba(255, 92, 0, 0.15)" }}>
              <span className={styles['ai-routine-tag']} style={{ color: "var(--color-brand-orange)", backgroundColor: "rgba(255, 92, 0, 0.1)" }}>
                Instructions
              </span>
              <p className={parentStyles['settings-item-desc']} style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)", lineHeight: "1.5" }}>
                Generate custom training programs using AI. Follow these steps:
              </p>
              <ol className={parentStyles['settings-item-desc']} style={{ margin: "0.5rem 0 0 1.25rem", padding: 0, fontSize: "0.8rem", color: "var(--color-text-muted)", lineHeight: "1.5" }}>
                <li>Click <strong>"Copy AI Prompt"</strong> below to copy the system prompt & JSON schema.</li>
                <li>Paste the prompt into any AI tool (Gemini, Claude, ChatGPT, etc.) to generate your custom program.</li>
                <li>Paste the resulting JSON block in the textarea below and click <strong>"Apply Program"</strong>.</li>
              </ol>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "1.5rem" }}>
              {/* Goal / Focus Topic & Difficulty Level */}
              <div className={styles['ai-input-grid']}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <label className={parentStyles['settings-item-title'] || styles['levels-list-title']} style={{ fontSize: "0.8rem", textTransform: "none", letterSpacing: "normal" }}>
                    Goal / Focus Topic
                  </label>
                  <select
                    className={styles['ai-select']}
                    value={aiGoalSelect}
                    onChange={(e) => setAiGoalSelect(e.target.value)}
                  >
                    {GOAL_PRESETS.map((preset) => (
                      <option key={preset.value} value={preset.value}>{preset.label}</option>
                    ))}
                    <option value="custom">Custom...</option>
                  </select>
                  {aiGoalSelect === "custom" && (
                    <input
                      type="text"
                      className={styles['ai-input']}
                      style={{ marginTop: "0.35rem" }}
                      value={aiGoalCustom}
                      onChange={(e) => setAiGoalCustom(e.target.value)}
                      placeholder="e.g., handstand prep, neck release"
                      autoFocus
                    />
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <label className={parentStyles['settings-item-title'] || styles['levels-list-title']} style={{ fontSize: "0.8rem", textTransform: "none", letterSpacing: "normal" }}>
                    Difficulty Level
                  </label>
                  <select
                    className={styles['ai-select']}
                    value={aiLevel}
                    onChange={(e) => setAiLevel(e.target.value)}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="progression">Progression (Beginner to Advanced)</option>
                  </select>
                </div>
              </div>

              {/* Available Equipment & Duration */}
              <div className={styles['ai-input-grid']}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <label className={parentStyles['settings-item-title'] || styles['levels-list-title']} style={{ fontSize: "0.8rem", textTransform: "none", letterSpacing: "normal" }}>
                    Available Equipment
                  </label>
                  <select
                    className={styles['ai-select']}
                    value={aiEquipmentSelect}
                    onChange={(e) => setAiEquipmentSelect(e.target.value)}
                  >
                    {EQUIPMENT_PRESETS.map((preset) => (
                      <option key={preset.value} value={preset.value}>{preset.label}</option>
                    ))}
                    <option value="custom">Custom...</option>
                  </select>
                  {aiEquipmentSelect === "custom" && (
                    <input
                      type="text"
                      className={styles['ai-input']}
                      style={{ marginTop: "0.35rem" }}
                      value={aiEquipmentCustom}
                      onChange={(e) => setAiEquipmentCustom(e.target.value)}
                      placeholder='e.g., ["Mat", "Resistance Band"] or []'
                      autoFocus
                    />
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <label className={parentStyles['settings-item-title'] || styles['levels-list-title']} style={{ fontSize: "0.8rem", textTransform: "none", letterSpacing: "normal" }}>
                    Duration (Minutes)
                  </label>
                  <select
                    className={styles['ai-select']}
                    value={aiDurationSelect}
                    onChange={(e) => setAiDurationSelect(e.target.value)}
                  >
                    {DURATION_PRESETS.map((preset) => (
                      <option key={preset.value} value={preset.value}>{preset.label}</option>
                    ))}
                    <option value="custom">Custom...</option>
                  </select>
                  {aiDurationSelect === "custom" && (
                    <input
                      type="number"
                      min="5"
                      max="60"
                      className={styles['ai-input']}
                      style={{ marginTop: "0.35rem" }}
                      value={aiDurationCustom}
                      onChange={(e) => setAiDurationCustom(e.target.value)}
                      placeholder="e.g. 15"
                      autoFocus
                    />
                  )}
                </div>
              </div>

              {/* Injuries / Limitations & Preferred Style */}
              <div className={styles['ai-input-grid']}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <label className={parentStyles['settings-item-title'] || styles['levels-list-title']} style={{ fontSize: "0.8rem", textTransform: "none", letterSpacing: "normal" }}>
                    Injuries / Limitations
                  </label>
                  <select
                    className={styles['ai-select']}
                    value={aiInjuriesSelect}
                    onChange={(e) => setAiInjuriesSelect(e.target.value)}
                  >
                    {INJURY_PRESETS.map((preset) => (
                      <option key={preset.value} value={preset.value}>{preset.label}</option>
                    ))}
                    <option value="custom">Custom...</option>
                  </select>
                  {aiInjuriesSelect === "custom" && (
                    <input
                      type="text"
                      className={styles['ai-input']}
                      style={{ marginTop: "0.35rem" }}
                      value={aiInjuriesCustom}
                      onChange={(e) => setAiInjuriesCustom(e.target.value)}
                      placeholder="e.g., knee pain, none"
                      autoFocus
                    />
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <label className={parentStyles['settings-item-title'] || styles['levels-list-title']} style={{ fontSize: "0.8rem", textTransform: "none", letterSpacing: "normal" }}>
                    Preferred Style
                  </label>
                  <select
                    className={styles['ai-select']}
                    value={aiStyleSelect}
                    onChange={(e) => setAiStyleSelect(e.target.value)}
                  >
                    {STYLE_PRESETS.map((preset) => (
                      <option key={preset.value} value={preset.value}>{preset.label}</option>
                    ))}
                    <option value="custom">Custom...</option>
                  </select>
                  {aiStyleSelect === "custom" && (
                    <input
                      type="text"
                      className={styles['ai-input']}
                      style={{ marginTop: "0.35rem" }}
                      value={aiStyleCustom}
                      onChange={(e) => setAiStyleCustom(e.target.value)}
                      placeholder="e.g., strength-focused, rehab"
                      autoFocus
                    />
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "1.5rem" }}>
              <button
                type="button"
                className={styles['track-copy-prompt-btn']}
                onClick={handleCopyPrompt}
                style={{ borderRadius: "var(--radius-sm)" }}
              >
                Copy AI Prompt
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <label className={parentStyles['settings-item-title'] || styles['levels-list-title']} style={{ fontSize: "0.85rem", textTransform: "none", letterSpacing: "normal", display: "block" }}>
                Paste AI Response (JSON)
              </label>
              <textarea
                className={styles['json-textarea']}
                placeholder='{ "id": "my_custom_routine", "name": "...", "description": "...", "exercises": [...] }'
                value={pastedJson}
                onChange={(e) => setPastedJson(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button 
                type="button" 
                className={`${styles['workout-overlay-btn']} ${styles['secondary']}`}
                onClick={() => setShowAiWorkoutModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className={`${styles['workout-overlay-btn']} ${styles['primary']}`}
                onClick={() => handlePasteTrack(pastedJson)}
              >
                Apply Program
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Overlay */}
      {confirmDialog && (
        <div className={styles['dialog-overlay']} style={{ zIndex: 300 }}>
          <div className={styles['dialog-modal']} style={{ maxWidth: "400px", padding: "2rem" }}>
            <h3 className={parentStyles['settings-title']} style={{ borderBottom: "none", marginBottom: "1rem", fontSize: "1.2rem" }}>
              Confirm Action
            </h3>
            <p className={parentStyles['settings-item-desc']} style={{ marginBottom: "1.5rem" }}>
              {confirmDialog.message}
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button 
                type="button" 
                className={parentStyles['settings-cancel-btn']} 
                style={{ margin: 0, padding: "0.5rem 1rem" }}
                onClick={() => setConfirmDialog(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className={parentStyles['settings-save-btn']} 
                style={{ margin: 0, padding: "0.5rem 1rem" }}
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications handled application-wide via Toast Container */}
      {/* Video Demonstration Player Overlay */}
      {activeVideoUrl && (
        <div className={styles['dialog-overlay']} style={{ zIndex: 400 }} onClick={() => setActiveVideoUrl(null)}>
          <div className={styles['dialog-modal']} style={{ maxWidth: "640px", padding: "1.5rem", borderRadius: "1.5rem" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 className={parentStyles['settings-title']} style={{ borderBottom: "none", margin: 0, fontSize: "1.1rem" }}>
                Exercise Video Demo
              </h3>
              <button
                type="button"
                className={parentStyles['settings-close-btn'] || styles['track-delete-btn']}
                onClick={() => setActiveVideoUrl(null)}
              >
                <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                  <line x1="18" x2="6" y1="6" y2="18"></line>
                  <line x1="6" x2="18" y1="6" y2="18"></line>
                </svg>
              </button>
            </div>
            <div style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: "0.75rem", overflow: "hidden", backgroundColor: "#000" }}>
              <EmbeddedPlayer videoUrl={activeVideoUrl} style={{ borderRadius: "0.75rem", boxShadow: "none" }} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
