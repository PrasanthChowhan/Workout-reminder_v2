# 4. Core Educational Engine (Variants, FSRS, and the Forgetting Curve)

* Status: accepted
* Date: 2026-08-13

## Context & Problem Statement

To build an effective technical learning overlay, we must overcome three cognitive and systemic hurdles:

* **The Pattern-Matching Trap (Why Variants?):** Standard flashcards fail because the brain seeks the lowest-friction path to an answer. Users rapidly memorize the syntactic shape or phrasing of a question rather than internalizing the underlying concept.
* **The Spaced Repetition Spam (Why FSRS?):** Generating multiple cards for the same concept to prevent pattern-matching breaks standard spaced repetition (like SM-2), causing the user to be redundantly tested on the exact same idea, leading to review fatigue.
* **The Forgetting Curve:** The human brain naturally and predictably discards unused information over time. We must interrupt this curve exactly at the moment of forgetting to achieve long-term retention, without over-testing the user.

## Decision

We are adopting a **Variant Architecture** scheduled by the **Free Spaced Repetition Scheduler (FSRS)**.

* **Scenario Variants (The Data Structure):** We will use a Strict JSON Schema to generate 3 context-varied, difficulty-scaled scenarios (beginner, intermediate, advanced) for every core concept. By hiding the target answer and changing the context, we force genuine problem-solving and eliminate pattern-matching.
* **FSRS (The Scheduler):** We will implement FSRS to dynamically calculate the optimal review intervals based on the user's unique forgetting curve. FSRS tracks memory Stability, Difficulty, and Retrievability with significantly higher accuracy than SM-2.
* **Concept-Level Tracking (The Integration):** FSRS will track the memory state of the *Concept*, not the individual variants. When the algorithm determines the concept is due, the application dynamically pulls the variant matching the user's current mastery level (escalating on success, resetting on failure).

## Consequences

* **Positive:** Completely neutralizes pattern-matching by forcing applied reasoning.
* **Positive:** Highly efficient review load; FSRS adapts dynamically to personal memory decay, minimizing unnecessary interruptions.
* **Positive:** Strict JSON separation of code and prose guarantees zero UI parser crashes.
* **Negative:** Managing embedded variant arrays and multi-variable FSRS state (DSR) increases database complexity.
* **Negative:** Generating 3 distinct scenarios per concept requires a larger token context, slightly increasing LLM API costs.
* **Negative:** Requires custom routing logic to bridge the FSRS schedule with the variant arrays.
