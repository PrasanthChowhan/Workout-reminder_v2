use super::models::{AppConfig, Settings, Stretch, PhysicalTrack, CustomExercise, UserProgress, Level};

impl Default for AppConfig {
    fn default() -> Self {
        let mut config = Self {
            settings: Settings {
                micro_break_interval_mins: 20,
                active_break_interval_mins: 50,
                micro_break_duration_secs: 20,
                active_break_duration_secs: 300, // 5 minutes
                run_at_start: false,
                daily_prompt: "Have you read the book of king?".to_string(),
                daily_prompt_enabled: false,
                micro_break_enabled: true,
            },
            reflection_prompts: vec![
                "What is the core problem you are solving right now? Is there a simpler way?".to_string(),
                "Are you stuck down a rabbit hole? Zoom out and state your goal in one sentence.".to_string(),
                "Is there a simpler data structure or logic block that solves this?".to_string(),
                "If you had to delete 50% of the code you just wrote, which part would it be?".to_string(),
            ],
            stretches: vec![
                Stretch {
                    name: "Physical Reset".to_string(),
                    description: "Stand up, roll shoulders backward 10 times, and stretch arms high overhead to realign posture and improve blood flow.".to_string(),
                    duration_secs: 30,
                    difficulty_level: "Beginner".to_string(),
                    sets: 2,
                    reps: Some("10 reps".to_string()),
                    video_url: None,
                    image_url: None,
                    is_unilateral: false,
                    equipment: vec![],
                    rest_secs: 15,
                    metadata: None,
                },
                Stretch {
                    name: "Neck & Spine Reset".to_string(),
                    description: "Sit tall. Turn chin slowly to right shoulder for 5s, then left shoulder for 5s. Roll neck gently.".to_string(),
                    duration_secs: 30,
                    difficulty_level: "Beginner".to_string(),
                    sets: 2,
                    reps: Some("Hold 5s".to_string()),
                    video_url: None,
                    image_url: None,
                    is_unilateral: true,
                    equipment: vec![],
                    rest_secs: 15,
                    metadata: None,
                },
                Stretch {
                    name: "Wrist extension".to_string(),
                    description: "Extend right arm forward, fingers up. Pull fingers back gently with left hand. Hold 15s, then switch arms.".to_string(),
                    duration_secs: 30,
                    difficulty_level: "Beginner".to_string(),
                    sets: 2,
                    reps: Some("Hold 15s".to_string()),
                    video_url: None,
                    image_url: None,
                    is_unilateral: true,
                    equipment: vec![],
                    rest_secs: 15,
                    metadata: None,
                }
            ],
            tracks: vec![
                PhysicalTrack {
                    id: "split_training_program".to_string(),
                    name: "Split Training Program".to_string(),
                    description: "A neuro-biomechanical approach combining neural dynamics, eccentric loading, PNF (Contract-Relax), and passive static elongation.".to_string(),
                    levels: vec![],
                    exercises: Some(vec![
                        CustomExercise {
                            id: Some("ex_sciatic_nerve_slider".to_string()),
                            name: "Sciatic Nerve Slider".to_string(),
                            description: "Reduces sciatic mechanosensitivity to rapidly improve apparent hamstring extensibility prior to mechanical stretching.".to_string(),
                            execution_notes: Some("Perform 10-15 slow, dynamic repetitions per leg. Keep movement controlled.".to_string()),
                            category: "Neural Dynamics".to_string(),
                            target_muscles: vec![],
                            muscle_groups: vec!["Sciatic Nerve Pathway".to_string(), "Posterior Chain".to_string()],
                            difficulty: "Beginner".to_string(),
                            duration_secs: 45,
                            sets: 3,
                            reps: None,
                            reps_min: Some(10),
                            reps_max: Some(15),
                            video_url: Some("https://www.youtube.com/watch?v=XP1yzpFR6ho".to_string()),
                            image_url: Some("assets/stretches/sciatic-slider.png".to_string()),
                            is_unilateral: true,
                            equipment: vec![],
                            rest_secs: 15,
                        },
                        CustomExercise {
                            id: Some("ex_low_lunge_posterior_pelvic_tilt".to_string()),
                            name: "Low Lunge with Posterior Pelvic Tilt".to_string(),
                            description: "Elongates the anterior structures required for the trailing leg in a front split. The posterior pelvic tilt is essential to prevent lumbar hyperlordosis.".to_string(),
                            execution_notes: Some("30-60s hold per leg. Focus on tilting the pelvis posteriorly.".to_string()),
                            category: "Static / Active Stretch".to_string(),
                            target_muscles: vec![],
                            muscle_groups: vec!["Iliopsoas".to_string(), "Rectus Femoris (Hip Flexors)".to_string()],
                            difficulty: "Beginner".to_string(),
                            duration_secs: 60,
                            sets: 2,
                            reps: None,
                            reps_min: None,
                            reps_max: None,
                            video_url: Some("https://www.youtube.com/watch?v=aOfniMZY2hk".to_string()),
                            image_url: Some("assets/stretches/low-lunge.png".to_string()),
                            is_unilateral: true,
                            equipment: vec![],
                            rest_secs: 15,
                        },
                        CustomExercise {
                            id: Some("ex_half_split_flat_back".to_string()),
                            name: "Half Split (Flat Back)".to_string(),
                            description: "Isolates the hamstring of the leading leg for the front split without requiring concurrent hip extension of the opposite leg.".to_string(),
                            execution_notes: Some("30-60s hold per leg. Keep the back flat and hips square.".to_string()),
                            category: "Static Stretch".to_string(),
                            target_muscles: vec![],
                            muscle_groups: vec!["Hamstrings (Biceps Femoris, Semitendinosus, Semimembranosus)".to_string()],
                            difficulty: "Beginner".to_string(),
                            duration_secs: 60,
                            sets: 2,
                            reps: None,
                            reps_min: None,
                            reps_max: None,
                            video_url: Some("https://www.youtube.com/watch?v=1wXNELxZI4I".to_string()),
                            image_url: Some("assets/stretches/half-split.png".to_string()),
                            is_unilateral: true,
                            equipment: vec![],
                            rest_secs: 15,
                        },
                        CustomExercise {
                            id: Some("ex_cossack_squat".to_string()),
                            name: "Cossack Squat".to_string(),
                            description: "Builds eccentric strength in the adductors and improves end-range hip mobility required to safely support the middle split.".to_string(),
                            execution_notes: Some("8-10 reps per side. Keep the heel of the working leg flat on the floor.".to_string()),
                            category: "Eccentric / Dynamic Mobility".to_string(),
                            target_muscles: vec![],
                            muscle_groups: vec!["Adductor Magnus".to_string(), "Adductor Longus".to_string(), "Gluteus Medius".to_string()],
                            difficulty: "Intermediate".to_string(),
                            duration_secs: 60,
                            sets: 3,
                            reps: None,
                            reps_min: Some(8),
                            reps_max: Some(10),
                            video_url: Some("https://www.youtube.com/watch?v=xXwdKm5uLAM".to_string()),
                            image_url: Some("assets/stretches/cossack-squat.png".to_string()),
                            is_unilateral: true,
                            equipment: vec![],
                            rest_secs: 30,
                        },
                        CustomExercise {
                            id: Some("ex_frog_stretch".to_string()),
                            name: "Frog Stretch".to_string(),
                            description: "Prepares the pelvis for the anterior tilt necessary to clear the greater trochanter in a middle split, bypassing the medial knee stress associated with straight legs.".to_string(),
                            execution_notes: Some("60-120s hold. Keep knees wide and ankles in line with knees.".to_string()),
                            category: "Static / PNF Stretch".to_string(),
                            target_muscles: vec![],
                            muscle_groups: vec!["Adductor Complex".to_string(), "Pectineus".to_string(), "Gracilis".to_string()],
                            difficulty: "Beginner".to_string(),
                            duration_secs: 90,
                            sets: 2,
                            reps: None,
                            reps_min: None,
                            reps_max: None,
                            video_url: Some("https://www.youtube.com/watch?v=mO8S7qOdcdU".to_string()),
                            image_url: Some("assets/stretches/frog-stretch.png".to_string()),
                            is_unilateral: false,
                            equipment: vec![],
                            rest_secs: 30,
                        },
                        CustomExercise {
                            id: Some("ex_pancake_stretch".to_string()),
                            name: "Pancake Stretch".to_string(),
                            description: "Improves straddle fold mechanics. Note: This stretch uses a downward pelvic orientation, distinct from the true middle split.".to_string(),
                            execution_notes: Some("60s hold. Tilt from the pelvis, keeping the spine as long as possible.".to_string()),
                            category: "Static Stretch".to_string(),
                            target_muscles: vec![],
                            muscle_groups: vec!["Hamstrings".to_string(), "Lower Back".to_string(), "Adductors".to_string()],
                            difficulty: "Intermediate".to_string(),
                            duration_secs: 60,
                            sets: 2,
                            reps: None,
                            reps_min: None,
                            reps_max: None,
                            video_url: Some("https://www.youtube.com/watch?v=CHRUb43S6RM".to_string()),
                            image_url: Some("assets/stretches/pancake.png".to_string()),
                            is_unilateral: false,
                            equipment: vec![],
                            rest_secs: 30,
                        },
                        CustomExercise {
                            id: Some("ex_assisted_front_split".to_string()),
                            name: "Assisted Front Split (with Blocks/Pillows)".to_string(),
                            description: "Allows the nervous system to adapt to the full split position using viscoelastic stress relaxation without triggering the myotatic reflex.".to_string(),
                            execution_notes: Some("30-60s hold per leg. Use blocks or pillows to support hips as needed.".to_string()),
                            category: "End-Range Static Stretch".to_string(),
                            target_muscles: vec![],
                            muscle_groups: vec!["Full Anterior and Posterior Chains".to_string()],
                            difficulty: "Beginner".to_string(),
                            duration_secs: 60,
                            sets: 3,
                            reps: None,
                            reps_min: None,
                            reps_max: None,
                            video_url: Some("https://www.youtube.com/watch?v=B8BivbTW-_0".to_string()),
                            image_url: Some("assets/stretches/front-split-assisted.png".to_string()),
                            is_unilateral: true,
                            equipment: vec![],
                            rest_secs: 30,
                        },
                        CustomExercise {
                            id: Some("ex_wall_middle_split".to_string()),
                            name: "Wall Middle Split".to_string(),
                            description: "Utilizes gravity to safely accumulate time-under-tension in abducted hip ranges while supporting the spine and neutralizing the pelvic tilt requirement.".to_string(),
                            execution_notes: Some("2-3 min hold. Relax the legs and let gravity gently increase the stretch.".to_string()),
                            category: "Passive Static Stretch".to_string(),
                            target_muscles: vec![],
                            muscle_groups: vec!["Adductor Complex".to_string()],
                            difficulty: "Beginner".to_string(),
                            duration_secs: 90,
                            sets: 1,
                            reps: None,
                            reps_min: None,
                            reps_max: None,
                            video_url: Some("https://www.youtube.com/watch?v=Iy_zqS8notQ".to_string()),
                            image_url: Some("assets/stretches/wall-straddle.png".to_string()),
                            is_unilateral: false,
                            equipment: vec![],
                            rest_secs: 0,
                        },
                    ]),
                    metadata: None,
                }
            ],
            user_progress: UserProgress {
                active_track_id: Some("split_training_program".to_string()),
                current_level_number: Some(1),
                onboarding_tier: Some("beginner".to_string()),
                completed_sessions_count: 0,
                last_completed_at: None,
                level_started_at: None,
            },
        };
        config.populate_levels();
        config
    }
}

impl AppConfig {
    pub fn populate_levels(&mut self) {
        let onboarding_tier = self
            .user_progress
            .onboarding_tier
            .as_deref()
            .unwrap_or("beginner")
            .to_lowercase();

        for track in &mut self.tracks {
            if let Some(ref exercises) = track.exercises {
                if !exercises.is_empty() {
                    let filtered: Vec<&CustomExercise> = exercises
                        .iter()
                        .filter(|ex| ex.difficulty.to_lowercase() == onboarding_tier)
                        .collect();

                    let mut levels = Vec::new();
                    for (index, ex) in filtered.iter().enumerate() {
                        let target_muscles = if !ex.target_muscles.is_empty() {
                            ex.target_muscles.clone()
                        } else {
                            ex.muscle_groups.clone()
                        };

                        let equipment_str = if !ex.equipment.is_empty() {
                            ex.equipment.join(", ")
                        } else {
                            "None".to_string()
                        };

                        let rest_str = if ex.rest_secs > 0 {
                            format!("{}s", ex.rest_secs)
                        } else {
                            "None".to_string()
                        };

                        let reps_str = if let Some(ref reps) = ex.reps {
                            reps.clone()
                        } else if let (Some(min), Some(max)) = (ex.reps_min, ex.reps_max) {
                            format!("{}-{} Reps", min, max)
                        } else if let Some(min) = ex.reps_min {
                            format!("{} Reps", min)
                        } else {
                            format!("{}s Hold", ex.duration_secs)
                        };

                        let description = format!(
                            "{}\n\n• Category: {}\n• Target: {}\n• Side: {}\n• Equipment: {}\n• Rest: {}\n• Instructions: {} ({} Sets)",
                            ex.description,
                            ex.category,
                            target_muscles.join(", "),
                            if ex.is_unilateral {
                                "Unilateral (Perform per side)"
                            } else {
                                "Bilateral"
                            },
                            equipment_str,
                            rest_str,
                            reps_str,
                            ex.sets
                        );

                        levels.push(Level {
                            level_number: (index + 1) as u64,
                            title: ex.name.clone(),
                            description,
                            target_duration_secs: ex.duration_secs,
                            video_url: ex.video_url.clone(),
                            image_url: ex.image_url.clone(),
                            is_unilateral: ex.is_unilateral,
                            equipment: ex.equipment.clone(),
                            rest_secs: ex.rest_secs,
                            reps: Some(reps_str),
                            sets: Some(ex.sets),
                        });
                    }
                    track.levels = levels;
                }
            }
        }
    }
}

pub const DEFAULT_RECALL_TRACK: &str = r#"{
  "metadata": {
    "source_title": "What I Learned From Being Around The Top 0.01%",
    "source_url": "https://youtu.be/fymfTFftN-g"
  },
  "concepts": [
    {
      "concept_id": "alternative-currencies",
      "concept_title": "Creating Alternative Currencies",
      "tags": ["Resource Acquisition", "Negotiation", "Leverage"],
      "variants": [
        {
          "variant_id": "alt-curr-beginner",
          "difficulty": "beginner",
          "scenario_prose": "You are building a complex SaaS tool and your bank account just hit zero. You desperately need a senior full-stack developer to finish the MVP for launch next month, but they normally charge $150k/year. You have no cash.",
          "scenario_code_snippet": null,
          "hint": "What digital asset do you own that could be highly valuable to them if the company succeeds?",
          "target_answer_prose": "Company equity or shares",
          "target_answer_code": null,
          "common_trap": "Taking out high-interest personal loans.",
          "explanation": "Billionaires financialize the value of their company and use shares as a currency to acquire resources when cash is low."
        },
        {
          "variant_id": "alt-curr-intermediate",
          "difficulty": "intermediate",
          "scenario_prose": "Your industry newsletter has 250,000 highly engaged enterprise tech subscribers. You want to acquire a struggling but functional analytics tool valued at $50,000 to offer your readers. Your business is currently cash-poor, but the tool's creator desperately wants user adoption.",
          "scenario_code_snippet": null,
          "hint": "You possess a distribution channel that the creator lacks.",
          "target_answer_prose": "Email list distribution access",
          "target_answer_code": null,
          "common_trap": "Offering to pay them back in installments from future revenue.",
          "explanation": "A massive, targeted distribution channel (like a large email list) acts as an alternative currency to acquire assets from those who need exposure."
        },
        {
          "variant_id": "alt-curr-advanced",
          "difficulty": "advanced",
          "scenario_prose": "A rising clean-tech startup is struggling to close their Series A funding round because venture capitalists do not trust their young, unproven leadership team. You have a 20-year flawless, highly respected track record in clean-tech. You want a 5% stake in their company without investing your own capital.",
          "scenario_code_snippet": null,
          "hint": "Your mere presence on their roster provides them with something they lack to secure the VC funding.",
          "target_answer_prose": "Reputation and brand credibility",
          "target_answer_code": null,
          "common_trap": "Waiting until they get funded and asking for a high salary.",
          "explanation": "A powerful personal brand and reputation can be traded as currency for equity, as it fundamentally de-risks the venture for other investors."
        }
      ]
    },
    {
      "concept_id": "reverse-engineering-future",
      "concept_title": "Reverse Engineering the Future",
      "tags": ["Strategic Planning", "Vision", "Goal Setting"],
      "variants": [
        {
          "variant_id": "rev-eng-beginner",
          "difficulty": "beginner",
          "scenario_prose": "Your marketing agency wants to hit $2M ARR in three years targeting enterprise clients. To build the strategic plan, your co-founder suggests taking last year's $500k small-business client roster, projecting a 20% growth rate, and brainstorming three new lead-gen tactics to try next week.",
          "scenario_code_snippet": null,
          "hint": "Your co-founder is dragging the limitations of yesterday into the plans for tomorrow.",
          "target_answer_prose": "Reverse engineer the future",
          "target_answer_code": null,
          "common_trap": "Forward engineering the past (iterating on last year).",
          "explanation": "To achieve exponential leaps, you must define the exact future state (e.g., the $2M enterprise model) and work backward, rather than building incrementally from past results."
        },
        {
          "variant_id": "rev-eng-intermediate",
          "difficulty": "intermediate",
          "scenario_prose": "Your logistics startup secured funding to expand nationally over the next 24 months. The current warehouse manager is overwhelmed by local volume. You sit down to write a job description for a warehouse assistant to help him survive next month's order spike.",
          "scenario_code_snippet": null,
          "hint": "Does an assistant for a local warehouse manager align with a national operation 24 months from now?",
          "target_answer_prose": "Hire for the future vision",
          "target_answer_code": null,
          "common_trap": "Hiring a patch for today's immediate pain point.",
          "explanation": "Planning backwards from the future state dictates that you should be hiring the executive who can run the national network, not a band-aid for today's local bottleneck."
        },
        {
          "variant_id": "rev-eng-advanced",
          "difficulty": "advanced",
          "scenario_prose": "You are pitching venture capitalists for a $5M seed round. Your deck highlights your current tech stack, lists your 4 local customers, and details how the $5M will let you hire two more developers to slowly expand to a second city. The investors look incredibly bored and are checking their phones.",
          "scenario_code_snippet": null,
          "hint": "Investors don't fund where you are; they fund where you are going.",
          "target_answer_prose": "Pitch the end-state vision",
          "target_answer_code": null,
          "common_trap": "Over-explaining current operational metrics.",
          "explanation": "Top performers enroll people (investors, talent) by vividly storytelling the massive future state they are reverse-engineering, ignoring current constraints."
        }
      ]
    },
    {
      "concept_id": "creating-an-enemy",
      "concept_title": "Leveraging the Enemy for Alignment",
      "tags": ["Leadership", "Motivation", "Team Building"],
      "variants": [
        {
          "variant_id": "enemy-beginner",
          "difficulty": "beginner",
          "scenario_prose": "You run a high-end independent gym. Morale is dipping, and trainers are doing the bare minimum. You've tried giving bonuses and putting up 'employee of the month' plaques, but nothing has changed the lethargic culture. A massive, soulless commercial gym chain just opened across the street.",
          "scenario_code_snippet": null,
          "hint": "Positive reinforcement isn't working; try tapping into the darker side of human motivation.",
          "target_answer_prose": "Make the chain the enemy",
          "target_answer_code": null,
          "common_trap": "Increasing the financial bonuses for trainers.",
          "explanation": "Humans are highly motivated by the desire to vanquish an enemy; defining a clear external threat unites the team and drives urgency."
        },
        {
          "variant_id": "enemy-intermediate",
          "difficulty": "intermediate",
          "scenario_prose": "Your engineering team is building a new decentralized messaging protocol. They believe in the mission of 'connecting the world securely,' but feature delivery has slowed to a crawl. They are comfortable and lack urgency. A heavily funded, highly arrogant rival company just announced a beta launch for a competing protocol.",
          "scenario_code_snippet": null,
          "hint": "The 'carrot' of a secure world isn't enough to make them code faster.",
          "target_answer_prose": "Villainize the rival company",
          "target_answer_code": null,
          "common_trap": "Reiterating the positive mission statement in an all-hands meeting.",
          "explanation": "Moving towards a positive vision uses about 30% of human motivation; running away from or fighting a tangible enemy activates the other 70%."
        },
        {
          "variant_id": "enemy-advanced",
          "difficulty": "advanced",
          "scenario_prose": "You are launching an agile software initiative within a massive, slow-moving corporate bank. The executives verbally support the idea, but middle management is passively resisting by delaying approvals and citing 'standard operating procedures.' There is no direct external competitor to point to in this specific internal context.",
          "scenario_code_snippet": null,
          "hint": "If you don't have a literal corporate rival, what abstract concept is killing your initiative?",
          "target_answer_prose": "Make bureaucracy the enemy",
          "target_answer_code": null,
          "common_trap": "Trying to appease middle management by slowing down your timeline.",
          "explanation": "When an external rival doesn't exist, highly effective leaders personify the status-quo, systemic inefficiency, or a broken system as the 'villain' to unite their team against."
        }
      ]
    }
  ]
}"#;
