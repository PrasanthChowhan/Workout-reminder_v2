---
name: session-closeout
description: Updates canonical project documentation and prepares the repository for the next AI coding session without creating duplicate handoff summaries. Use at the end of a development session.
---

## Session closeout workflow

Follow these steps sequentially to ensure the repository is left ready for the next AI session with minimal additional context required.

Progress:
- [ ] Step 1: Update canonical documents (if changes occurred).
- [ ] Step 2: Record new architectural decisions.
- [ ] Step 3: Perform documentation hygiene.
- [ ] Step 4: Output the closeout report.

### 1. Update canonical documents

Review the work completed in the current session. Update the following files **only** if relevant changes occurred:

* **`ARCHITECTURE.md`:** Update for changes in structure, boundaries, ownership, or file placement.
* **`CONTEXT.md`:** Update for new product behavior, workflows, terminology, entities, or assumptions.
* **`DESIGN.md` / `SYSTEM_DESIGN.md`:** Update for new design tokens, UI conventions, runtime architecture, interfaces, or infrastructure assumptions.
* **`AGENTS.md` (Responsibility-level):** Update if new coding conventions, boundaries, workflows, or verification guidance were established.

### 2. Record architectural decisions

If a significant architectural decision was made during the session, create an Architectural Decision Record (ADR) in `docs/decisions/` using the standard project ADR template.

### 3. Documentation hygiene

* Remove stale documentation that no longer reflects the current codebase.
* Replace repeated text with links to ensure there is only one canonical source per concept.
* Preserve progressive disclosure (keep top-level files clean and link to detailed references).

---

## Gotchas

* **No temporary summary files:** DO NOT create `HANDOFF.md`, `SESSION_SUMMARY.md`, `AI_NOTES.md`, or any other temporary summary files. The repository itself must act as the source of truth.
* **No redundant execution:** Do not run additional code verification solely for the closeout process. Only record verification that was *already performed* during the session.
* **No duplication:** Do not duplicate information across multiple documents.
* **No unnecessary rewrites:** Do not rewrite or reformat documentation that was not impacted by this session's changes.

---

## Output format

When the closeout is complete, return a brief report using the exact template below. 

```markdown
### Session Closeout Report

* **Files updated:** [List of canonical files modified, or "None"]
* **Architectural changes:** [Brief summary of changes, or "None"]
* **New conventions:** [Brief summary of newly established patterns, or "None"]
* **ADRs created:** [Links to new ADRs, or "None"]
* **Human decisions required:** [List any blocking items or open questions for the developer, or "None"]