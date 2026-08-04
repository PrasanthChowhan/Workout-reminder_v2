import React, { useState, useRef } from "react";
import { validateTrack } from "../../utils/track";
import styles from "./TracksTab.module.css";
import trainingProgramSchema from "../../../docs/schemas/training-program.schema.json";
import { generateAiPrompt } from "../../utils/aiPrompt";
import { openUrl } from "../../utils/tauri";
import EmbeddedPlayer from "../EmbeddedPlayer";

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
  
  // Custom dialog states (to avoid thread-blocking window.alert & window.confirm)
  const [confirmDialog, setConfirmDialog] = useState(null); // { message, onConfirm }
  const [notification, setNotification] = useState(null); // { message }
  
  const fileInputRef = useRef(null);

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
    setNotification({ message });
  };

  const handleCopyPrompt = async () => {
    try {
      const schemaString = JSON.stringify(trainingProgramSchema, null, 2);
      const promptText = generateAiPrompt(schemaString);

      await navigator.clipboard.writeText(promptText);
      showNotify("Successfully copied the AI Prompt & JSON Schema to your clipboard! You can paste this to any AI model (e.g., Gemini, Claude, ChatGPT) along with your workout goals to generate a custom routine, then import the resulting JSON here.");
    } catch (err) {
      showNotify("Failed to copy prompt to clipboard. Please check browser permissions.");
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
          showNotify(`Validation Error: ${validationError}`);
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
              showNotify(`Successfully overwritten track "${importedTrack.name}"! Click "Save Changes" to save permanently.`);
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
          showNotify(`Successfully imported track "${importedTrack.name}"! Click "Save Changes" to save permanently.`);
        }
      } catch (err) {
        showNotify("Failed to parse JSON file. Please ensure it is valid JSON.");
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
                              const difficultyPriority = (diff) => {
                                switch (diff.toLowerCase()) {
                                  case "beginner": return 1;
                                  case "intermediate": return 2;
                                  case "advanced": return 3;
                                  default: return 1;
                                }
                              };
                              
                              const userPriority = difficultyPriority(previewTier);
                              const filteredExercises = selectedTrack.exercises.filter(ex => {
                                return difficultyPriority(ex.difficulty) <= userPriority;
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
                              startingLevel = 1;
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
                            const difficultyPriority = (diff) => {
                              switch (diff.toLowerCase()) {
                                case "beginner": return 1;
                                case "intermediate": return 2;
                                case "advanced": return 3;
                                default: return 1;
                              }
                            };
                            
                            const userPriority = difficultyPriority(newTier);
                            const filteredExercises = track.exercises.filter(ex => {
                              return difficultyPriority(ex.difficulty) <= userPriority;
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
                            newLevelNum = 1; // Reset to 1 on tier change for custom routines
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
                <h4 className={styles['levels-list-title']}>
                  {isActive ? "Track Levels" : "Progression Preview"}
                </h4>
                {(() => {
                  let displayLevels = [];
                  if (isActive) {
                    displayLevels = selectedTrack.levels || [];
                  } else {
                    if (selectedTrack.exercises) {
                      const difficultyPriority = (diff) => {
                        switch (diff.toLowerCase()) {
                          case "beginner": return 1;
                          case "intermediate": return 2;
                          case "advanced": return 3;
                          default: return 1;
                        }
                      };
                      const userPriority = difficultyPriority(previewTier);
                      const filteredExercises = selectedTrack.exercises.filter(ex => {
                        return difficultyPriority(ex.difficulty) <= userPriority;
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

                  if (displayLevels.length === 0) {
                    return <p className={parentStyles['settings-item-desc']}>No exercises available for this tier.</p>;
                  }

                  return displayLevels.map(level => {
                    const isActiveLevel = isActive && settingsProgress.current_level_number === level.level_number;
                    const isCompleted = isActive && settingsProgress.current_level_number > level.level_number;
                    const isLocked = isActive && settingsProgress.current_level_number < level.level_number;

                    const duration = level.target_duration_secs;

                    return (
                      <div
                        key={level.level_number}
                        className={`${styles['level-item-card']} ${isActiveLevel ? styles['active'] : ""}`}
                        onClick={() => {
                          if (isActive && !isActiveLevel) {
                            setSettingsProgress({
                              ...settingsProgress,
                              current_level_number: level.level_number,
                              completed_sessions_count: 0
                            });
                          }
                        }}
                        style={{ cursor: isActive ? "pointer" : "default" }}
                        title={isActive && !isActiveLevel ? "Click to activate this level" : undefined}
                      >
                        <div className={styles['level-item-header']}>
                          <div className={styles['level-item-title-col']}>
                            <span className={styles['level-item-number']}>L{level.level_number}</span>
                            <span className={styles['level-item-title']}>{level.title}</span>
                          </div>
                          {isActive && (
                            <span className={`${styles['level-item-badge']} ${isActiveLevel ? styles['active'] : isCompleted ? styles['completed'] : styles['locked']}`}>
                              {isActiveLevel ? "Active" : isCompleted ? "Completed" : "Locked"}
                            </span>
                          )}
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
                  });
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
                onClick={handleCopyPrompt}
              >
                Copy AI Prompt
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
          <p className={parentStyles['settings-item-desc']} style={{ marginBottom: "1rem" }}>
            Double-click a track to inspect workouts, configure difficulty, and select your progression.
          </p>

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

      {/* Notification Dialog Overlay */}
      {notification && (
        <div className={styles['dialog-overlay']} style={{ zIndex: 310 }}>
          <div className={styles['dialog-modal']} style={{ maxWidth: "400px", padding: "2rem" }}>
            <h3 className={parentStyles['settings-title']} style={{ borderBottom: "none", marginBottom: "1rem", fontSize: "1.2rem" }}>
              Message
            </h3>
            <p className={parentStyles['settings-item-desc']} style={{ marginBottom: "1.5rem" }}>
              {notification.message}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button 
                type="button" 
                className={parentStyles['settings-save-btn']} 
                style={{ margin: 0, padding: "0.5rem 1.5rem" }}
                onClick={() => setNotification(null)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
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
