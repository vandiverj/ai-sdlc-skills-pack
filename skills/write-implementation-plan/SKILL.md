---
name: write-implementation-plan
description: 'Convert one issue, or a small coherent issue batch, into an executable implementation plan.'
user-invocable: true
---

# write-implementation-plan

## Description
Convert one issue, or a small coherent issue batch, into an executable implementation plan.

## Use when
- A PRD and issue exist, and implementation is the next step.
- A required contract spec has been reviewed, or the issue does not change a public/cross-boundary contract.
- A bug has been diagnosed and needs a controlled fix plan.
- A refactor needs safe sequencing and verification.
- A human or agent needs a plan that can be executed without guessing.

## Purpose
Make implementation testable, bounded, maintainable, and reviewable before editing production code.

## Read first
1. Work classification from `classify-work`.
2. Selected context packet from `select-context`.
3. Tool/MCP selection from `select-tools`, if external/current knowledge or tool access is needed.
4. The target issue or task.
5. Related PRD sections.
6. Related application model sections.
7. Related contract spec, if public or cross-boundary behavior changes.
8. Related feature `context.md` files.
9. Related ADRs or decisions, including approved technical approach.
10. Approved quality automation decisions or documented command contract, if relevant.
11. Approved retrieval approach, index freshness, and tool boundaries, if relevant.
12. Agent strategy, specialist roles, model-tier expectations, and runtime boundaries, if relevant.
13. Applicable implementation patterns, pattern status, canonical examples, and exceptions, if relevant.
14. Threat-model output or explicit not-required reason when risk surfaces are present.
15. Production readiness constraints, release expectations, rollback requirements, and Git review expectations when the work is production-intended.
16. Relevant open questions from `docs/context-state.md`.
17. Existing source files and tests only when needed to identify exact file responsibilities.

## Required output sections
- Plan status: Draft / Approved / Needs Review.
- Work class and risk level.
- Target issue or task.
- Related PRD sections.
- Related application model sections.
- Related contract spec or explicit "not required" reason.
- Related feature context files.
- Related context-state entries.
- Assumptions and unresolved questions.
- Files to create.
- Files to modify.
- Files expected not to change.
- Responsibility of each file.
- Step-by-step task order.
- Technical approach fit: approved stack/dependencies/services used, new technical choices needed, or explicit none.
- Quality automation fit: approved checks used, missing rails to address, or explicit none.
- Retrieval approach fit: approved retrieval/index sources used, freshness/update needs, missing rails to address, or explicit none.
- Agent strategy fit: single-agent/delegated plan, model tiers, specialist roles, handoffs, escalation triggers, or explicit none.
- Implementation pattern fit: applicable docs/patterns guidance, maturity status, canonical examples, exceptions, or explicit none.
- Threat model fit: approved findings/mitigations used, required threat model to run, or explicit not-required reason.
- Production readiness fit: release/merge/deploy expectations, rollback or mitigation path, observability/support needs, and Git commit boundary.
- Maintainability approach: readability, responsibilities, abstraction boundaries, duplication strategy, and pattern/dependency rationale.
- Tools/MCPs allowed, why they are needed, and what they may access.
- Test-first steps or explicit TDD exception.
- Testing strategy: unit / integration / contract / E2E / visual / snapshot / type-schema / smoke as applicable.
- Code-local documentation updates: public exports, shared types/schemas, integration boundaries, non-obvious behavior, invariants, errors, or examples.
- Security, privacy, dependency, license, migration, deployment, observability, performance, accessibility, and rollback considerations.
- Verification commands.
- Documentation and context updates.
- Safe-edit boundary.
- Checkpoint or commit points.
- Rollback or stop conditions.

## Plan quality bar
A plan is ready only if:

- Each task is small enough to execute and verify independently.
- Expected behavior is testable.
- File responsibilities are clear.
- The planned units are cohesive and readable.
- Abstractions, patterns, dependencies, frameworks, and services are justified by known requirements and approved technical approach.
- The plan avoids both harmful duplication and premature abstraction.
- Required tools/MCPs are justified and bounded.
- Verification commands are named and align with approved quality automation when present.
- Code-local documentation needs are identified or explicitly not applicable.
- Security/privacy/dependency/license/migration/deployment/operations risks are either addressed or explicitly not applicable.
- Missing, stale, or inadequate quality automation is addressed, deferred with rationale, or routed to `choose-quality-automation`.
- Missing, stale, risky, or unnecessary retrieval/indexing is addressed, deferred with rationale, or routed to `choose-retrieval-approach`.
- Missing, excessive, stale, or unsafe agent strategy is addressed, deferred with rationale, or routed to `choose-agent-strategy`.
- Missing, stale, disputed, deprecated, or newly needed implementation pattern guidance is addressed, deferred with rationale, or routed to `choose-implementation-pattern` / `update-implementation-patterns`.
- Required threat-model findings are addressed, deferred with rationale, or routed to `threat-model`.
- Production readiness needs are addressed for production-intended work, including reviewable scope, intentional commit boundary, rollback/mitigation, and observability/support expectations where relevant.
- Documentation/context updates are included.
- Open questions are either resolved, safely deferred, or explicitly blocking.
- The plan can be reviewed against the PRD, application model, and contract spec when present.

## Hard gates
- Do not implement while writing the plan.
- Do not write a plan for a vague issue. Send it back to issues, PRD, model, contract, or context-state refinement.
- If the issue changes public or cross-boundary behavior, do not write the implementation plan until `review-contract-spec` passes or the user explicitly accepts the risk.
- Do not skip tests because work seems small. If TDD is not practical, document the exception and alternate verification.
- Do not expand scope beyond the issue unless the PRD/model/contract/context-state are updated first.
- Do not allow an issue into execution until `review-implementation-plan` passes or the user explicitly accepts the risk.

## Stop and return when
- Acceptance criteria are missing or untestable.
- The issue contradicts the PRD, model, approved technical approach, or contract spec.
- The plan relies on unstated quality automation or introduces new tooling without approval.
- The plan relies on retrieval/RAG/index output as proof or introduces new retrieval tooling without approval.
- The plan relies on unstated delegation, model-tier assumptions, or runtime adapter behavior without `choose-agent-strategy` when the decision matters.
- The plan invents or copies a repeated implementation pattern without checking applicable `docs/patterns/*` guidance when such guidance exists or should exist.
- The plan has unreviewed threat-model requirements for security, privacy, data, untrusted input, external integration, dependency/supply-chain, AI/agent, or tool-access risk.
- Required files, module boundaries, or approved technical constraints are unknown.
- The public contract is missing but required.
- Security, privacy, migration, dependency, license, deployment, operations, or tool-access risk is present but unaddressed.
- Production-intended work lacks a reviewable commit boundary, rollback/mitigation path, or necessary observability/support expectation.
- Required code-local documentation would duplicate or contradict feature-level docs instead of linking cleanly.
- The plan would likely create tangled responsibilities, unjustified abstraction, or brittle coupling.
- The safe-edit boundary cannot be stated.
- A context-state open question affects implementation behavior.

## Next skills
Usually `choose-agent-strategy` when delegation/model tiers matter, `choose-implementation-pattern` when project patterns may apply, `threat-model` when risk surfaces need review, then `review-implementation-plan`, `create-work-branch`, `safe-edit-boundary`, and `execute-plan` / `tdd`.
