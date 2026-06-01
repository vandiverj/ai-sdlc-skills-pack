---
name: context
description: 'Router skill for restoring, saving, updating, asserting, and managing durable project context.'
user-invocable: true
---

# context

## Purpose
Keep durable project context aligned with current work without treating conversation memory as source truth.

## Use When
- Resuming work, saving state, updating docs/context, checking doc sync, or managing uncertainty.
- `run-sdlc` needs project state before or after a phase.

## Reference Selection

| Trigger or surface | Load reference |
| --- | --- |
| Start/resume a project or session | `references/restore.md` |
| First-run repository setup, machine/runtime profile, capability profile, or bootstrap template | `references/repository-bootstrap-template.md` |
| End a phase or preserve current state | `references/save.md` |
| Update durable docs, AGENTS.md, context files, or Memory Bank routing | `references/update-docs.md` |
| Confirm code/tests/contracts/docs/context agree | `references/assert-sync.md` |
| Track assumptions, unknowns, deferred items, blockers, superseded decisions, or affected surfaces | `references/manage-state.md` |

## Handoffs
- Use `planning`, `implementation`, `quality`, or `review` for phase-specific work.
- Escalate to `run-sdlc` if restored context changes the route.

## Required Output
```text
Context task:
Sources read:
Current state:
Open questions:
Artifacts updated:
Next skill:
```

## Stop Rules
- Do not use chat history as durable truth when project artifacts disagree.
- Do not silently update docs to match code before classifying whether code, docs, tests, or requirements are wrong.
