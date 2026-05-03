# manage-context-state

## Description
Maintain the project's uncertainty ledger: what is assumed, unknown, deferred, blocked, superseded, affected, and only temporarily resolved when it still matters to current or future work.

## Use when
- A question cannot be answered yet.
- A decision changes or supersedes an earlier assumption.
- A feature reveals a dependency on another feature.
- A later task changes an earlier model, PRD, issue, contract, or context file.
- Before creating or updating a PRD.
- Before finishing a branch or saving a session checkpoint.
- The agent is relying on memory instead of durable artifacts.

## Purpose
Allow future sessions to resume from durable project state without rereading entire conversations or re-discovering known uncertainty.

`docs/context-state.md is not a history file. It is the current uncertainty and review-trigger ledger.

Decision rule: Memory Bank stores what is known and what is next. docs/context-state.md stores what is unknown, suspected, deferred, contradicted, blocked, or needs review.

## Output artifact
`docs/context-state.md`

## Related routing artifacts
- `docs/memory-bank/activeContext.md` owns current focus and next action.
- `docs/memory-bank/progress.md` owns current status, pending work, known gaps, and not-yet-done work.
- `docs/memory-bank/decisionIndex.md` owns decision links and short summaries.
- `docs/memory-bank/contextIndex.md` owns where to load context from.
- `docs/context-state.md` owns uncertainty, affected artifacts, and revisit triggers.

## Read first
1. Selected context packet from `select-context`, if available.
2. Existing `docs/context-state.md`.
3. Relevant Memory Bank routing files when the task affects focus, progress, decisions, or context selection.
4. Relevant `docs/application-model.md` sections.
5. Related PRDs, contracts, ADRs, issue text, feature `context.md`, or checkpoint files named by the task.

## Required context-state categories
- Assumptions.
- Open questions.
- Deferred decisions.
- Blocked items.
- Superseded decisions or stale artifacts.
- Cross-feature dependencies.
- Affected artifacts needing review.
- Revisit triggers.
- Recently resolved items only when they explain current assumptions, recently unblocked work, or affected artifacts.
- Recommended next skill.

Avoid duplicating current phase and active focus if they are already captured in `activeContext.md`.

## Status tags
Use these tags consistently: `[assumption]`, `[open-question]`, `[deferred]`, `[needs-review]`, `[superseded]`, `[blocked]`, `[resolved]`.

Use `[resolved]` sparingly. Once durable truth has moved to the owning artifact and the resolved item no longer affects current or future work, remove it or move it to an archive/checkpoint if the project keeps one.

## Required behavior
1. Identify the artifacts affected by the current task or new information.
2. Check existing unresolved questions related to those artifacts.
3. Add, update, resolve, defer, block, or supersede state entries.
4. When a decision changes, mark downstream PRDs, issues, plans, diagrams, feature contexts, docs, and Memory Bank indexes as `[needs-review]` where relevant.
5. Record the safe current assumption for unresolved questions, if work may continue safely.
6. Record what would resolve each open question.
7. Record revisit triggers, such as before implementation, before PRD review, before release, or when touching a named module.
8. Recommend whether `activeContext.md`, `progress.md`, `decisionIndex.md`, or `contextIndex.md` also needs an update.
9. Prune resolved/stale entries that no longer affect current or future work after their durable truth is captured elsewhere.

## Hard rules
- Do not use context-state as a replacement for a PRD, contract, ADR, application model, issue, feature context file, or Memory Bank routing file.
- Do not use context-state as a chronological history of AI work.
- Do not remove uncertainty because it is inconvenient. Resolve it only when evidence or user approval supports the resolution.
- Do not continue implementation if a blocking open question affects current acceptance criteria or safe-edit boundaries.
- Do not leave changed assumptions only in conversation history.
- Do not duplicate full requirements, architecture, contracts, or implementation history in context-state. Link to the owning artifact.

## Loop behavior
If context-state marks an artifact as `[needs-review]`, route the workflow back to the appropriate skill before relying on that artifact:

- Application structure changed -> `model-application` or `review-application-model`.
- Requirements changed -> `to-prd` or `review-prd-against-model`.
- Contract changed -> `write-contract-spec` or `review-contract-spec`.
- Task boundaries changed -> `diagram-issues`, `to-issues`, or `review-issue-dependencies`.
- Execution details changed -> `write-implementation-plan` or `review-implementation-plan`.
- Code behavior changed -> `update-context-docs`, then reviews.
- Context routing changed -> `update-context-docs` or `context-save`.

## Next skills
Usually return to the skill that needs the updated state, or use `context-save` at session end.