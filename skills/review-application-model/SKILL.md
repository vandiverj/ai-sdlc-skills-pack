---
name: review-application-model
description: 'Challenge the application model before PRD creation.'
user-invocable: true
---

# review-application-model

## Description
Challenge the application model before PRD creation.

## Purpose
Find missing workflows, unclear boundaries, circular dependencies, and untestable assumptions before they become implementation drift.

## Checks
- Are workflows missing?
- Are feature boundaries clear?
- Are entities well-defined?
- Are there circular dependencies?
- Are permissions/trust boundaries unclear?
- Are external integrations vague?
- Is the MVP boundary realistic?
- Is the first vertical slice identifiable?
- Do diagrams match the written model?
- Are open questions recorded in `docs/context-state.md`?

## Loop behavior
If blocking gaps exist, return to `grill-me` or `model-application` and update `context-state.md`.
