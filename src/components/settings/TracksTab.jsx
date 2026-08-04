import React, { useState, useRef } from "react";
import { validateTrack } from "../../utils/track";
import styles from "./TracksTab.module.css";
import trainingProgramSchema from "../../../docs/schemas/training-program.schema.json";

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
  const [onboardingTrackId, setOnboardingTrackId] = useState(null);
  const [onboardingTier, setOnboardingTier] = useState("beginner");
  
  // Custom dialog states (to avoid thread-blocking window.alert & window.confirm)
  const [confirmDialog, setConfirmDialog] = useState(null); // { message, onConfirm }
  const [notification, setNotification] = useState(null); // { message }
  
  const fileInputRef = useRef(null);

  const showConfirm = (message, onConfirm) => {
    setConfirmDialog({ message, onConfirm });
  };

  const showNotify = (message) => {
    setNotification({ message });
  };

  const handleCopyPrompt = async () => {
    try {
      const schemaString = JSON.stringify(trainingProgramSchema, null, 2);
      const promptText = `You are an expert personal trainer and physical therapist. Your task is to generate a custom physical training program JSON file that conforms to the JSON schema provided below.

The training program should be designed around the user's specific request (e.g. "I want a routine for hip opening", "I want a core strengthening routine", etc.).

Please ensure the generated JSON strictly follows these rules:
1. Conform to the JSON Schema provided.
2. All fields in the exercises must be present.
3. Use a unique \`id\` for the program (e.g., 'my_custom_program_001').
4. The \`exercises\` array should contain a progression of exercises (e.g. 5 to 8 exercises) with clear \`difficulty\` levels (Beginner, Intermediate, Advanced, Expert).
5. For each exercise:
   - \`duration_secs\`: set to a positive integer (e.g. 30, 45, 60) for static holds, OR 0 if the exercise is strictly rep-based (where reps are defined by reps_min and reps_max).
   - \`reps_min\` and \`reps_max\`: positive integers for rep-based exercises, OR null if the exercise is a static hold.
   - \`sets\`: positive integer (typically 3 or 4).
   - \`rest_secs\`: rest time in seconds between sets (e.g. 30, 45, 60).
   - \`is_unilateral\`: true if the exercise is done on one side at a time (e.g. single-leg stands, one-sided stretches), false otherwise.
   - \`category\`: e.g. "Mobility", "Strength", "Power", "Core", "Skill".
   - \`muscle_groups\`: array of target muscles (e.g. ["Hamstrings", "Glutes", "Core"]). At least 1 muscle group must be specified.
   - \`equipment\`: array of required equipment (e.g. ["Wall", "Mat", "Yoga Block"]) or empty array \`[]\` if no equipment is needed.
   - \`video_url\` and \`image_url\`: set to null or a valid URL/string.

Here is the JSON Schema:
${schemaString}

Please output ONLY the valid JSON object. Do not include markdown code block formatting (such as \`\`\`json) or any conversational text.`;

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
              showNotify(`Successfully overwritten track "${importedTrack.name}"! Click "Save Changes" to save permanently.`);
            }
          );
        } else {
          updatedTracks.push(importedTrack);
          setAppConfig({
            ...appConfig,
            tracks: updatedTracks
          });
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
      }
    );
  };

  return (
    <div className={parentStyles['tab-pane'] || "tab-pane"}>
      {onboardingTrackId ? (
        /* Onboarding Flow Screen */
        <div className={styles['onboarding-container']}>
          <h3 className={styles['onboarding-title']}>
            Setup Track: {appConfig?.tracks?.find(t => t.id === onboardingTrackId)?.name || onboardingTrackId}
          </h3>
          <p className={styles['onboarding-desc']}>
            Select your starting flexibility tier. This will configure your initial stretch level and safe hold duration.
          </p>
          <div className={styles['onboarding-tiers']}>
            {[
              {
                id: "beginner",
                name: "Beginner",
                multiplier: "0.75x duration",
                description: "Starts at Level 1 (Wall Straddle). Fully supported passive stretches, lower duration to prevent strain."
              },
              {
                id: "intermediate",
                name: "Intermediate",
                multiplier: "1.00x duration",
                description: "Starts at Level 2 (Half Split). Introduces active unilateral movement. Standard hold duration."
              },
              {
                id: "advanced",
                name: "Advanced",
                multiplier: "1.25x duration",
                description: "Starts at Level 3 (Frog Stretch). Deep active/bilateral stretches. Extended hold duration."
              }
            ].map(tier => (
              <div
                key={tier.id}
                className={`${styles['onboarding-tier-card']} ${onboardingTier === tier.id ? styles['selected'] : ""}`}
                onClick={() => setOnboardingTier(tier.id)}
              >
                <div className={styles['onboarding-tier-header']}>
                  <span className={`${styles['onboarding-tier-name']} ${styles[tier.id]}`}>{tier.name}</span>
                  <span className={styles['onboarding-tier-mult']}>{tier.multiplier}</span>
                </div>
                <p className={styles['onboarding-tier-desc']}>{tier.description}</p>
              </div>
            ))}
          </div>
          <div className={styles['onboarding-actions']}>
            <button
              type="button"
              className={styles['track-action-btn']}
              onClick={() => {
                const track = appConfig?.tracks?.find(t => t.id === onboardingTrackId);
                let startingLevel = onboardingTier === "beginner" ? 1 : onboardingTier === "intermediate" ? 2 : 3;
                let updatedTracks = [...(appConfig?.tracks || [])];

                if (track && track.exercises) {
                  const difficultyPriority = (diff) => {
                    switch (diff.toLowerCase()) {
                      case "beginner": return 1;
                      case "intermediate": return 2;
                      case "advanced": return 3;
                      default: return 1;
                    }
                  };
                  
                  const userPriority = difficultyPriority(onboardingTier);
                  const filteredExercises = track.exercises.filter(ex => {
                    return difficultyPriority(ex.difficulty) <= userPriority;
                  });

                  const levels = filteredExercises.map((ex, index) => ({
                    level_number: index + 1,
                    title: ex.name,
                    description: `${ex.description}\n\n• Category: ${ex.category}\n• Target: ${(ex.target_muscles || ex.muscle_groups || []).join(", ")}\n• Side: ${ex.is_unilateral ? "Unilateral (Perform per side)" : "Bilateral"}\n• Equipment: ${(ex.equipment && ex.equipment.length > 0) ? ex.equipment.join(", ") : "None"}\n• Rest: ${ex.rest_secs ? ex.rest_secs + 's' : "None"}\n• Instructions: ${ex.reps ? ex.reps : ex.duration_secs + 's Hold'} (${ex.sets} Sets)`,
                    target_duration_secs: ex.duration_secs,
                    video_url: ex.video_url || ex.url || ex.video_link || null,
                    image_url: ex.image_url || null,
                    is_unilateral: ex.is_unilateral || false,
                    equipment: ex.equipment || [],
                    rest_secs: ex.rest_secs || 0
                  }));

                  const trackIndex = updatedTracks.findIndex(t => t.id === onboardingTrackId);
                  if (trackIndex > -1) {
                    updatedTracks[trackIndex] = {
                      ...track,
                      levels: levels.length > 0 ? levels : track.levels
                    };
                  }
                  startingLevel = 1; // Custom routine starts at L1 after filtering
                }

                setSettingsProgress({
                  active_track_id: onboardingTrackId,
                  onboarding_tier: onboardingTier,
                  current_level_number: startingLevel,
                  completed_sessions_count: 0,
                  last_completed_at: null,
                  level_started_at: new Date().toISOString()
                });

                if (track && track.exercises) {
                  setAppConfig({
                    ...appConfig,
                    tracks: updatedTracks
                  });
                }

                setOnboardingTrackId(null);
              }}
            >
              Confirm & Start Track
            </button>
            <button
              type="button"
              className={styles['onboarding-back-btn']}
              onClick={() => setOnboardingTrackId(null)}
            >
              Back
            </button>
          </div>
        </div>
      ) : settingsProgress.active_track_id ? (
        /* Active Track Progress Screen */
        <div className={styles['active-track-panel']}>
          {(() => {
            const activeTrack = appConfig?.tracks?.find(t => t.id === settingsProgress.active_track_id);
            if (!activeTrack) return null;
            const completedSessions = settingsProgress.completed_sessions_count || 0;
            const progressPercent = Math.min((completedSessions / 5) * 100, 100);
            
            return (
              <>
                <div className={styles['active-track-header']}>
                  <div className={styles['active-track-name-row']}>
                    <h3 className={styles['track-selection-title']}>{activeTrack.name}</h3>
                    <span className={styles['active-track-label']}>Active Track</span>
                  </div>
                  <p className={styles['track-selection-desc']} style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    {activeTrack.description}
                  </p>
                  <div className={styles['active-track-info-row']}>
                    <span>
                      Tier: <strong>{settingsProgress.onboarding_tier?.toUpperCase()}</strong>
                    </span>
                    <div>
                      <label style={{ marginRight: '0.5rem' }}>Change Tier:</label>
                      <select
                        className={styles['active-track-tier-select']}
                        value={settingsProgress.onboarding_tier || "beginner"}
                        onChange={(e) => {
                           const newTier = e.target.value;
                           const track = appConfig?.tracks?.find(t => t.id === settingsProgress.active_track_id);
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

                             const levels = filteredExercises.map((ex, index) => ({
                               level_number: index + 1,
                               title: ex.name,
                               description: `${ex.description}\n\n• Category: ${ex.category}\n• Target: ${(ex.target_muscles || ex.muscle_groups || []).join(", ")}\n• Side: ${ex.is_unilateral ? "Unilateral (Perform per side)" : "Bilateral"}\n• Equipment: ${(ex.equipment && ex.equipment.length > 0) ? ex.equipment.join(", ") : "None"}\n• Rest: ${ex.rest_secs ? ex.rest_secs + 's' : "None"}\n• Instructions: ${ex.reps ? ex.reps : ex.duration_secs + 's Hold'} (${ex.sets} Sets)`,
                               target_duration_secs: ex.duration_secs,
                               video_url: ex.video_url || ex.url || ex.video_link || null,
                               image_url: ex.image_url || null,
                               is_unilateral: ex.is_unilateral || false,
                               equipment: ex.equipment || [],
                               rest_secs: ex.rest_secs || 0
                             }));

                             const trackIndex = updatedTracks.findIndex(t => t.id === settingsProgress.active_track_id);
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
                         }}
                      >
                        <option value="beginner">Beginner (0.75x)</option>
                        <option value="intermediate">Intermediate (1.0x)</option>
                        <option value="advanced">Advanced (1.25x)</option>
                      </select>
                    </div>
                  </div>
                  <div className={styles['active-track-info-row']} style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                    <span>Completed Sessions (Current Level): {completedSessions} / 5</span>
                  </div>
                  <div className={styles['active-track-progress-bar-container']}>
                    <div className={styles['active-track-progress-bar']} style={{ width: `${progressPercent}%` }}></div>
                  </div>
                </div>

                <div className={styles['levels-list-container'] || "levels-list-container"}>
                  <h4 className={styles['levels-list-title']}>Track Levels</h4>
                  {activeTrack.levels?.map(level => {
                    const isActive = settingsProgress.current_level_number === level.level_number;
                    const isCompleted = settingsProgress.current_level_number > level.level_number;
                    const isLocked = settingsProgress.current_level_number < level.level_number;
                    
                    // Compute duration multiplier
                    const mult = settingsProgress.onboarding_tier === "beginner" ? 0.75 : settingsProgress.onboarding_tier === "advanced" ? 1.25 : 1.0;
                    const rawDur = level.target_duration_secs * mult;
                    const duration = Math.max(30, Math.min(90, Math.round(rawDur)));

                    return (
                      <div
                        key={level.level_number}
                        className={`${styles['level-item-card']} ${isActive ? styles['active'] : ""}`}
                      >
                        <div className={styles['level-item-header']}>
                          <div className={styles['level-item-title-col']}>
                            <span className={styles['level-item-number']}>L{level.level_number}</span>
                            <span className={styles['level-item-title']}>{level.title}</span>
                          </div>
                          <span className={`${styles['level-item-badge']} ${isActive ? styles['active'] : isCompleted ? styles['completed'] : styles['locked']}`}>
                            {isActive ? "Active" : isCompleted ? "Completed" : "Locked"}
                          </span>
                        </div>
                        <p className={styles['level-item-desc']}>{level.description}</p>
                        <div className={styles['level-item-footer']}>
                          <span className={styles['level-item-duration']}>Target hold: {duration}s</span>
                          {!isActive && (
                            <button
                              type="button"
                              className={styles['level-select-btn']}
                              onClick={() => {
                                setSettingsProgress({
                                  ...settingsProgress,
                                  current_level_number: level.level_number,
                                  completed_sessions_count: 0
                                });
                              }}
                            >
                              Activate Level
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className={styles['deactivate-track-btn']}
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
                  Deactivate Track
                </button>
              </>
            );
          })()}
        </div>
      ) : (
        /* Track Selection Screen */
        <div className={styles['tracks-container']}>
          <div className={styles['tracks-header-row']}>
            <h3 className={parentStyles['settings-group-title']} style={{ margin: 0 }}>Available Skill Tracks</h3>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                className={styles['track-copy-prompt-btn']}
                onClick={handleCopyPrompt}
              >
                Copy AI Prompt & Schema
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
            Choose a tailored physical progression track to follow during active breaks.
          </p>
          {appConfig?.tracks?.map(track => (
            <div key={track.id} className={styles['track-selection-card']}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h4 className={styles['track-selection-title']}>{track.name}</h4>
                {track.id !== "split_training_program" && (
                  <button
                    type="button"
                    className={styles['track-delete-btn']}
                    onClick={() => handleDeleteTrack(track.id)}
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
              <button
                type="button"
                className={styles['track-action-btn']}
                onClick={() => {
                  setOnboardingTrackId(track.id);
                  setOnboardingTier("beginner");
                }}
              >
                Choose Track
              </button>
            </div>
          ))}
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
    </div>
  );
}
