# Vision: Workout & Break Reminder (Cognitive Companion)

## The Problem
As a developer, I spend hours glued to my computer screen. When I get in the zone, I hyperfocus and lose track of time. This leads to two major issues:
1. **Physical Neglect**: I ignore eye strain (leading to dry eyes and headaches) and sit in the same posture for hours, neglecting physical movement and hydration.
2. **Cognitive Lock-In**: I often get stuck down rabbit holes or work on a problem the wrong way for hours without realizing it. I lack a structured mechanism to "zoom out," re-evaluate my approach, and solidify new concepts.

---

## The Solution
To solve this, I want to build a lightweight native desktop application (**Tauri + Rust + HTML/CSS/JS**) that acts as a **Cognitive Companion** rather than just a simple timer. It will enforce breaks while actively assisting my learning and code quality.

---

## Core Pillars of the Vision

### 1. The Dual-Break Rhythm
The app runs in the background and alternates between two healthy cycles:
* **Micro-Breaks (Every 20 mins for 20s)**: Strictly for eye health. The screen dims black, forcing me to look away from the monitor (20-20-20 rule) with zero text or cognitive distractions.
* **Active Breaks (Every 50 mins for 5 mins)**: For physical and mental resets. Shows guided stretch reminders alongside cognitive tools.

### 2. Cognitive Reset & Active Recall
Active breaks are used to break tunnel-vision and reinforce learning:
* **Reflection Prompts**: High-level alignment questions (e.g., *"What is the core problem you are solving right now? Is there a simpler way?"*) that shake me out of over-complicated approaches.
* **Active Recall Cards**: Randomly displays custom learning flashcards (Rust concepts, design patterns, tools) to turn breaks into fast study intervals.
* **Hacker-Friendly Customization**: Flashcards and prompts are managed directly in a plain text markdown/JSON file on my computer.

### 3. On-Demand "Refocus" Break
Whenever I feel stuck, frustrated, or over-analyzing a problem, I can hit a global system shortcut (**`Ctrl + Alt + R`**) to immediately trigger a 5-minute cognitive reset overlay. It acts as an instant "rubber-ducking" session.
