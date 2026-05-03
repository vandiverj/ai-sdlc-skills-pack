# AI SDLC Workflow

## Purpose
This document defines the project's AI-assisted development process.

## Core principles
1. Load the smallest safe context packet.
2. No meaningful code before approved design.
3. Diagrams are part of requirements.
4. Implementation must be testable before coding.
5. Completion requires fresh verification evidence.
6. Context docs are part of Definition of Done.
7. Agent roles, model tiers, and runtime adapters are optional execution aids; they must stay bounded and reviewable.
8. Implementation patterns are evidence-backed project guidance, not duplicate tooling or universal laws.

## Workflow
See `SUMMARY.md` in the skills pack for the full baseline.

## Agent strategy
- Portable source of truth: `docs/agents/`.
- Use `choose-agent-strategy` when delegation, specialist review, independent verification, or model-tier selection may reduce risk.
- Runtime-specific files are adapters and should point back to `AGENTS.md`, this workflow, and `docs/agents/`.
- Use the least powerful model tier and fewest agents that can satisfy the evidence requirement.

## Implementation patterns
- Portable source of truth: `docs/patterns/`.
- Use `choose-implementation-pattern` when project-specific forms, tables, APIs, tests, layouts, or feature structure may matter.
- Use `review-implementation-pattern` before completion when implementation patterns affected the change.
- Update patterns only from reviewed evidence, repeated friction, or material requirement/framework/design-system changes.

## Project commands
- Typecheck:
- Test:
- Lint:
- Format check:
- Health:

## Definition of Done
- [ ] Issue matches PRD.
- [ ] PRD matches application model.
- [ ] Tests added/updated.
- [ ] Verification run and recorded.
- [ ] Agent strategy, model-tier, or runtime adapter docs updated if they changed or should have changed.
- [ ] Implementation pattern docs updated if pattern guidance, maturity, examples, or exceptions changed.
- [ ] Feature context updated.
- [ ] Application model updated if structure changed.
- [ ] Context-state updated.
- [ ] Docs/examples updated if behavior changed.
