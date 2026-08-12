export const generateAiPrompt = (schemaString, options = {}) => {
  const userGoal = options.userGoal || "hip mobility";
  const userLevel = options.userLevel || "Beginner";
  const availableEquipment = options.availableEquipment || "[]";
  const sessionDuration = options.sessionDuration || "15";
  const injuries = options.injuries || "none";
  const preferredStyle = options.preferredStyle || "general";

  return `You are an expert personal trainer and physical therapist.

Your task is to generate a custom physical training program as a single valid JSON object that strictly conforms to the JSON schema provided at the end of this prompt.

The program must be tailored to the user’s requested goal, such as hip mobility, core strengthening, shoulder stability, lower body strength, posture improvement, or rehab-friendly movement.

Inputs
Use these inputs to tailor the program:

user_goal: ${userGoal}

user_level: ${userLevel}

available_equipment: ${availableEquipment}

session_duration_minutes: ${sessionDuration}

injuries_or_limitations: ${injuries}

preferred_style: ${preferredStyle}

If some inputs are missing, make conservative, safe assumptions appropriate for a general user. Do not ask the user any questions; just infer safe defaults.

Core Requirements
Output only a single JSON object.

Do not output markdown, explanations, comments, or any extra text before or after the JSON.

The JSON must strictly conform to the provided JSON Schema.

Include 5 to 8 exercises in the exercises array.

The routine must show a clear progression from easier to harder exercises.

Do not include warm-up or cool-down exercises; only the main working set.

The program must be safe and appropriate for the specified user level and limitations.

Program-Level Rules
The top-level program id must be deterministic and slug-like:

Format: program_<goal_slug>_<level_slug>_v1

Example: program_hip_mobility_beginner_v1

name:

Human-readable program name summarizing the goal and level.

Example: "Beginner Hip Mobility Routine"

description:

Short paragraph describing the intent of the program, who it is for, and what it focuses on.

Exercise Progression Rules
The exercises array must be ordered from easier to harder. Use a progression similar to:

Light mobility or activation

Controlled strength or stability

More challenging strength, coordination, or skill

Difficulty labels must match the progression:

For a Beginner user:

Mostly Beginner and Intermediate, with maybe one Advanced if justified.

For an Intermediate user:

Mostly Intermediate and Advanced.

For an Advanced user:

Can include Advanced and Expert where appropriate.

Do not assign difficulty labels randomly.

Exercise Field Rules
For each exercise in exercises, all required fields from the schema must be present:

id

name

description

execution_notes

category

muscle_groups

difficulty

equipment

duration_secs

sets

reps_min

reps_max

is_unilateral

rest_secs

video_url

image_url

IDs and names
Exercise id must be deterministic and slug-like:

Format: ex_<exercise_name_slug>

Example: ex_glute_bridge_hold, ex_side_lying_clamshell

name must be a clear, human-readable exercise name.

description should briefly explain the purpose or what the exercise targets.

execution_notes must include clear, human-readable instructions on:

How to set up the movement

How to perform it

How many reps or how long to hold

Any key coaching cues (e.g. “keep core braced, move slowly”)

Timing vs reps (mutual exclusivity)
You must respect this logic:

For a time-based / static hold exercise:

duration_secs must be a positive integer (e.g. 20, 30, 45, 60)

reps_min must be null

reps_max must be null

For a rep-based exercise:

duration_secs must be 0

reps_min must be a positive integer

reps_max must be a positive integer

reps_max must be greater than or equal to reps_min

Sets and rest
sets must be a positive integer:

Typically 2, 3, or 4 depending on difficulty and user level.

rest_secs must be a non-negative integer:

Typically between 15 and 90 seconds.

Harder exercises may have slightly longer rest.

Unilateral vs bilateral
is_unilateral:

true if the exercise is done one side at a time (e.g. lunges, single-leg bridges, side-lying leg raises).

false if both sides work together or it is not side-specific (e.g. planks, squats with both legs).

Category
category must be exactly one of the following strings:
- "Mobility"
- "Strength"
- "Power"
- "Core"
- "Skill"
- "Stability"
- "Neural Dynamics"
- "Static Stretch"
- "Dynamic Stretch"
- "Active Stretch"
- "PNF Stretch"
- "Static / Active Stretch"
- "Eccentric / Dynamic Mobility"
- "Static / PNF Stretch"
- "End-Range Static Stretch"
- "Passive Static Stretch"

Pick the category that best fits the primary purpose of the exercise.

Muscle groups
muscle_groups must be an array with at least one string.

Use clear, normalized muscle group names, for example:

"Glutes", "Hamstrings", "Quadriceps", "Hip Flexors", "Core", "Lower Back", "Shoulders", "Upper Back", "Adductors", "Calves".

You may list more than one muscle group when appropriate.

Equipment
equipment must be an array of strings.

It must:

Only contain items that are present in available_equipment, or

Be an empty array [] if no equipment is required.

Media fields
video_url:

Must be either null or a valid URL string.

Use null if you are not specifying a real URL.

image_url:

Must be either a non-empty string or null, matching the JSON Schema.

When an image or placeholder is available, use the pattern:

/assets/exercises/<exercise_id>.png

Example: for id: "ex_glute_bridge_hold", use "/assets/exercises/ex_glute_bridge_hold.png".

When no image is available, set image_url to null instead of inventing a URL.

Safety Rules
Avoid any exercise that clearly conflicts with injuries_or_limitations.

Example: For knee issues, avoid deep loaded squats or jumping.

For Beginner level:

Prefer simpler, controlled movements with stable positions.

Avoid high-impact or complex skill exercises.

For rehab-like or pain-relief goals:

Focus on controlled tempo, range of motion, and stability.

Avoid maximal loading or explosive actions.

Consistency and JSON Validity
The JSON must be syntactically valid and directly parsable.

All string values must be properly quoted.

There must be no trailing commas.

Every field required by the schema must be present.

Do not add any extra fields that are not defined in the schema.

Use consistent naming and formatting for IDs and fields.

Final Output Rule
Return only one valid JSON object that conforms exactly to the schema below.
Do not include any text or explanation outside of that JSON object.

JSON Schema
Paste the following schema verbatim after this line in your actual prompt:
${schemaString}`;
};

export const generateRecallAiPrompt = (topic = "Rust lifetimes and memory safety") => {
  return `You are an expert software engineering instructor.

Your task is to generate active recall cards (flashcards) in a structured JSON format for the topic: "${topic}". 

The output MUST strictly follow this JSON schema:

{
  "metadata": {
    "source_title": "Source documentation title or reference name",
    "source_url": "URL to the official documentation or reference"
  },
  "concepts": [
    {
      "concept_id": "concept-slug (e.g., rust-lifetimes)",
      "concept_title": "Clean, short title of the core concept",
      "tags": ["Rust", "Memory Management"],
      "variants": [
        {
          "variant_id": "concept-slug-var-1 (slug format)",
          "difficulty": "beginner, intermediate, or advanced",
          "scenario_prose": "A prose scenario or question targeting a specific edge-case or core understanding of this concept.",
          "scenario_code_snippet": "Optional code snippet illustrating the scenario (set to null if not needed).",
          "hint": "A subtle hint to prompt the correct mental model without giving away the answer.",
          "target_answer_prose": "The direct answer in prose explaining the correct behavior or resolution.",
          "target_answer_code": "Optional code snippet illustrating the correct answer (set to null if not needed).",
          "common_trap": "A common misconception or trap developers fall into regarding this specific scenario.",
          "explanation": "A deep-dive explanation of why the correct answer is what it is, covering the underlying mechanics."
        }
      ]
    }
  ]
}

Please generate high-quality concepts and variants for the topic specified.
Output ONLY the raw JSON object. Do not wrap it in markdown code blocks, and do not output any conversational explanations outside the JSON.`;
};

