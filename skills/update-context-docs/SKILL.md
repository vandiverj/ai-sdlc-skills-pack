# update-context-docs

## Description
Keep durable context files, code-local documentation, and Memory Bank routing summaries aligned with code, requirements, and decisions.

## Purpose
Help future AI sessions understand what a feature does, where authoritative context lives, what is pending, and what should be loaded next without reprocessing the whole repository.

This skill does not preserve full AI activity history. Finished implementation truth should live in code, tests, code-local docs, contracts, release docs, and feature context links.

## Use when
- A feature is added.
- A module boundary changes.
- A workflow changes.
- A data relationship changes.
- A public API, CLI, UI, or system behavior changes.
- Implementation reveals something not captured in docs.
- Public/shared code-local documentation changed or should have changed.
- Current focus, pending work, known gaps, decision indexes, or context routing changed.

## Artifact ownership
- Code-local docs own function/class/type/module-local API truth: purpose, contract, invariants, side effects, errors, and examples.
- `src/features/<feature>/context.md` owns the feature-level map, workflow summary, important public surfaces, key files, related artifacts, limitations, and context-loading guidance.
- `docs/application-model.md` owns app structure, workflows, entities, modules, diagrams, and boundaries.
- `docs/prds/` owns requirements.
- `docs/contracts/` owns public and cross-boundary contract specs.
- `docs/decisions/` owns full decision rationale.
- `docs/context-state.md` owns uncertainty, affected artifacts, and revisit triggers.
- `docs/memory-bank/activeContext.md` owns current focus and next action.
- `docs/memory-bank/productContext.md` owns product north star.
- `docs/memory-bank/progress.md` owns current status, pending work, known gaps, and not-yet-done work.
- `docs/memory-bank/decisionIndex.md` owns the decision index and ADR links.
- `docs/memory-bank/contextIndex.md` owns the routing map for what to load when.
- `AGENTS.md` owns concise agent setup, commands, conventions, and verification guidance.

## Required checks
Before updating durable docs to match code, run or account for `assert-doc-sync` when any related dirty surface is true. If code and docs disagree, assume the implementation may be wrong until verified.
- Update code-local docs for public exports, shared types/schemas, integration boundaries, complex domain behavior, invariants, side effects, or error behavior.
- Update `src/features/<feature>/context.md` if behavior, structure, public surface, loading guidance, or related artifacts changed.
- Update `docs/application-model.md` if feature boundaries, workflows, entities, architecture, diagrams, or trust boundaries changed.
- Update `docs/contracts/` if public or cross-boundary behavior changed.
- Update `docs/context-state.md` for open, deferred, blocked, superseded, affected, or still-relevant resolved items.
- Update PRDs or issues if scope changed.
- Update Memory Bank routing files if focus, pending work, known gaps, decision links, product north star, or context selection guidance changed.
- Update `AGENTS.md` if commands, conventions, verification expectations, security gotchas, or agent workflow guidance changed.

## Feature context sections
Feature context should be thin and link-oriented when code-local docs are strong:

- Purpose.
- User workflow.
- Main public surface and links to documented source files.
- Key files and responsibilities.
- Domain concepts.
- Inputs and outputs at feature level.
- Dependencies and integrations.
- Events/state transitions.
- Validation and error-case summary.
- Test coverage map.
- Related artifacts: PRD, contract, model sections, ADRs, issues.
- Known limitations.
- When to load this context.
- Last updated.

## Code-local documentation rules
- Use TSDoc/JSDoc, docstrings, or the project's native documentation convention.
- Document public and shared surfaces, not every obvious private helper.
- Prefer documenting purpose, contract, invariants, side effects, errors, examples, and "why."
- Do not duplicate feature-level or product-level context in comments.
- Do not duplicate full API docs in feature context when source docs already own the detail; link to the documented source instead.
- Treat stale comments as bugs.

## Memory Bank update cadence
- `activeContext.md`: update at session end, task switch, branch switch, or blocker change.
- `progress.md`: update only when current status, pending work, known gaps, or not-yet-done work changed.
- `decisionIndex.md`: update only when a decision or ADR link changes.
- `contextIndex.md`: update when future agents should load different artifacts for a task, feature, or workflow.
- `productContext.md`: update only when the product thesis, target user, product principle, or non-goal changes.
- `docs/context-state.md`: update when uncertainty, assumptions, affected artifacts, or revisit triggers change.

## Memory Bank update rules
- Keep Memory Bank files concise.
- Link to authoritative artifacts instead of copying their content.
- Rewrite `activeContext.md` rather than appending a long log.
- Keep `progress.md` focused on current status, pending work, known gaps, and not-yet-done work.
- Mention completed work in `progress.md` only when it explains current state, unlocks pending work, or prevents confusion.
- Do not turn `progress.md` into a changelog, issue tracker, or archive of all AI-completed work.
- Keep `decisionIndex.md` as an index; ADR files own the rationale.
- Keep `contextIndex.md` focused on when to load which artifacts.

## Hard rules
- Do not duplicate full requirements, architecture, contracts, implementation history, or ADR rationale across docs.
- Do not move feature-level reasoning into source comments just to remove a context file.
- Do not mark docs updated if only code changed and no durable knowledge changed.
- Do not update docs merely to make surprising implementation behavior look intentional.
- Do not leave stale comments, stale feature context, stale unresolved items, or stale Memory Bank routing that points to superseded artifacts.
- If documentation updates reveal unclear requirements, update `context-state.md` and route back to the relevant model, PRD, issue, contract, or plan skill.