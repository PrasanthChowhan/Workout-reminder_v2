# Ubiquitous Language Glossary

> **What is this?** This document defines the exact terminology we use to discuss our business and structure our code. To prevent cognitive load and translation errors, future developers must use these terms exclusively in classes, variables, database schemas, and daily conversations.

## 🏢 Core Domain Entities
*(List the primary nouns/objects of the system with their distinct identities. Format as a table.)*

| Domain Term | Definition | Why this name? |
|---|---|---|
| **MicroBreak** | A brief (e.g., 20-second) absolute-black screen overlay designed solely for eye health, minimizing cognitive load. | Clearly separates brief eye-rest intervals from longer physical/learning breaks. |
| **ActiveBreak** | A longer (e.g., 5-minute) structured session featuring physical stretches and active recall exercises. | Emphasizes that this interval requires active user engagement, not just rest. |
| **RefocusSession** | An on-demand, user-triggered reflection overlay designed to break hyperfocus or mental blocks via journaling prompts. | Focuses on the business goal ("refocusing") rather than the technical trigger ("overlay" or "shortcut"). |
| **Flashcard** | A learning prompt containing a question, answer, and optional category/source used during ActiveBreaks. | "Flashcard" is the universally understood domain term for question/answer learning tools. |
| **ReflectionPrompt** | A high-level alignment question presented during a RefocusSession to help engineers rubber-duck their current problem. | Specifically describes the intent of the text: prompting reflection. |
| **PhysicalTrack** | A curated, progressive program or sequence of physical stretches and exercises. | "Track" implies a structured, followable path, separating it from individual exercises. |
| **StretchRoutine** | A standalone physical movement or posture adjustment cue executed during an ActiveBreak. | Distinguishes the physical action from a general exercise, aligning with the desk-bound context. |
| **UserProgress** | The current state of an engineer's journey through a PhysicalTrack, including active level and session counts. | Clearly represents the accumulation of the user's completed actions. |

## ⚙️ Value Objects
*(List the concepts that measure, quantify, or describe things but don't have their own unique identity—e.g., Money, Address, DateRange).*

| Term | What it represents |
|---|---|
| **TimerState** | The current status (running, paused, finished) and remaining duration of a background timer cycle. |
| **SkipReason** | The justification provided by the engineer (e.g., "Flow State", "Meeting") when bypassing a scheduled break. |
| **BreakInterval** | The configured duration between scheduled breaks and the length of the break itself. |
| **StretchDuration** | The target hold duration or repetition count for a specific StretchRoutine. |
| **ExerciseMetadata** | Extra dynamic parameters (like excluded exercises or unilateral flags) attached to a StretchRoutine or PhysicalTrack. |

## ⚡ Domain Actions & Events
*(List the core verbs, commands, and state changes. What actually happens in this system?)*

| Action (Command) | Resulting Event | What it means |
|---|---|---|
| **InitiateMicroBreak** | `MicroBreakInitiated` | The system dims the screen to enforce an eye-health reset. |
| **InitiateActiveBreak** | `ActiveBreakInitiated` | The system presents the split-screen stretching and active recall interface. |
| **TriggerRefocus** | `RefocusSessionTriggered` | The engineer actively summons the reflection overlay to break a mental block. |
| **SkipBreak** | `BreakSkipped` | The engineer performs a deliberate long-press to bypass a break, recording a SkipReason. |
| **CompleteBreak** | `BreakCompleted` | The engineer successfully finishes a break session, updating their UserProgress. |
| **ToggleTimer** | `TimerStateChanged` | The engineer pauses or resumes the background break countdown from the system tray. |
| **AdvanceTrackLevel** | `TrackLevelAdvanced` | The engineer completes enough sessions to move to the next difficulty level in their PhysicalTrack. |
