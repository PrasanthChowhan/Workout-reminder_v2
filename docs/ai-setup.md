# AI-Assisted Development: The Setup Memo

> Everything I learned the hard way so I never refactor an AI-built codebase again.

> [!WARNING]
> **The Cost of Skipping Setup:**
> If you start prompting an AI assistant without setting up guardrails first, here is exactly what will happen to your project within two weeks:
> 1. **The God Component Sprawl:** AI will continually append features to existing files rather than refactor, resulting in 1,200-line monster components that manage UI, state, file I/O, and business logic all in one place.
> 2. **Endless Duplication:** AI will copy and paste utility functions, regex parsers, and inline SVG icons across 6+ different files because writing them fresh is easier for the LLM than checking if they already exist.
> 3. **Token Bleed:** You will waste 15,000+ tokens per prompt on redundant, outdated, and contradictory documentation context files, inflating your API costs and causing the AI to hallucinate deprecated patterns.
> 4. **Architectural Drift:** Eager to complete tasks, the AI will autonomously install dependencies, restructure directories, and ignore styling systems, slowly turning your clean architecture into unmaintainable spaghetti.
>
> Spending 30 minutes to set up the architecture, guardrails, and templates below prevents weeks of manual refactoring.

---

## Table of Contents

1. [The Fundamental Mindset Shift](#1-the-fundamental-mindset-shift)
2. [Plan Before Execution](#2-plan-before-execution)
3. [The Token Economy](#3-the-token-economy)
4. [File Architecture: The Skeleton-First Approach](#4-file-architecture-the-skeleton-first-approach)
5. [Preventing God Components](#5-preventing-god-components)
6. [Eliminating Duplication](#6-eliminating-duplication)
7. [Design System Discipline](#7-design-system-discipline)
8. [The "Ask First" Philosophy](#8-the-ask-first-philosophy)
9. [Show Don't Tell: Rules That Actually Work](#9-show-dont-tell-rules-that-actually-work)
10. [Progressive Disclosure: Layered Documentation](#10-progressive-disclosure-layered-documentation)
11. [The Seed File Pattern](#11-the-seed-file-pattern)
12. [Verification Loops](#12-verification-loops)
13. [Session Handoff: When Context Resets](#13-session-handoff-when-context-resets)
14. [The Pre-Flight Checklist](#14-the-pre-flight-checklist)

---

## 1. The Fundamental Mindset Shift

**You are not a coder anymore. You are an architect.**

When you code by hand, you naturally avoid duplication because you remember
what you wrote. You don't create 1,000-line files because your eyes glaze over.
You don't inline the same SVG 6 times because copy-pasting feels wrong.

AI has none of these instincts. It has:
- **No memory** between sessions (context resets every conversation)
- **No guilt** about duplication (it doesn't know it already wrote that function)
- **No fatigue** reading long files (so it happily adds 200 more lines)
- **No aesthetic judgment** unless you give it exact specs
- **No awareness** of the rest of the codebase unless told to look

**Your job shifts from writing code to:**
1. Designing systems that constrain AI into doing the right thing
2. Writing rules that are impossible to misinterpret
3. Creating patterns for AI to follow (seed files, examples)
4. Reviewing output for structural violations before they compound

The 30 minutes you spend on setup saves 30 hours of refactoring.

---

## 2. Plan Before Execution

### The Problem

The most expensive mistake in AI-assisted development is saying
*"Build me a settings page"* without specifying the component breakdown.

AI will produce a working settings page — in one 1,200-line file. It works
perfectly. And now you're stuck with it because extracting components from a
working god component is harder than building them right the first time.

### The Rule

**Never let AI write code without a structural plan.**

For any feature larger than a single component, create a plan that specifies:

```markdown
## Feature: Settings Page

### Components (strictly one responsibility per file.):
1. SettingsModal.jsx — Tab router, open/close logic only
2. GeneralTab.jsx — App name, theme, language
3. TimerTab.jsx — Break intervals, durations
4. CardsTab.jsx — Flashcard CRUD
5. TracksTab.jsx — Exercise track orchestrator
   └── TrackListView.jsx — Grid of track cards
   └── TrackDetailView.jsx — Single track level view

### Shared UI needed:
- Modal.jsx (reusable, focus trap, ESC close)
- Icons.jsx (named icon exports)

### State ownership:
- Config state lives in SettingsModal
- Each tab receives only the slice it needs as props
- No tab imports another tab's CSS module
```

**Time cost:** 5 minutes to write this plan.
**Time saved:** 3 hours of refactoring a god component.

### The Sizing Heuristic

Before asking AI to build something, estimate the complexity:

| Complexity | Approach |
|-----------|----------|
| **Small** (<100 lines, single file) | Just ask. No plan needed. |
| **Medium** (2-5 files involved) | Write a bullet-point component breakdown. |
| **Large** (6+ files, multiple layers) | Write a full feature plan with file list, state ownership, and dependencies. |

### When to Stop and Plan

If you catch yourself saying any of these to AI, **stop and plan first:**
- "Add a modal to this component" → Plan: create a separate modal file
- "Add settings for X, Y, and Z" → Plan: how many tabs? what state?
- "Make this work with the backend too" → Plan: what commands? what data flows?

---

## 3. The Token Economy

### The Problem

Every AI conversation has a context window — a budget of tokens it can read
before it starts forgetting things. Every file the AI reads costs tokens.

If your documentation is 30,000 tokens of redundant context, AI is spending
half its budget just understanding what you already told it — leaving less
room for actually writing code.

### Real Numbers (from this project's audit)

| Document | Tokens | Redundant? |
|----------|--------|-----------|
| AGENTS.md | 590 | Duplicated dev commands |
| AI-HANDOFF.md | 2,428 | 90% copy of CONTEXT + DESIGN + AGENTS |
| CONTEXT.md | 925 | Duplicated state machine |
| README.md | 823 | Duplicated dev commands + design summary |
| DESIGN.md | 1,716 | Canonical (good) |
| docs/Vision.md | 554 | 90% redundant with CONTEXT |
| docs/spec.md | 1,368 | Outdated Phase 1 spec |
| **Total waste** | **~15,000** | **50% of all doc tokens** |

### The Rules

1. **Write once, link everywhere.** If break timings are defined in
   `CONTEXT.md`, every other doc links to it — never copies it.

2. **Budget your AGENTS.md.** It loads every turn. Target: <300 tokens.
   Put everything else in docs AI reads on-demand.

3. **Separate tiers of context:**
   - **Tier 0** (every turn): `AGENTS.md` — rules and commands only
   - **Tier 1** (first task): `CONTEXT.md` — what the app is
   - **Tier 2** (when needed): `DESIGN.md`, ADRs, schemas — deep specs
   - **Tier 3** (rare): Plans, reference docs — historical context

4. **Delete stale docs.** An outdated spec is worse than no spec — it
   actively misleads AI into using deprecated patterns.

---

## 4. File Architecture: The Skeleton-First Approach

### The Problem

AI doesn't decide where to put files based on architectural principles.
It decides based on what's convenient *right now*. If there's no `utils/`
folder, it'll inline the utility. If there's no `Icons.jsx`, it'll paste
the SVG inline. If there's no `components/settings/tracks/` folder, it'll
put everything in one file.

### The Rule

**Create the directory structure before AI writes any code.**

```bash
# Run this BEFORE your first AI prompt
mkdir -p src/components/ui
mkdir -p src/components/settings
mkdir -p src/hooks
mkdir -p src/utils
mkdir -p src/assets
```

Then create `ARCHITECTURE.md` with the map and the decision table:

```markdown
| I need to...           | Put it in...                        |
|------------------------|-------------------------------------|
| Add a UI component     | src/components/ + .module.css       |
| Add a shared icon      | src/components/ui/Icons.jsx         |
| Add a modal            | Own file, wraps <Modal>             |
| Add a utility          | src/utils/ (check existing first)   |
| Add a hook             | src/hooks/useXxx.js                 |
```

**Why the decision table matters:** It removes ambiguity. AI doesn't have to
"figure out" where something goes. It looks at the table, finds the row, and
puts the file there.

### The One-Responsibility-Per-File Principle

Enforce this as a hard rule:

```
RULE-F1: Enforce strictly one responsibility per file.
  * React: Extract nested UI (modals), static data, and complex hooks.
  * Rust: Isolate strictly by domain (e.g., DB, network, I/O).
  * CSS: Co-locate styles with components. Root CSS is for globals/resets only.
```

**What "one responsibility" means in practice:**

| ✅ One responsibility | ❌ Multiple responsibilities |
|---|---|
| `TrackListView.jsx` — renders a grid of tracks | `TracksTab.jsx` — renders list, detail, AI modal, confirm modal, video player |
| `useTimer.js` — manages countdown state | `App.jsx` — timer logic + layout + event listeners + toast system |
| `config_cmds.rs` — Tauri command wrappers | `timer_cmds.rs` — commands + business logic + UI side effects |

---

## 5. Preventing God Components

### The Problem

God components are the #1 output of AI-generated code. The pattern:

1. You ask AI to "build a settings tab for exercise tracks"
2. AI creates `TracksTab.jsx` — 300 lines, works great
3. You ask "add a detail view when I click a track"
4. AI adds it inside `TracksTab.jsx` — now 500 lines
5. You ask "add an AI workout generator modal"
6. AI adds it inside `TracksTab.jsx` — now 900 lines
7. You ask "add import from JSON file"
8. AI adds it inside `TracksTab.jsx` — **now 1,182 lines, 11 responsibilities**

Each addition was a reasonable 100-200 lines. But AI doesn't refactor as it
goes — it just appends. And you approved each step because it worked.

### Why AI Does This

- **Path of least resistance:** Adding to an existing file is faster than
  creating a new one and wiring imports.
- **Context locality:** AI can see the whole file it's editing, so it
  "knows" how to integrate. Creating a new file means figuring out props,
  imports, and data flow — more work.
- **No retrospective refactoring:** AI never stops and says "this file is
  getting too long, let me split it." It only does what you ask.

### The Prevention System: Two-Tier Responsibility Rule

**Line count is a proxy metric; the real problem is responsibility count.**

A 400-line component with **one responsibility** (e.g., a complex form with heavy client-side validation) is perfectly fine. A 150-line component with **five responsibilities** (renders list + detail + modal + handles file I/O + parses JSON) is a disaster regardless of line count.

A hard file size limit is a blunt instrument because AI can't count responsibilities—but it can count lines. However, if the limit is set too low or enforced too aggressively, you get the opposite problem:

#### What happens with overly aggressive limits

| Limit too tight | Resulting Code Smell |
|---|---|
| **Force-splitting a 300-line focused component** | 4 tightly-coupled 80-line files that constantly import each other |
| **Extracting every useState into a custom hook** | A custom hook returning 12+ states, making state tracking unreadable |
| **Making every `<section>` its own component** | A prop-drilling explosion that obscures the actual data flow |
| **Splitting a cohesive form into small pieces** | Complex state synchronization bugs and loss of semantic cohesion |

**Premature abstraction is as bad as no abstraction.**

#### The Solution: The Two-Tier System

Instead of a hard line limit, establish a two-tier system:
1. **Responsibility** is the hard, non-negotiable rule.
2. **Line count** is a diagnostic signal. If a file exceeds `~250 lines` (React) or `~300 lines` (Rust), it triggers a review to check if it's doing too much. If it is one cohesive, focused thing, it is fine to keep.

```
RULE-F1: Enforce strictly one responsibility per file. Use size (>250 lines for React, >300 lines for Rust) as a diagnostic signal to review for split, not a hard barrier.
```

**But limits alone aren't enough.** You need to anticipate the split:

**Before asking for a feature, decide the file breakdown:**
```
Me: "I want a settings tab for exercise tracks with:
     - A list/grid view of all tracks
     - A detail view when clicking a track
     - An AI workout generator modal

     Create these as SEPARATE components:
     - TracksTab.jsx (orchestrator, <200 lines)
     - tracks/TrackListView.jsx
     - tracks/TrackDetailView.jsx
     - tracks/AiWorkoutModal.jsx"
```

**The key phrase:** *"Create these as SEPARATE components."*

Without that explicit instruction, AI will put everything in one file
every single time.

### The Refactoring Trigger

If you notice a file growing past 200 lines during development, **stop
and split before continuing.** It's 10x easier to split a 250-line file
than a 1,000-line file.

---

## 6. Eliminating Duplication

### The Problem

AI duplicates code for the same reason it creates god components:
convenience. It's faster to paste an SVG inline than to check if an
`Icons.jsx` file exists and import from it.

**Real examples from this project:**
- `getYoutubeId()` — copy-pasted in 2 files verbatim
- Trash can SVG — inlined in 6+ components
- Close button SVG — inlined in 5+ components
- Refocus break trigger logic — duplicated in 3 Rust files
- Mock exercise data — embedded in 2 places (Rust + JS)
- CSS `.settings-header` styles — copied into SkipReasonModal

### The Prevention System

**Three rules that eliminate 95% of duplication:**

```
RULE-D1: Never inline SVG icons. Import from src/components/ui/Icons.jsx.
RULE-D2: Never duplicate utility functions. Check src/utils/ first.
RULE-D3: Never copy-paste logic across modules. Extract shared behavior.
```

**But rules only work if the target files exist.** This is where seed
files matter — see Section 11.

**When reviewing AI output, check for:**
- Any `<svg` tag inside a component file (should be an import)
- Any function that looks like it belongs in `utils/`
- Any regex or parser that might already exist somewhere
- Any block of code you've seen before in another file

---

## 7. Design System Discipline

### The Problem

"Make it look good" produces random colors, inconsistent spacing, and
mismatched typography. AI has no taste — it has training data. Without
exact specs, it'll use whatever colors were most common in its training.

Worse: different AI sessions produce different visual styles because
there's no shared reference point. Session 1 uses `#ff5c00` orange.
Session 2 uses `#f57c00` orange. Session 3 uses `rgb(255, 87, 34)`.
Now you have 3 slightly different oranges.

### The Rule

**Create `DESIGN.md` with exact values before any UI work.**

Minimum viable design system:

```markdown
## Colors
- --color-primary: #ff5c00        (buttons, accents)
- --color-success: #00e639        (progress, success states)
- --color-surface: #121414        (backgrounds)
- --color-on-surface: #e3e2e2     (text)
- --color-outline: rgba(255,255,255,0.1)  (borders)

## Typography
- Headings: Geist, 600 weight
- Body: Geist, 400 weight
- Mono/Labels: JetBrains Mono, 500 weight

## Spacing
- Base unit: 4px
- Component padding: 8px (2 units)
- Section gaps: 16px (4 units)

## Border Radius
- Buttons: 1rem
- Cards: 2rem
- Pills/Chips: 9999px
```

**Then enforce it:**
```
RULE-S3: Follow DESIGN.md. Do not invent new colors, fonts, or spacing.
         Use CSS custom properties defined in styles.css.
```

### CSS Custom Properties > Hardcoded Values

Define your design tokens as CSS variables in your root stylesheet:

```css
:root {
  --color-primary: #ff5c00;
  --color-success: #00e639;
  --color-surface: #121414;
  --radius-button: 1rem;
  --radius-card: 2rem;
  --spacing-unit: 4px;
}
```

AI will use these variables if they exist. If they don't, it'll hardcode
hex values — and every file will have slightly different ones.

---

## 8. The "Ask First" Philosophy

### The Problem

AI agents are eager to help. Too eager. Without guardrails, they will:
- Install npm packages you didn't ask for
- Create new top-level components in random locations
- Modify `package.json` or `tsconfig.json` without asking
- Add new root-level documentation files
- Restructure directories on their own initiative

Each of these is individually reasonable. Collectively, they create drift —
the codebase slowly diverges from your intended architecture.

### The Rules

```
RULE-A1: Ask before modifying config files.
         Never install dependencies autonomously.

RULE-A2: Ask before creating new top-level components or pages.
         Verify placement in ARCHITECTURE.md first.

RULE-A3: Ask before adding new root-level documentation files.
         Use docs/ or update existing files.

RULE-A4: Ask before commiting the code.
```

### Why These Specific Rules?

- **A1 (configs):** A rogue `npm install some-package` is nearly invisible
  but changes your dependency tree forever. Always require explicit approval.

- **A2 (new components):** If AI creates `src/components/NewThing.jsx`
  without asking, it might conflict with your planned architecture. Making
  it ask first forces it to check `ARCHITECTURE.md`.

- **A3 (new docs):** AI loves creating new markdown files. Without this
  rule, you'll end up with 6 root-level docs that all say the same thing.

- **A4 (commits):** Once it's committed, it's harder to undo. Having AI
  ask before committing gives you a review checkpoint.

---

## 9. Show Don't Tell: Rules That Actually Work

### The Problem

Prose rules are ambiguous. Compare:

**Prose (bad):**
> "Tauri commands should be thin wrappers that delegate to core modules."

**Code example (good):**
```rust
// ✅ DO THIS:
#[tauri::command]
pub fn complete_break(action: String, state: State<'_, AppState>) -> Result<(), String> {
    state.process_break_completion(&action)
}

// ❌ NEVER THIS:
#[tauri::command]
pub fn complete_break(action: String, state: State<'_, AppState>) -> Result<(), String> {
    let config = state.config.lock().unwrap();  // 50 lines of business logic...
}
```

The prose version leaves room for interpretation. The code example is
unambiguous. AI can pattern-match against it.

### The Rule

**Every critical rule in AGENTS.md should have a ✅/❌ code snippet.**

Good candidates for snippets:
- Error handling patterns (`.unwrap()` vs `.map_err()`)
- Component structure (import icons vs inline SVG)
- Tauri command pattern (thin wrapper vs god function)
- CSS module usage (import own styles vs drill from parent)
- ID generation (`crypto.randomUUID()` vs `Math.random()`)

### Template

```markdown
## [Rule Name]
RULE-XX: [One-line rule statement]

```[language]
// ✅ DO THIS:
[3-5 lines of correct code]

// ❌ NEVER THIS:
[3-5 lines of incorrect code]
```

---

## 10. Progressive Disclosure: Layered Documentation

### The Problem

If AI has to read 30,000 tokens of documentation before writing code, two
things happen:
1. It wastes tokens on context, leaving less for actual code
2. Information buried deep in a long doc gets ignored or forgotten

### The Solution: Three Tiers

```
Tier 0: AGENTS.md        ← Every turn. <300 tokens. Hard rules only.
Tier 1: CONTEXT.md        ← First task in session. ~900 tokens. What is this app?
Tier 2: docs/*             ← On-demand. Deep specs, schemas, ADRs.
```

**The key insight:** AI shouldn't need to read Tier 2 docs unless it's
working on the specific area they cover. ADRs about timer display don't
matter when AI is editing the settings page.

### How to Reference Without Duplicating

In `AGENTS.md`:
```markdown
## Key Docs (read on-demand, not every turn)
- Domain & glossary: [CONTEXT.md](CONTEXT.md)
- Design system: [DESIGN.md](DESIGN.md)
- Component map: [ARCHITECTURE.md](ARCHITECTURE.md)
```

**Notice:** Links, not copies. AI reads the linked doc only when it needs
to work in that area.

### The Hierarchy Rule

```
RULE-DOC1: Never duplicate information across docs.
           Write it once. Link to it.

RULE-DOC2: AGENTS.md must stay under 300 tokens.
           Add detail to CONTEXT.md or docs/ instead.
```

---

## 11. The Seed File Pattern

### The Problem

Rules tell AI what NOT to do. Seed files tell AI what TO do.

An empty `src/components/ui/` directory is an invitation for AI to create
whatever it wants. A `src/components/ui/Icons.jsx` file with one well-
structured icon export is a template that AI will follow.

### The Pattern

**Before AI writes any code, create one example file in each key location:**

```jsx
// src/components/ui/Icons.jsx — The seed file
// AI sees this pattern and adds new icons the same way

export function CloseIcon(props) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
```

```jsx
// src/hooks/useExample.js — The seed file
// AI sees this pattern for custom hooks

import { useState, useEffect } from 'react';

export function useExample(initialValue) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    // cleanup pattern
    return () => {};
  }, []);

  return { value, setValue };
}
```

### Why This Works

AI operates by pattern matching. When it sees:
- A file called `Icons.jsx` with exported icon components → it adds icons there
- A file called `useExample.js` with a hook pattern → it creates hooks the same way
- A `.module.css` file next to a component → it creates CSS modules for new components

**Without seed files:** AI invents its own patterns. Each session might
produce a different structure.

**With seed files:** AI follows the established pattern. Every session
produces consistent code.

### What to Seed

| Location | Seed File | What It Teaches AI |
|----------|-----------|-------------------|
| `src/components/ui/` | `Icons.jsx` | "Put all icons here as named exports" |
| `src/components/ui/` | `Modal.jsx` | "Use this for all modal dialogs" |
| `src/hooks/` | `useExample.js` | "This is how hooks should look" |
| `src/utils/` | `time.js` | "Pure functions, defensive checks" |
| `src/components/` | `Example.module.css` | "CSS modules are co-located" |

---

## 12. Verification Loops

### The Problem

AI writes code and moves on. It doesn't run your linter, doesn't check
for compile errors, doesn't verify the UI looks right. If you don't tell
it to verify, it won't.

### The Rule

**Bake verification commands into AGENTS.md:**

```markdown
## Verify After Changes

### Frontend
- RULE-V1: After modifying React/CSS files, check browser console for errors.

### Backend
- RULE-V1: After modifying Rust files, run `cargo check` in src-tauri/.
- RULE-V2: Run `cargo clippy` before concluding your turn.
```

### The Verification Hierarchy

| Change Type | Verification |
|------------|-------------|
| CSS only | Visual check — does it look right? |
| React component | Dev server + browser console |
| Utility function | Does the caller still work? |
| Rust code | `cargo check` + `cargo clippy` |
| Config file | Does the app still start? |
| New dependency | `npm install` succeeds? |

---

## 13. Session Handoff: When Context Resets

### The Problem

Every new AI conversation starts with a blank slate. AI doesn't remember:
- What you built yesterday
- What conventions you established
- What bugs you fixed
- What patterns you chose

This is why the same codebase accumulates different patterns over time —
each session's AI makes slightly different decisions.

### The Solution

The 6 files (AGENTS.md, ARCHITECTURE.md, CONTEXT.md, DESIGN.md, sub-
directory AGENTS.md files, README.md) ARE the handoff. They're not just
documentation — they're the institutional memory that survives context resets.

**When you finish a session:**
1. Is `ARCHITECTURE.md` still accurate? (New components added?)
2. Are there new patterns that should be in `AGENTS.md`?
3. Were there any decisions that should be an ADR?

**When you start a new session:**
- AI auto-reads `AGENTS.md` → knows all rules
- AI reads `ARCHITECTURE.md` on first task → knows the codebase map
- AI reads `CONTEXT.md` if needed → knows the domain

**No manual re-explanation needed.**

### The Anti-Pattern: AI-HANDOFF.md

Don't create a "handoff document" that summarizes everything else. That's
what happened in this project — `AI-HANDOFF.md` was 9,714 bytes of content
duplicated from 4 other files. It became stale within days and actively
misled new AI sessions.

Instead: keep your 6 source-of-truth files accurate. That IS the handoff.

---

## 14. The Pre-Flight Checklist

```
BEFORE AI WRITES ANY CODE:

□ 1. Stack decided and explicit
     (Framework, version, styling, language, anti-patterns)

□ 2. Directory structure created (empty folders)
     mkdir -p src/components/ui src/hooks src/utils

□ 3. AGENTS.md written (<300 tokens)
     ├── Stack context (first line)
     ├── Commands (dev, build, test, lint)
     ├── Ask-First rules (A1, A2, A3)
     ├── Hard rules (file size limits, no duplication)
     └── Links to tier-1 docs

□ 4. ARCHITECTURE.md written
     ├── Directory tree with annotations
     └── "Where to put new code" decision table

□ 5. CONTEXT.md written
     ├── What the app does (2-3 sentences)
     ├── Glossary of domain terms
     └── State machine / data flow

□ 6. DESIGN.md written (if UI project)
     ├── Exact color hex codes
     ├── Typography (font families, weights, sizes)
     ├── Spacing system (base unit)
     └── Component specs (border radius, shadows)

□ 7. Subdirectory AGENTS.md files written
     ├── Domain-specific rules with code snippets
     ├── ✅/❌ examples for critical patterns
     └── Verification commands

□ 8. CSS variables defined in root stylesheet
     (All DESIGN.md tokens as --custom-properties)

□ 9. Seed files created
     ├── Icons.jsx with one icon
     ├── Modal.jsx with focus trap
     └── One example in each key directory

□ 10. First commit made
      (Clean baseline to diff against)

DURING AI DEVELOPMENT:

□ Review every file for size (>200 lines? → split NOW)
□ Grep for inline <svg — should be zero after Icons.jsx exists
□ Check new files are in the right directory per ARCHITECTURE.md
□ Verify AGENTS.md is still <300 tokens
□ Update ARCHITECTURE.md when new components are created

AFTER EACH SESSION:

□ Is ARCHITECTURE.md still accurate?
□ Were there new conventions? → Add to AGENTS.md
□ Were there important decisions? → Create ADR in docs/adr/
□ Is any doc duplicating information? → Delete the copy, keep the original
```

---

## Summary: The 5 Things That Matter Most

If you read nothing else, remember these:

1. **Plan the component breakdown before asking AI to build anything.**
   Five minutes of planning prevents five hours of refactoring.

2. **Create the skeleton first.** Empty folders + seed files + ARCHITECTURE.md.
   AI follows existing structure. No structure = chaos.

3. **AGENTS.md is loaded every turn — keep it under 300 tokens.**
   Put rules there, not explanations. Link to deep docs, don't copy them.

4. **Show, don't tell.** ✅/❌ code snippets beat prose rules 10x.
   AI pattern-matches against examples, not paragraphs.

5. **"Ask First" rules prevent drift.** Three simple rules (don't modify
   configs, don't create top-level components, don't add root docs without
   asking) prevent 80% of architectural chaos.

---

*Written after auditing a project with a 1,182-line god component,*
*32 .unwrap() violations, 15,000 tokens of redundant docs, and SVGs*
*copy-pasted across 6 files. Don't be that project.*
