---
name: git-commit
description: AI agent best practices for committing in Git, including submodules
---

# Git Commit Skill

## Purpose

Guide AI agents to create safe, clear, and reproducible Git commits, including correct commit behavior when submodules are involved.

## Scope

This skill applies only to committing behavior. It does not cover branching, merging, rebasing, release management, or repository setup.

## Core Rules

- Always include both a subject and a body in every commit message.
- Use an imperative subject line such as `Fix`, `Add`, `Remove`, `Update`, or `Refactor`.
- Keep the subject concise, ideally within 50 to 60 characters.
- Use the body to preserve context for future humans and agents.
- Keep each commit focused on one logical change.
- Do not mix unrelated edits in one commit.

## Commit Message Standard

### Subject

- Must be imperative.
- Must describe what changed.
- Must be short and specific.
- Must avoid vague subjects like `misc changes` or `update stuff`.

### Body

The body is required and must explain:

- Why the change was needed.
- What problem it fixes, changes, or introduces.
- The relevant context, including previous behavior versus new behavior.
- Any important tradeoffs, assumptions, or constraints.
- Related issue references when available.

## Commit Quality Rules

- Prefer small, reviewable commits over large bundled commits.
- Commit at meaningful checkpoints: completed fix, completed feature slice, stable refactor step, or preserved investigation result.
- Stage intentionally; do not commit accidental files, generated noise, or unrelated formatting.
- Ensure the commit message is understandable without reading the full diff.
- Optimize for future debugging, rollback, bisect, and agent reasoning.

## Submodule Rules

A parent repository stores a pointer to a specific submodule commit, not the submodule's working state. To keep history reproducible, commit order matters.

### Required Order

1. Commit the submodule changes.
2. Push the submodule commit.
3. Update the parent repository pointer.
4. Commit the parent repository.
5. Push the parent repository.

### Why This Order Matters

- It keeps old parent commits reproducible.
- It ensures the referenced submodule commit exists remotely.
- It prevents checkout failures and missing-commit errors.
- It allows humans and agents to move backward in history safely.

### Multi-Submodule Changes

If multiple nested submodules are changed:

- Commit and push from the deepest submodule upward.
- Update and commit each parent level only after its child commit is already available remotely.
- Finish with the top-level repository last.

## Reproducibility Rules

- Submodules should point to a specific commit SHA or stable tag, not a moving branch reference.[web:13][web:18]
- A parent repository should never reference a submodule commit that has not been pushed yet.[web:6][web:15]
- Shared history should remain stable; avoid force-pushing branches that other people or systems depend on.
- Commit messages should preserve enough intent that older commits remain interpretable during rollback or investigation.

## Agent Decision Policy

Create a commit when one of these is true:

- A bug fix is complete.
- A coherent feature slice is complete.
- A refactor step is stable.
- An investigation produced a useful preserved state.
- Work needs to be checkpointed before risky changes.

Do not create a commit when:

- The working tree contains mixed unrelated changes.
- The message cannot clearly explain why the change exists.
- A submodule change has not yet been pushed but the parent pointer is about to be committed.

## Agent Validation Checklist

Before committing, verify all of the following:

- The staged diff matches one logical change.
- The subject is imperative and concise.
- The body is present and contains why, context, and consequences.
- No accidental files are included.
- If submodules changed, the submodule commit was created and pushed before the parent commit is created.
- The resulting commit will still make sense months later to a human or another agent.

## Behavioral Guidance for Agents

- Favor clarity over brevity in the body.
- Favor atomic commits over convenience.
- Favor reproducibility over speed.
- When submodules are involved, explicitly reason about dependency order before committing.
- When uncertain, avoid committing until the staged scope and message intent are both clear.
EOF && sed -n '1,40p' output/git-commit-skill.md
