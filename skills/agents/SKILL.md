---
name: agents
description: 'Router skill for agent strategy, model tiers, delegation boundaries, runtime adapters, and portable agent definitions.'
user-invocable: true
---

# agents

## Purpose
Own agent strategy and portable role definitions so `run-sdlc` can delegate without hiding accountability.

## Use When
- Delegation, specialist agents, model tiers, runtime adapters, or agent definitions may reduce risk.
- Agent strategy needs review or update.

## Reference Selection

| Trigger or surface | Load reference |
| --- | --- |
| Create or update `AGENTS.md` project instructions | `references/setup-agent-instructions.md` |
| Choose from current portable bounded agent roles | `references/bounded-agent-catalog.md` |
| Choose delegation, specialists, model tier, or runtime adapter | `references/choose-strategy.md` |
| Define the portable agent contract shape | `references/portable-agent-definition-schema.md` |
| Translate portable roles into runtime-specific adapters | `references/runtime-adapter-rules.md` |
| Review whether delegation matched work class and evidence needs | `references/review-strategy.md` |
| Update portable agent definitions or runtime adapter guidance | `references/update-definitions.md` |

## Handoffs
- Use `review` for independent review of agent work or agent strategy.
- Use `process-learning` for repeated delegation friction or improvements.
- Escalate to `run-sdlc` when delegation changes consent gates or work class.

## Required Output
```text
Agent strategy task:
Work class:
Agents/model tiers:
Boundaries:
Runtime adapters:
Evidence contract:
Review handoff:
```

## Stop Rules
- Do not delegate write access without a safe edit boundary.
- Do not treat model consensus as proof when deterministic evidence is required.
