# Agent Strategy Review

Use when agents strategy guidance produced a non-trivial delegation plan, work is High-risk or production-intended, specialist subagents were used, or a delegated session appears noisy, duplicated, underpowered, overpowered, or hard to review.

## Read First
- Work classification and selected agent strategy.
- Agent outputs, handoffs, changed files, recent commits, and verification evidence.
- Portable `.agents/agents/*.md` definitions and runtime adapters.
- Relevant PRD, contract, model, implementation plan, threat model, and production-readiness evidence.

## Checks
- Delegation reduced risk, context load, or review burden enough to justify cost.
- Specialists were used only where their perspective mattered.
- Model tiers matched the evidence requirement and escalation triggers.
- Read-only agents stayed read-only; write-capable agents stayed within assigned files and commands.
- Handoffs include evidence, uncertainty, and next steps rather than raw context dumps.
- Strategy preserved a reviewable Git diff and intentional commit boundary.
- Runtime adapter behavior matched portable role definitions.

## Hard Rules
- Do not approve a strategy that hides accountability behind many agent outputs.
- Do not treat model consensus as proof when tests, contracts, source artifacts, or deterministic tools are required.
- Do not update agent definitions from one weak signal; route recurring friction through process learning.

## Output
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
