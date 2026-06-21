# Cycle 9 Token And Deterministic Routing Optimization

## Improvement Hypothesis
- Hypothesis: Deterministic fast-pass routing, context budget compilation, and evidence recommendations will reduce unnecessary token use and subagent delegation while preserving route-appropriate verification.
- Failure mode addressed: over-process, wrong context, weak verification, tool/runtime mismatch.
- Expected behavior change: agents check whether a task can use deterministic Micro/Tiny handling before loading broad context or spawning subagents.
- Expected developer experience change: small tasks need fewer prompts, fewer agent handoffs, and clearer local checks.
- Expected code-quality change: verification remains tied to touched surfaces instead of being replaced by model confidence.
- How we will know it worked: deterministic tests prove fast-pass eligibility, blocker detection, context budget compliance, evidence recommendations, and delegation suppression.
- How it could make things worse: an overly broad fast-pass could under-process risky work, so blockers include security, data, release, irreversible, broad, and multi-context signals.

## Candidate Approaches Considered
- Documentation-only guidance: rejected because it would still rely on every model to remember the same heuristics.
- New standalone router subsystem: rejected as too heavy and likely to drift from existing route/context/evidence helpers.
- Thin deterministic commands over existing helpers: selected because it reuses current route, context, evidence, profile, and agent-plan logic.

## Selected Approach
- Add `sdlc route fast-pass --task "..."` with a JSON contract for Micro/Tiny eligibility, blockers, checks, and delegation recommendation.
- Add `sdlc context compile --task "..." --budget <tokens>` to produce a bounded selected-context packet with deferred context.
- Add `sdlc evidence recommend --task "..."` to map files/surfaces to deterministic checks before LLM interpretation.
- Update `sdlc agents plan` to suppress delegated handoff roles when deterministic fast-pass criteria are met.
- Add `scripts/test-routing-optimization.mjs` so route/token/delegation behavior does not drift silently.

## Quality Oracle Ladder
- Best proof: downstream small-task run shows fewer model turns while preserving verification and final quality.
- Good proof: deterministic test covers fast-pass eligibility, fast-pass blockers, context budget, evidence recommendations, and agent delegation suppression.
- Fallback proof: command smoke tests against the current repository.
- Do not claim: actual provider token savings until measured on downstream tasks.

## Process Weight Budget
- New commands: three focused helper commands.
- New concepts: deterministic fast-pass contract, context compile budget.
- New files/artifacts: one process record and one test script.
- New human approvals: none.
- Removed complexity: fewer subagents and broad context loads for tiny work.
- Net process weight: lighter for Micro/Tiny, neutral for Standard+.

## Ten-Loop Review Log
1. Usability: command names match existing SDLC command style.
2. Capability: adds a deterministic way to avoid LLM/subagent use for small work.
3. Efficiency: context compile defers optional context instead of loading all docs.
4. Evidence integrity: evidence recommend emits commands/checks, not proof claims.
5. Safety: high-risk and irreversible terms block fast-pass.
6. Composability: reuses existing `fastPassAssessment`, context decision, evidence requirements, and agent plans.
7. Validation realism: test script runs real CLI commands.
8. Maintainability: schemas are small JSON contracts.
9. Adoption: README and router skills mention the commands.
10. Rollback: remove command exports, test, and docs without affecting core routes.

## Acceptance Criteria
- README typo/doc-only task is fast-pass eligible.
- Database deploy/migration task is not fast-pass eligible.
- Context compile stays within the requested budget.
- Evidence recommend includes deterministic checks for docs/adapter work.
- Agent plan suppresses handoff roles for deterministic fast-pass work.

## Validation Target Plan
- Current repository deterministic checks.
- CLI smoke tests via `scripts/test-routing-optimization.mjs`.
- Future downstream measurement should compare model turns/tokens before promoting token savings from expected to proven.

## Rollback Path
- Remove `routeFastPass`, `contextCompile`, `evidenceRecommend`, agent-plan suppression, and `scripts/test-routing-optimization.mjs`.
- Revert docs that mention the commands.
