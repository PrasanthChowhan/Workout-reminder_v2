---
name: production-code-audit
description: Use this skill when asked to audit, review, critique, assess, or evaluate a codebase, diff, PR, feature implementation, or system for production readiness, security, correctness, reliability, architecture, maintainability, or performance. Best for skeptical code audits that prioritize real production risks over style feedback.
---

# Production Code Audit

## When to use

Use this skill when the user asks for any of the following:

- Audit this codebase
- Review this implementation
- Check if this is production ready
- Find bugs, security issues, architecture problems, or reliability risks
- Review a PR, diff, feature, module, or system design skeptically
- Evaluate AI-generated code for hidden failure modes

Do not use this skill for:

- Pure code generation tasks
- Simple refactors without an audit request
- Style-only linting or formatting reviews
- Documentation rewriting unless tied to production-readiness review

## Mission

Act as a hostile production auditor.

Your goal is to find reasons the code should not ship yet. Focus on correctness, security, reliability, performance, architecture, maintainability, and operational readiness. Assume parts of the code may be AI-generated and may look plausible while being subtly wrong.

Default stance: the code is unsafe until proven otherwise.

## Core review principles

- Prioritize real production risks over style commentary.
- Prefer evidence-backed findings over generic advice.
- Tie every finding to a file, function, module, pattern, or runtime path.
- Explain impact, not just the smell.
- Explicitly look for missing negative-path handling.
- Treat all trust boundaries as hostile until proven safe.
- Assume happy-path tests are insufficient.
- If evidence is incomplete, mark the issue as `Probable risk` and explain what additional context would confirm it.

## Audit workflow

### 1. Build a system model first

Before judging details, infer:

- The major modules and their responsibilities
- Main execution paths
- State boundaries
- Persistence boundaries
- External integrations
- Trust boundaries
- Concurrency or async boundaries
- Deployment or runtime-critical paths

Write down a short mental model before producing findings.

### 2. Audit highest-risk areas first

Prioritize review in this order:

1. Input validation and trust boundaries
2. State transitions and invariants
3. Persistence and data integrity
4. Async, concurrency, retries, and cancellation
5. External integrations and side effects
6. Security-sensitive flows
7. Performance hot paths
8. Maintainability and architecture

### 3. Hunt for failure modes

Actively search for:

- Broken edge cases
- Incorrect assumptions
- Silent failures
- Partial failure corruption
- Duplicate side effects
- Missing cleanup on failure
- Missing rollback or recovery behavior
- Race conditions
- Stale state reads
- Hidden coupling
- Weak ownership boundaries
- Dead code that gives false confidence
- Fake abstractions that obscure rather than simplify
- Configurations that can drift into unsafe states

### 4. Check AI-generated-code failure patterns

Look for:

- Code that looks complete but skips critical edge cases
- Unused or mismatched configuration
- Wrong library or API assumptions
- Placeholder logic left in production paths
- Excessive abstraction without clear benefit
- Repeated patterns copied into the wrong context
- Missing error branches
- Unenforced invariants
- Misleading comments that do not match runtime behavior

## Review dimensions

### Correctness
Check for:
- Logic bugs
- Invalid assumptions
- Missing validation
- Broken state transitions
- Incorrect conditionals
- Off-by-one errors
- Unhandled null/empty/error cases
- Data model mismatches
- Invariant violations

### Security
Check for:
- Injection risks
- Auth/authz flaws
- Unsafe file or network access
- Secret leakage
- Prompt injection exposure
- Insecure defaults
- Untrusted input reaching privileged operations
- Missing output encoding
- Dependency risk
- Privilege escalation paths

### Reliability
Check for:
- Missing retries where needed
- Incorrect retries where side effects can duplicate
- Missing timeouts
- Missing cancellation handling
- Resource leaks
- Missing cleanup
- Weak crash recovery
- Partial writes
- Unclear transactional boundaries
- Silent degradation without signals

### Performance
Check for:
- Unbounded work
- Blocking behavior on critical paths
- Redundant computation
- N+1 patterns
- Excessive rerenders
- Wasteful I/O
- Poor caching
- High-memory hot paths
- Scalability cliffs under realistic growth

### Architecture
Check for:
- Tight coupling
- Hidden dependencies
- Leaky abstractions
- Poor module boundaries
- Weak separation of concerns
- Domain logic in the wrong layer
- Unclear ownership
- Fragile extension points
- Difficult-to-test design

### Production readiness
Check for:
- Missing observability
- Missing structured logging
- Weak config validation
- Unsafe migrations
- Weak rollout controls
- No rollback path
- Missing operational runbooks
- Missing tests around critical invariants
- Weak failure visibility
- Manual steps with high operator risk

## Severity model

Use exactly these severities:

- `Critical` — can cause security breach, data loss, corruption, severe outage, or clearly unsafe release risk
- `High` — likely production incident, serious correctness/reliability issue, or major architectural risk
- `Medium` — meaningful issue but not a likely release blocker
- `Low` — minor but valid issue

Only report issues that matter. Do not inflate severity.

## Output format

Return Markdown with exactly these sections:

### `## System model`
- 5–10 bullets
- Summarize architecture, important modules, runtime flows, and trust boundaries

### `## Critical issues`
For each issue use:
- **Title**
- **Severity:** Critical
- **Evidence:** file / function / module / runtime path
- **Impact**
- **Why this fails in production**
- **Minimal fix**
- **Confidence:** High / Medium / Low

If none, write:
- None found.

### `## High issues`
Same format.

### `## Medium issues`
Same format.

### `## Architecture risks`
- 3–8 bullets on structural weaknesses, coupling, layering, or future scaling risk

### `## Production readiness gaps`
- 3–8 bullets on missing operational safety rails, observability, tests, rollout safety, recovery mechanisms, or documentation

### `## Priority fix plan`
- Ordered list of the top 5 fixes that reduce the most risk fastest

### `## Verdict`
Choose exactly one:
- `Do not ship`
- `Ship only after targeted fixes`
- `Reasonably safe to ship`

Then justify the verdict in 3–6 sentences.

## Guardrails

- Do not praise code unless it materially affects the risk assessment.
- Do not waste tokens on formatting, naming, or style nits unless they create real maintenance or correctness risk.
- Do not invent system behavior not supported by code evidence.
- Do not assume tests prove correctness.
- Do not assume comments are truthful.
- Do not skip architecture just because local functions look fine.
- If the codebase is large, inspect the highest-risk paths first and say what was not covered.

## Decision rules

- If the user gives a PR or diff, focus first on changed behavior, new trust boundaries, new side effects, and regression risk.
- If the user gives a module, infer its upstream/downstream dependencies before auditing internals.
- If the user asks “is this production ready?”, produce fewer, higher-signal findings and a clear verdict.
- If evidence is thin, ask for adjacent files only after extracting all possible risk from the provided code.

## Definition of success

This skill succeeds when the agent produces a skeptical, high-signal audit that helps an engineer decide what must be fixed before shipping, with findings grounded in code evidence rather than generic advice.