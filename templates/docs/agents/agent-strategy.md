# Agent Strategy

## Status
Draft / Active / Needs Review

## Purpose
Define how this project uses AI agents, specialist roles, model tiers, delegation, escalation, and runtime adapters while keeping the Git diff, verification evidence, and source-of-truth artifacts reviewable by humans.

## First principles
1. Use the least powerful model and fewest agents that can satisfy the evidence requirement.
2. Escalate by evidence, not by anxiety or habit.
3. Keep specialists narrow, bounded, and accountable.
4. Prefer read-only exploration and review unless an agent has an approved edit boundary.
5. Keep runtime-specific adapter files thin; portable docs own the strategy.
6. Preserve human Git review through scoped changes, intentional commits, and fresh verification evidence.

## Operating model
- Orchestrator owns classification, route choice, delegation decisions, synthesis, and human-facing updates.
- Explorers gather context and risks without editing.
- Workers edit only assigned files under a safe-edit boundary.
- Reviewers check specific concerns and report findings rather than rewriting broadly.
- Verifiers run checks and report current-session evidence.

## Default strategy by work class
- `Micro`: single-agent, deterministic tools where possible.
- `Tiny`: single-agent unless a risk signal appears.
- `Standard`: single-agent or one bounded specialist when it reduces risk.
- `High-risk`: orchestrator plus relevant specialist review; use deeper model tiers where required.
- `Exploratory`: read-only exploration or spike worker with non-production boundary.

## Escalation triggers
- Confidence is below the threshold set by classification.
- Verification fails twice or fails for an unexplained reason.
- Requirements, contracts, code, tests, docs, or tool output conflict.
- Security, privacy, data, dependency, AI/agent, migration, deployment, or public-contract risk appears.
- Edit scope crosses the approved boundary.
- The current agent cannot produce a testable plan, reviewable diff, or fresh evidence.

## Related files
- `docs/agents/agent-catalog.md`
- `docs/agents/model-tier-policy.md`
- `docs/agents/delegation-patterns.md`
- `docs/agents/runtime-adapters.md`
- `docs/agents/learning-loop.md`

## Last updated
- Date:
- Updated because:
- Confidence:
