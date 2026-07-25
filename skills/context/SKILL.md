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

## Context Budget Discipline

Context management is now a local artifact workflow, not a prompt dump.

## Curated Knowledge Retrieval

When an approved context MCP is available, use it first for cross-repo
engineering knowledge:

- Search with `search_knowledge` before manually scanning a local
  engineering-context checkout.
- Load specific docs with `get_context_doc` when a context id or path is known.
- Use `list_context_by_repo` or `list_context_by_domain` to find relevant
  curated context before broader repository search.

Treat MCP results as pointers to curated source artifacts, not hidden memory.
The Git-versioned engineering-context repository remains the editable curated
source. If MCP is unavailable or stale, fall back to configured local context
roots and record the freshness cap.

When a task pack is retrieved with `get_task_context`, record the returned
`pack_ref` in the run state alongside the packet. It is the only handle that
links a later outcome back to the retrieval that produced it, and the phase that
retrieves context is rarely the phase that finishes the work — an unrecorded
`pack_ref` cannot be recovered afterward. Reporting the outcome is
`run-sdlc/references/outcome-reporting.md`.

Propose new durable facts through the context/knowledge candidate flow when
available. Do not silently rewrite curated context docs without human approval.

Use these helpers when available:

```bash
sdlc context budget --task "..."
sdlc context assemble --phase planning --task "..."
sdlc context compact --task "..."
sdlc context ledger --task "..."
```

Principles:

- Keep durable state in `.ai-local/sdlc-runs/` or configured context roots.
- Send the model a phase-specific context packet, not every known document.
- Exclude archived plans by default.
- Summarize raw tool output before including it in a model prompt.
- For product-sensitive details, include sanitized summaries unless the local repo policy allows the exact detail.
- If a packet is insufficient, request the smallest specific additional context needed for the next action.
