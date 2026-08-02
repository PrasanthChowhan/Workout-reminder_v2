// Safe check if we are running inside Tauri or a regular browser
export const isTauri = typeof window !== "undefined" && !!window.__TAURI__;

/**
 * Wraps Tauri core invoke API. Fallback to console logs/mock responses in standard browsers.
 * @param {string} cmd 
 * @param {object} [args] 
 * @returns {Promise<any>}
 */
export async function invoke(cmd, args) {
  if (isTauri) {
    try {
      return await window.__TAURI__.core.invoke(cmd, args);
    } catch (error) {
      console.error(`Tauri invoke error for command '${cmd}':`, error);
      throw error;
    }
  }

  console.log(`[Browser Mock IPC] invoke: ${cmd}`, args);

  // Return realistic mock data to facilitate browser debugging
  if (cmd === "get_app_config") {
    return {
      settings: {
        micro_break_interval_mins: 20,
        active_break_interval_mins: 50,
        micro_break_duration_secs: 20,
        active_break_duration_secs: 300,
        run_at_start: false,
      },
      active_recall_cards: [
        { id: "card_react_intro", category: "React", question: "What is React?", answer: "A JavaScript library for building user interfaces.", source: "https://react.dev" }
      ],
      reflection_prompts: [
        "What went well today?",
        "What challenges did you face?"
      ],
      stretches: [
        { name: "Wrist Stretch", description: "Gently pull fingers back with opposite hand.", duration_secs: 15, difficulty_level: "All Levels", sets: 2, reps: "Hold 15s" }
      ],
      tracks: [
        {
          id: "side_splits",
          name: "Side Splits Progression",
          description: "Work towards full side splits with targeted active and passive stretching.",
          levels: [
            {
              level_number: 1,
              title: "Wall Straddle",
              description: "Lie on your back with legs up the wall and spread wide.",
              target_duration_secs: 60,
              video_url: "https://www.youtube.com",
              image_url: null,
              asset_url: null,
              is_unilateral: false,
              equipment: [],
              rest_secs: 10
            }
          ]
        },
        {
          id: "split_training_program",
          name: "Split Training Program",
          description: "A neuro-biomechanical approach combining neural dynamics, eccentric loading, PNF (Contract-Relax), and passive static elongation.",
          exercises: [
            {
              name: "Sciatic Nerve Slider",
              description: "Reduces sciatic mechanosensitivity to rapidly improve apparent hamstring extensibility prior to mechanical stretching.",
              category: "Neural Dynamics",
              muscle_groups: ["Sciatic Nerve Pathway", "Posterior Chain"],
              difficulty: "Beginner",
              equipment: [],
              duration_secs: 45,
              sets: 3,
              reps: "10-15 slow, dynamic repetitions per leg",
              is_unilateral: true,
              rest_secs: 15,
              video_url: "https://www.youtube.com/watch?v=XP1yzpFR6ho",
              image_url: "assets/stretches/sciatic-slider.png"
            },
            {
              name: "Low Lunge with Posterior Pelvic Tilt",
              description: "Elongates the anterior structures required for the trailing leg in a front split. The posterior pelvic tilt is essential to prevent lumbar hyperlordosis.",
              category: "Static / Active Stretch",
              muscle_groups: ["Iliopsoas", "Rectus Femoris (Hip Flexors)"],
              difficulty: "Beginner",
              duration_secs: 60,
              sets: 2,
              reps: "30-60s hold per leg",
              is_unilateral: true,
              rest_secs: 15,
              video_url: "https://www.youtube.com/watch?v=aOfniMZY2hk",
              image_url: "assets/stretches/low-lunge.png"
            },
            {
              name: "Half Split (Flat Back)",
              description: "Isolates the hamstring of the leading leg for the front split without requiring concurrent hip extension of the opposite leg.",
              category: "Static Stretch",
              muscle_groups: ["Hamstrings (Biceps Femoris, Semitendinosus, Semimembranosus)"],
              difficulty: "Beginner",
              duration_secs: 60,
              sets: 2,
              reps: "30-60s hold per leg",
              is_unilateral: true,
              rest_secs: 15,
              video_url: "https://www.youtube.com/watch?v=1wXNELxZI4I",
              image_url: "assets/stretches/half-split.png"
            },
            {
              name: "Cossack Squat",
              description: "Builds eccentric strength in the adductors and improves end-range hip mobility required to safely support the middle split.",
              category: "Eccentric / Dynamic Mobility",
              muscle_groups: ["Adductor Magnus", "Adductor Longus", "Gluteus Medius"],
              difficulty: "Intermediate",
              duration_secs: 60,
              sets: 3,
              reps: "8-10 reps per side",
              is_unilateral: true,
              rest_secs: 30,
              video_url: "https://www.youtube.com/watch?v=xXwdKm5uLAM",
              image_url: "assets/stretches/cossack-squat.png"
            },
            {
              name: "Frog Stretch",
              description: "Prepares the pelvis for the anterior tilt necessary to clear the greater trochanter in a middle split, bypassing the medial knee stress associated with straight legs.",
              category: "Static / PNF Stretch",
              muscle_groups: ["Adductor Complex", "Pectineus", "Gracilis"],
              difficulty: "Beginner",
              duration_secs: 90,
              sets: 2,
              reps: "60-120s hold",
              is_unilateral: false,
              rest_secs: 30,
              video_url: "https://www.youtube.com/watch?v=mO8S7qOdcdU",
              image_url: "assets/stretches/frog-stretch.png"
            },
            {
              name: "Pancake Stretch",
              description: "Improves straddle fold mechanics. Note: This stretch uses a downward pelvic orientation, distinct from the true middle split.",
              category: "Static Stretch",
              muscle_groups: ["Hamstrings", "Lower Back", "Adductors"],
              difficulty: "Intermediate",
              duration_secs: 60,
              sets: 2,
              reps: "60s hold",
              is_unilateral: false,
              rest_secs: 30,
              video_url: "https://www.youtube.com/watch?v=CHRUb43S6RM",
              image_url: "assets/stretches/pancake.png"
            },
            {
              name: "Assisted Front Split (with Blocks/Pillows)",
              description: "Allows the nervous system to adapt to the full split position using viscoelastic stress relaxation without triggering the myotatic reflex.",
              category: "End-Range Static Stretch",
              muscle_groups: ["Full Anterior and Posterior Chains"],
              difficulty: "Beginner",
              duration_secs: 60,
              sets: 3,
              reps: "30-60s hold per leg",
              is_unilateral: true,
              rest_secs: 30,
              video_url: "https://www.youtube.com/watch?v=B8BivbTW-_0",
              image_url: "assets/stretches/front-split-assisted.png"
            },
            {
              name: "Wall Middle Split",
              description: "Utilizes gravity to safely accumulate time-under-tension in abducted hip ranges while supporting the spine and neutralizing the pelvic tilt requirement.",
              category: "Passive Static Stretch",
              muscle_groups: ["Adductor Complex"],
              difficulty: "Beginner",
              duration_secs: 90,
              sets: 1,
              reps: "2-3 min hold",
              is_unilateral: false,
              rest_secs: 0,
              video_url: "https://www.youtube.com/watch?v=Iy_zqS8notQ",
              image_url: "assets/stretches/wall-straddle.png"
            }
          ]
        }
      ],
      user_progress: {
        active_track_id: null,
        current_level_number: null,
        onboarding_tier: null,
        completed_sessions_count: 0
      }
    };
  }

  if (cmd === "get_session_data") {
    return {
      stretch: {
        name: "Mock Desk mobility",
        description: "Roll shoulders and gently stretch neck to improve blood circulation.",
        duration_secs: 30,
        difficulty_level: "Beginner",
        sets: 2,
        reps: "Hold 30s",
        video_url: "https://www.youtube.com"
      },
      card: {
        id: "mock_c1",
        category: "Browser Mock",
        question: "Is this app currently running in standard browser mode?",
        answer: "Yes, utilizing custom Tauri mock interfaces.",
        source: "https://tauri.app"
      }
    };
  }

  return {};
}

/**
 * Wraps Tauri event listen API. Fallback to logs in browser.
 * @param {string} eventName 
 * @param {function} callback 
 * @returns {Promise<function>} Unlisten function promise
 */
export function listen(eventName, callback) {
  if (isTauri) {
    return window.__TAURI__.event.listen(eventName, callback);
  }
  
  console.log(`[Browser Mock IPC] listen registered for: ${eventName}`);
  return Promise.resolve(() => {
    console.log(`[Browser Mock IPC] unlisten for: ${eventName}`);
  });
}

/**
 * Custom listener wrapper that handles async lifecycle cancellation safely.
 * Returns an unlisten function that cleanups event listener subscription.
 * @param {string} eventName 
 * @param {function} callback 
 * @returns {function} Unlisten function
 */
export function registerListener(eventName, callback) {
  let active = true;
  let unlistenFn = null;
  
  const sub = listen(eventName, (event) => {
    if (active) callback(event);
  });
  
  sub.then((fn) => {
    if (!active) {
      fn();
    } else {
      unlistenFn = fn;
    }
  });
  
  return () => {
    active = false;
    if (unlistenFn) unlistenFn();
  };
}

/**
 * Safely opens a URL inside browser or via Tauri Opener plugin.
 * @param {string} url 
 * @returns {Promise<any>}
 */
export function openUrl(url) {
  if (!url || url === "N/A") return Promise.resolve();

  if (isTauri) {
    return invoke("plugin:opener|open", { path: url }).catch((err) => {
      console.error(`Failed to open URL '${url}' via Tauri:`, err);
    });
  } else {
    console.log(`[Browser Mock IPC] openUrl: ${url}`);
    window.open(url, "_blank");
    return Promise.resolve();
  }
}

/**
 * Minimizes/hides the current Tauri window to the system tray.
 */
export function hideToTray() {
  if (isTauri && window.__TAURI__.window) {
    try {
      window.__TAURI__.window.getCurrentWindow().hide();
    } catch (err) {
      console.error("Failed to hide Tauri window:", err);
    }
  } else {
    console.log("[Browser Mock IPC] hideToTray invoked");
  }
}
