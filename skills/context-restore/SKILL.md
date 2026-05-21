---
name: context-restore
description: 'Restore the current project state before beginning work. Use this at the start of a new session or when returning to a project after time away.'
user-invocable: true
---

# context-restore

## Description
Restore the current project state before beginning work. Use this at the start of a new session or when returning to a project after time away.

## Purpose
Avoid reprocessing long conversations or scanning the whole repository by loading durable routing and state artifacts first.

## Read first
1. `engineering-context/index.md`, if present near the workspace.
2. `engineering-context/operations/sdlc/memory-bank/activeContext.md`, if present.
3. `engineering-context/operations/sdlc/memory-bank/contextIndex.md`, if present.
4. `engineering-context/operations/sdlc/memory-bank/progress.md`, if present.
5. `engineering-context/operations/sdlc/context-state.md`, if present.
6. Latest relevant file in `engineering-context/operations/sdlc/session-checkpoints/`, if present.
7. Current branch and working tree status.
8. Current task or user request.

For generic repositories that do not use `engineering-context`, fall back to the repo-local `docs/memory-bank/*`, `docs/context-state.md`, and `docs/session-checkpoints/*` paths.

## Memory Bank roles
- `activeContext.md`: current focus, recent changes, next action, branch, blockers.
- `contextIndex.md`: which docs, PRDs, feature contexts, workflows, or model sections are relevant for common tasks.
- `progress.md`: what is built, in progress, not started, and known issues.
- `productContext.md`: product north star, loaded only when product intent matters.
- `decisionIndex.md`: decision map, loaded when architectural or scope decisions matter.

## Process
1. Read the smallest restoration packet: active context, context index, progress, context-state, and latest checkpoint if needed.
2. Identify current phase, active focus, relevant stable decisions, open questions, deferred decisions, affected artifacts, and next recommended skill.
3. Determine whether product context, decision index, application model, PRD, or feature context must be loaded next.
4. Summarize only the context needed for the current request.
5. Do not scan the full repo unless the restored context is insufficient or contradictory.

## Output
- Current phase.
- Active focus.
- Current branch or workspace state.
- Durable context root used.
- Relevant progress status.
- Relevant open questions and affected artifacts.
- Recommended next skill.
- Minimum context packet for next step.
- Artifacts to avoid loading until needed.

## Hard rules
- Do not treat Memory Bank summaries as authoritative when they conflict with code, tests, PRDs, ADRs, application model, or feature context files.
- Do not load every memory and doc file by default.
- If restoration reveals stale or contradictory routing files, route to `manage-context-state` or `update-context-docs`.