# Context Index

## Load First
- `AGENTS.md` for commands and agent rules.
- `docs/context-state.md` for current uncertainty and revisit triggers.
- `docs/memory-bank/activeContext.md` for current focus.

## Product and Requirements
| Topic | Artifact | Load When |
| --- | --- | --- |
| App PRD | `docs/prds/app.md` | App-level requirements or scope matter. |

## Architecture and Decisions
| Topic | Artifact | Load When |
| --- | --- | --- |
| Application model | `docs/application-model.md` | Structure, workflows, entities, boundaries, or diagrams matter. |
| Decisions | `docs/memory-bank/decisionIndex.md` | Technical, product, or process decisions matter. |

## Agent Strategy
| Topic | Artifact | Load When |
| --- | --- | --- |
| Agent strategy | `docs/agents/agent-strategy.md` | Delegation, specialists, model tiers, or runtime adapters may matter. |
| Agent catalog | `docs/agents/agent-catalog.md` | Choosing or reviewing agent roles. |
| Model tiers | `docs/agents/model-tier-policy.md` | Selecting or escalating model tiers. |
| Delegation patterns | `docs/agents/delegation-patterns.md` | Splitting work across subagents or specialists. |
| Runtime adapters | `docs/agents/runtime-adapters.md` | Codex, VS Code/Copilot, Augment, Claude Code, or other tool behavior matters. |
| Learning loop | `docs/agents/learning-loop.md` | Updating agent definitions from reviewed evidence. |

## Implementation Patterns
| Pattern | Artifact | Status | Load When |
| --- | --- | --- | --- |
| Pattern index | `docs/patterns/README.md` |  | Work may touch repeated project-specific implementation surfaces. |
| Example pattern | `docs/patterns/pattern.md` | Template | Creating or updating a concrete pattern. |

## Features
| Feature | Context | PRD | Contracts | Load When |
| --- | --- | --- | --- | --- |
| Example | `src/features/example-feature/context.md` | `docs/prds/features/feature-prd.md` |  | Work touches the feature. |

## Verification and Operations
| Topic | Artifact or Command | Load When |
| --- | --- | --- |
| Agent commands | `AGENTS.md` | Running setup, tests, builds, or verification. |

## Retrieval or Indexes
| Tool or Index | Location | Freshness | Load When |
| --- | --- | --- | --- |

## Last Updated
- Date:
- Updated because:
