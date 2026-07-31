---
name: submodule-upgrade-planner
description: Audit git submodules from pinned to latest, read changelogs and fork-modification-log.md, and decide whether to keep, upgrade, or replace native implementation with upstream features.
---

## Purpose
Audit all git submodules in a repository and decide whether each should be kept, upgraded, rebased, or replaced by upstream capabilities instead of continuing a native implementation.

## Goals
- List all submodules with current pinned commit/version and upstream repository.
- Compare each pinned state against the latest upstream release.
- Read changelogs and release notes from pinned version to latest.
- Check whether upstream now provides the feature planned for native implementation.
- Use `fork-modification-log.md` to understand local fork changes and divergence.

## Inputs
- Repository with git submodules
- `fork-modification-log.md`
- Any repo docs, code comments, or specs describing the planned native feature

## Process
1. Enumerate submodules and record:
   - name
   - path
   - upstream URL
   - pinned commit or tag
   - whether it is a fork or tracks upstream directly
2. For each submodule:
   - find the latest upstream version or release
   - read changelog and release notes for all versions from pinned to latest
   - extract only changes relevant to the product use case and planned native feature, especially APIs, features, breaking changes, migrations, and performance improvements
3. Read `fork-modification-log.md` and classify each fork change as:
   - already upstream
   - partially upstream
   - not upstream
   - conflicting
   - obsolete
4. Decide per submodule whether to:
   - keep as-is
   - upgrade upstream
   - rebase or reduce fork
   - stop native work and use upstream

## Evidence rules
- Only claim a feature exists if it is explicitly documented in changelogs, release notes, docs, or `fork-modification-log.md`.
- Mark any conclusion based on inference or missing data as **low confidence** and explain why.

## Output

### Summary
- List submodules where upstream fully, partially, or does not cover the planned native feature.
- Call out high-risk upgrades.

### Audit table
| Submodule | Pinned → Latest | Key upstream changes (short) | Overlaps native feature? | Fork delta impact | Recommendation | Confidence |
|---|---|---|---|---|---|---|

### Notes per submodule
- Release range reviewed
- 2–5 bullet highlights from changelog relevant to the repo use case
- How upstream compares to the planned native feature
- How fork changes affect upgrade safety or value
- Final recommendation with 1–2 lines of rationale

## Guardrails
- Do not recommend removing or replacing native work unless specific upstream capabilities clearly support that decision.
- If the native feature spec is unclear, infer from context, state the assumption in one line, then continue.
