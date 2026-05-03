---
name: review-agent-strategy
description: 'Review whether the selected agent strategy, model tiers, delegation boundaries, and runtime adapter behavior fit the work class and evidence requirements.'
user-invocable: true
---

# review-agent-strategy

## Description
Review whether the selected agent strategy, model tiers, delegation boundaries, and runtime adapter behavior fit the work class and evidence requirements.

## Use when
- `choose-agent-strategy` produced a non-trivial delegation plan.
- Work is High-risk, production-intended, or uses specialist subagents.
- A delegated session appears noisy, duplicated, underpowered, overpowered, or hard to review.
- A human wants to check whether the right agent/model mix was used before continuing.

## Purpose
Prevent delegation from becoming hidden complexity. The review checks that agents were useful, bounded, cost-conscious, and accountable through normal Git review and verification evidence.

## Read first
1. Work classification and selected agent strategy.
2. Agent outputs, handoffs, changed files, recent commits, and verification evidence.
3. `docs/agents/*`, runtime adapters, AGENTS.md, and safe-edit boundaries.
4. Relevant PRD, contract, application model, implementation plan, threat model, and production-readiness review.

## Required output

```text
Agent strategy reviewed:
Work class and risk:
Expected agents/model tiers:
Observed agents/model tiers:
Delegation value:
Boundary findings:
Missing or excessive context:
Escalation handling:
Git reviewability impact:
Recommended changes:
Learning event needed:
Next skill:
```

## Checks
- Did delegation reduce risk, context load, or review burden enough to justify its cost?
- Were specialists used only where their perspective mattered?
- Did agents use the minimum model tier that could satisfy the evidence requirement?
- Were escalation triggers followed when lower-tier agents were blocked?
- Did read-only agents stay read-only?
- Did write-capable agents stay within assigned files and commands?
- Did handoffs include evidence, uncertainty, and next steps rather than raw context dumps?
- Did the strategy preserve a reviewable Git diff and intentional commit boundary?
- Did runtime adapter behavior match the portable `docs/agents/*` source of truth?

## Hard rules
- Do not approve a strategy that hides accountability behind many agent outputs.
- Do not treat model consensus as proof when tests, contracts, source artifacts, or deterministic tools are required.
- Do not preserve runtime-specific behavior that conflicts with the portable agent strategy.
- Do not update agent definitions from one weak signal; route recurring friction or serious near misses through process learning.

## Next skills
Usually `update-agent-definitions`, `capture-process-event`, `review-process-learning`, `review-agent-work`, `production-readiness-review`, or `context-save`.
