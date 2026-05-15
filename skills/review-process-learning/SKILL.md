---
name: review-process-learning
description: 'Aggregate process-learning events from multiple projects and turn repeated evidence into reviewed improvement proposals.'
user-invocable: true
---

# review-process-learning

## Description
Aggregate process-learning events from multiple projects and turn repeated evidence into reviewed improvement proposals.

## Use when
- The human wants to review process metrics across projects.
- Several projects have `<process-improvement>/events.jsonl` files (resolved via `sdlc-config`).
- A recurring friction point, verification gap, routing miss, or useful pattern should be evaluated for workflow improvement.
- The skills pack may need evidence-backed updates.

## Purpose
Convert project-local observations into portable improvements without treating metrics as automatic truth.

The review should separate project-specific fixes from reusable skills-pack, template, documentation, or tooling changes.

## Inputs
- One or more project `<process-improvement>/events.jsonl` files (resolved via `sdlc-config` per project).
- Optional project `<process-improvement>/friction-log.md` files.
- Related PRs, session checkpoints, verification evidence, or review findings when needed.
- Current skills pack docs and templates when recommending pack changes.

## Output artifacts
- A review report:
  - Single-project review → `<process-improvement>/reviews/<date>-process-learning-review.md`.
  - Cross-project review → `<process-reviews-cross>/<date>-process-learning-review.md` (`$VAULT_ROOT/_index/process-reviews/`).
- Optional skills-pack issues or PR-ready recommendations.

## Skill Improvement Loop
When repeated process events point to a workflow or skill gap, convert them into reviewed skill-change proposals instead of relying on memory.

Use this loop:
1. Aggregate events by repeated failure mode, near miss, or successful pattern.
2. Identify affected skills and the route location where the rule belongs.
3. Draft the smallest environment-neutral rule or checklist change.
4. Pressure-test the change with `test-skill-behavior` before editing the skill.
5. Record the result in the skills-pack changelog at `~/.agents/docs/process-improvement/skill-changelog.md` (the skills pack repo, NOT the consumer repo). This file is owned by the pack and versioned in its Git history.
6. Apply the skill update only after the proposal has a clear owner, evidence, and rollback/deprecation path.

## Review steps
1. Collect events from the selected projects.
2. Validate that events are recent enough, redacted, and linked to usable evidence.
3. Group by `eventType`, `phase`, `skill`, `impact`, and `candidateOwner`.
4. Identify repeated patterns, severe one-off misses, and high-value successes.
5. Separate likely fixes:
   - project-local `AGENTS.md`, commands, tests, docs, or context routing
   - skills-pack instruction changes
   - template changes
   - quality automation or retrieval/tooling changes
6. Rank recommendations by frequency, severity, confidence, and expected process cost.
7. Propose small changes with acceptance criteria and rollback criteria.
8. Record rejected or deferred changes with the reason.

## Recommended report sections
```text
# Process Learning Review: <scope/date>

## Scope
Projects reviewed:
Event date range:
Files inspected:

## Signal Summary
Total events:
High-impact events:
Repeated patterns:
Positive patterns worth preserving:

## Findings
- Pattern:
  Evidence:
  Affected projects:
  Likely owner:
  Recommendation:
  Acceptance criteria:
  Confidence:

## Project-Local Actions

## Skills-Pack Candidates

## Template Candidates

## Tooling or Automation Candidates

## Rejected or Deferred

## Next Review Trigger
```

## Ranking guidance
- Frequency matters only when events are comparable and projects are similar.
- A single high-risk near-miss can outrank repeated minor friction.
- Prefer narrow skill wording changes over broad workflow expansion.
- Prefer deterministic checks for repeated mechanical failures.
- Prefer project-local fixes when the evidence depends on one stack, team, repo shape, or deployment model.

## Hard rules
- Do not treat event counts as proof without reading the underlying evidence.
- Do not centralize sensitive project details unless they are redacted.
- Do not make the skills pack heavier unless the improvement prevents likely expensive failure.
- Do not replace human approval for workflow, tooling, dependency, privacy, or process-policy changes.

## Next skills
Usually `capture-process-event`, `choose-quality-automation`, `choose-retrieval-approach`, `setup-agent-instructions`, `update-context-docs`, or a focused skills-pack update.
