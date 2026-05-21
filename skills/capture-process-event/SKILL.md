---
name: capture-process-event
description: 'Record lightweight process-learning events during real project work so repeated friction, gaps, and useful patterns can be reviewed later.'
user-invocable: true
---

# capture-process-event

## Description
Record lightweight process-learning events during real project work so repeated friction, gaps, and useful patterns can be reviewed later.

## Use when
- A workflow step caused confusion, delay, rework, skipped evidence, or user correction.
- A missing, stale, noisy, or underused quality, retrieval, context, or documentation rail affected the work.
- Classification, dirty surfaces, context selection, verification, review, or artifact sync had to be corrected mid-stream.
- A skill, template, project `AGENTS.md`, or workflow rule clearly helped avoid a likely failure.
- A contract, product-fit, or implementation-plan question was hidden in an artifact when it should have been surfaced in chat with a recommendation.
- The human asks to capture lessons for later process improvement.

## Purpose
Make process improvement evidence-based without relying on conversation memory or the human remembering every failing later.

Process events are observations, not decisions. They should be small enough to record during normal work and structured enough to aggregate across projects.

## Output artifacts
- `engineering-context/operations/sdlc/process-improvement/events.jsonl` when the workspace uses the legacy engineering-context profile.
- `engineering-context/operations/sdlc/process-improvement/friction-log.md`, optional human-readable rollup for notable events.
- Fallback generic paths: `docs/process-improvement/events.jsonl` and `docs/process-improvement/friction-log.md`.

## Skill Change Candidates
When an event reveals a reusable process gap, name the likely skill owner instead of storing it as a vague lesson. Prefer environment-neutral owners such as `run-sdlc`, `slice-product-fit`, `write-implementation-plan`, `review-implementation-plan`, `test-skill-behavior`, or `review-process-learning`.

Capture whether the lesson is a one-off project note, a project pattern, an agent definition update, or a portable skill update candidate.

## Event schema
Append one JSON object per line:

```json
{"date":"YYYY-MM-DD","project":"project-name","workClass":"Tiny|Standard|High-risk|Exploratory|Micro","phase":"classification|context|planning|implementation|verification|review|doc-sync|handoff|tooling|retrieval","eventType":"friction|gap|miss|correction|success|near-miss|suggestion","skill":"skill-name or none","impact":"blocked|rework|delay|risk-reduced|clarity-improved|unknown","summary":"short plain-language observation","evidence":"file, command, review note, or session evidence","candidateOwner":"project|skills-pack|template|tooling|unknown","privacy":"public|internal|sensitive-redacted"}
```

Use stable keys so simple scripts can merge events from many repositories.

## Capture rules
1. Prefer `engineering-context/operations/sdlc/process-improvement/` in the legacy engineering-context profile; otherwise prefer project-local files under `docs/process-improvement/`.
2. Keep each event short and factual.
3. Redact secrets, customer data, private URLs, tokens, credentials, and unnecessary source snippets.
4. Link or name evidence instead of copying long tool output.
5. Use `candidateOwner: project` when the fix likely belongs in local `AGENTS.md`, commands, docs, or tests.
6. Use `candidateOwner: skills-pack` when the same issue is likely portable across projects.
7. Use `candidateOwner: template` when starter docs or generated artifacts should change.
8. Use `candidateOwner: tooling` when deterministic automation or retrieval would prevent recurrence.

## What to capture
- Classification was wrong or confidence was too high.
- A gate was skipped but later needed.
- Context selection missed an artifact or loaded too much.
- Verification commands were missing, stale, slow, flaky, or unclear.
- Review found an issue that a skill/template could have prevented.
- Documentation or Memory Bank routing caused confusion.
- Retrieval/index output was stale, noisy, missing, or unusually useful.
- A user correction revealed a reusable process gap.
- A question needed a recommendation, rationale, tradeoff, or default action before the human could answer usefully.
- A workflow rule saved time or prevented drift.

## What not to capture
- Full implementation history.
- Raw terminal dumps.
- Private business data or secrets.
- Personal performance judgments.
- One-off noise with no plausible process lesson.

## Hard rules
- Do not make process events authoritative product, design, or technical decisions.
- Do not store process events only in hidden tool memory or conversation history.
- Do not block normal completion just to polish metrics.
- Do not use captured events to rewrite the skills pack automatically.

## Next skills
Usually return to the invoking skill, then use `review-process-learning` periodically to aggregate events across projects.
