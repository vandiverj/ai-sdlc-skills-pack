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
1. `docs/memory-bank/activeContext.md`, if present.
2. `docs/memory-bank/contextIndex.md`, if present.
3. `docs/memory-bank/progress.md`, if present.
4. `docs/context-state.md`, if present.
5. Latest relevant file in `docs/session-checkpoints/`, if present.
6. Current branch and working tree status.
7. Current task or user request.

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
- Relevant progress status.
- Relevant open questions and affected artifacts.
- Recommended next skill.
- Minimum context packet for next step.
- Artifacts to avoid loading until needed.

## Hard rules
- Do not treat Memory Bank summaries as authoritative when they conflict with code, tests, PRDs, ADRs, application model, or feature context files.
- Do not load every memory and doc file by default.
- If restoration reveals stale or contradictory routing files, route to `manage-context-state` or `update-context-docs`.