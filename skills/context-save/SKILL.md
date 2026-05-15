---
name: context-save
description: 'Save current working state so future sessions can resume without reprocessing everything.'
user-invocable: true
---

# context-save

## Description
Save current working state so future sessions can resume without reprocessing everything.

## Purpose
Preserve the current focus, pending work, unresolved questions, affected artifacts, verification status, next steps, and context routing.

Session checkpoints may contain historical handoff detail. Memory Bank files must not become session history.

## Output artifacts
- `<session-checkpoints>/<date>-<topic>.md`
- `<memory-bank>/activeContext.md`, when current focus, next action, branch, or blocker changed.
- `<memory-bank>/progress.md`, when current status, pending work, known gaps, or not-yet-done work changed.
- `<memory-bank>/decisionIndex.md`, when decisions or ADR links changed.
- `<memory-bank>/contextIndex.md`, when future context selection guidance changed.
- `<context-state>`, when assumptions, open questions, deferred decisions, blocked items, or affected artifacts changed.
- `docs/agents/*`, when agent roles, model-tier policy, delegation patterns, runtime adapters, or learning-loop guidance changed.
- `docs/patterns/*`, when implementation pattern guidance, maturity, examples, exceptions, or change triggers changed.
- `<process-improvement>/events.jsonl`, when real work exposed process friction, gaps, corrections, near misses, or useful successes worth later review.

## Required checkpoint sections
- Current branch or workspace.
- Current phase.
- Active focus.
- Decisions made or changed.
- Open questions.
- Deferred decisions.
- Blockers.
- Files changed.
- Tests/verification run.
- Tools/MCPs used and what durable facts, if any, were recorded.
- Agent strategy used, handoffs, model tiers, runtime adapter notes, and escalation decisions when they affected the work.
- Implementation patterns used, deviations, stale guidance, or pattern updates when they affected the work.
- Process-learning events captured, if any.
- Context files updated.
- Memory Bank files updated.
- Model/PRD/contract/issues alignment status.
- Next recommended skill.

## Memory Bank save behavior
- Rewrite `activeContext.md` to the latest current focus, next step, branch, and blockers.
- Update `progress.md` only when current status, pending work, known gaps, or not-yet-done work changed.
- Mention recently completed work in `progress.md` only when it explains current state, unlocks pending work, or prevents confusion.
- Update `decisionIndex.md` only when a decision changed, was added, or links to ADRs changed.
- Update `contextIndex.md` when future agents should load different artifacts or tools for a task, feature, or workflow.
- Update `docs/agents/*` only when durable agent strategy, model-tier, delegation, runtime adapter, or learning-loop guidance changed.
- Update `docs/patterns/*` only when durable project-specific pattern guidance changed or should change.
- Do not copy the whole checkpoint into Memory Bank files.
- Do not copy raw MCP/tool output into Memory Bank files.

## Frontmatter contract
Every saved artifact carries YAML frontmatter so multi-machine resume works without scanning bodies.

Session checkpoints (`<session-checkpoints>/<date>-<topic>.md`):

```yaml
---
project_slug: <slug>
machine: <SDLC_MACHINE_PROFILE>
date: <YYYY-MM-DD>
topic: <kebab-case>
---
```

Memory Bank files (`activeContext.md`, `productContext.md`, `progress.md`, `decisionIndex.md`, `contextIndex.md`):

```yaml
---
project_slug: <slug>
last_updated: <YYYY-MM-DD>
---
```

`<context-state>` follows the Memory Bank shape. `<process-improvement>/events.jsonl` is line-delimited JSON and carries `project_slug` and `machine` on each record instead of a frontmatter block.

Read `SDLC_MACHINE_PROFILE` from `sdlc-config` and `project_slug` from the active `.sdlc-project` marker. Do not hard-code either value.

## Finished-work rule
Finished work should be documented primarily in code, tests, code-local docs, contracts, release docs, feature context links, PRs, or changelog entries. Do not re-store completed implementation history in Memory Bank files unless it affects current or future work.

## Tool-output rule
If tool or MCP output affected a decision, plan, contract, or implementation, record the verified fact, source/link, and project-version relevance in the owning artifact. Do not preserve raw tool output unless the project explicitly needs an audit attachment.

## Agent-output rule
If agent strategy, subagent output, model-tier escalation, or runtime adapter behavior affected a decision, plan, implementation, verification, or review, record the durable fact in the owning artifact. Do not preserve raw agent transcripts as project memory.

## Pattern-output rule
If project-specific pattern guidance affected a decision, plan, implementation, verification, or review, record the durable fact in the owning artifact. Do not turn pattern docs into duplicates of deterministic tooling.

## Hard rules
- Do not use session checkpoints as the only durable memory for decisions or requirements.
- Do not let `activeContext.md` become a chronological log.
- Do not let `progress.md` become a changelog, issue tracker, or archive of all completed AI work.
- Do not claim context is saved if unresolved questions, blockers, pending work, or affected artifacts were discovered but not recorded.
- Do not duplicate full PRDs, model sections, contract specs, issue text, source docs, tool dumps, or ADR rationale into Memory Bank files.
- Do not duplicate full agent transcripts, specialist reports, or runtime adapter configs into Memory Bank files; link to the owning artifact or checkpoint.
- Do not duplicate full implementation pattern docs into Memory Bank files; link to `docs/patterns/*`.
- Do not mix process-learning events into Memory Bank files; use `<process-improvement>/events.jsonl`.
