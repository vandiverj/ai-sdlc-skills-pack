# context-save

## Description
Save current working state so future sessions can resume without reprocessing everything.

## Purpose
Preserve the current focus, pending work, unresolved questions, affected artifacts, verification status, next steps, and context routing.

Session checkpoints may contain historical handoff detail. Memory Bank files must not become session history.

## Output artifacts
- `docs/session-checkpoints/<date>-<topic>.md`
- `docs/memory-bank/activeContext.md`, when current focus, next action, branch, or blocker changed.
- `docs/memory-bank/progress.md`, when current status, pending work, known gaps, or not-yet-done work changed.
- `docs/memory-bank/decisionIndex.md`, when decisions or ADR links changed.
- `docs/memory-bank/contextIndex.md`, when future context selection guidance changed.
- `docs/context-state.md`, when assumptions, open questions, deferred decisions, blocked items, or affected artifacts changed.

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
- Do not copy the whole checkpoint into Memory Bank files.
- Do not copy raw MCP/tool output into Memory Bank files.

## Finished-work rule
Finished work should be documented primarily in code, tests, code-local docs, contracts, release docs, feature context links, PRs, or changelog entries. Do not re-store completed implementation history in Memory Bank files unless it affects current or future work.

## Tool-output rule
If tool or MCP output affected a decision, plan, contract, or implementation, record the verified fact, source/link, and project-version relevance in the owning artifact. Do not preserve raw tool output unless the project explicitly needs an audit attachment.

## Hard rules
- Do not use session checkpoints as the only durable memory for decisions or requirements.
- Do not let `activeContext.md` become a chronological log.
- Do not let `progress.md` become a changelog, issue tracker, or archive of all completed AI work.
- Do not claim context is saved if unresolved questions, blockers, pending work, or affected artifacts were discovered but not recorded.
- Do not duplicate full PRDs, model sections, contract specs, issue text, source docs, tool dumps, or ADR rationale into Memory Bank files.