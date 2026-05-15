---
name: model-application
description: 'Create or update the durable, diagrammed application model before PRDs, issues, or meaningful implementation.'
user-invocable: true
---

# model-application

## Description
Create or update the durable, diagrammed application model before PRDs, issues, or meaningful implementation.

## Use when
- Starting a new application.
- Adding a major feature or subsystem.
- Existing features, workflows, entities, or module boundaries are unclear.
- Implementation or review reveals that the current model is wrong, stale, or incomplete.

## Purpose
Prevent drift by defining the application's structures, workflows, data, components, failure modes, and boundaries in durable form.

## Output artifact
`docs/application-model.md`

## Read first
1. Selected context packet from `select-context`.
2. `<context-state>`, especially open questions and affected artifacts.
3. Existing `docs/application-model.md`, if present.
4. Approved technical approach ADRs or decision notes, if present.
5. Related PRDs, ADRs, feature `context.md` files, or source files named by the context packet.

## Required sections
- Status: Draft / Active / Needs Review / Superseded.
- Application overview.
- Users / actors.
- Core workflows.
- Feature areas.
- Domain entities.
- Data relationships.
- System components.
- Approved technical approach and constraints.
- Module boundaries.
- Dependency direction.
- Cohesion and coupling notes for major modules or subsystems.
- Data flow.
- State transitions, when relevant.
- External integrations.
- Runtime, persistence, deployment, and operations boundaries when relevant.
- Trust boundaries.
- Failure modes.
- Edge cases.
- Test coverage strategy.
- NOT in scope.
- What already exists.
- Risks / unknowns.
- Related decisions and ADRs.
- Last updated metadata.

## Required diagrams
Use Mermaid unless the project has a stronger local diagram convention.

- Feature map.
- User workflow diagram.
- Domain/entity diagram.
- Component/module diagram.
- Data flow diagram.
- State transition diagram when relevant.
- Task or feature dependency diagram when ordering matters.

## Modeling process
1. State the modeling scope: whole app, feature area, subsystem, or correction.
2. Identify stable facts, assumptions, open questions, and deferred decisions.
3. Map users, workflows, entities, modules, data flow, technical constraints, and boundaries.
4. Check whether the app contains independent subsystems. If yes, define each subsystem's purpose, dependencies, build order, and whether it needs its own PRD or issue sequence.
5. Check cohesion, coupling, and dependency direction for major modules.
6. Add diagrams for relationships that would otherwise require prose-heavy explanation.
7. Mark uncertain sections clearly instead of inventing certainty.
8. Update `<context-state>` with new open questions, changed assumptions, affected artifacts, and revisit triggers.
9. Present the model for review before PRD or issue generation.

## Engineering principle guidance
- Model boundaries should help future maintainers understand the story of the system.
- Prefer cohesive modules with clear reasons to change.
- Prefer explicit dependency direction over hidden coupling.
- Use design patterns only when they clarify repeated structure or reduce real complexity.
- Avoid modeling speculative abstractions not required by the current product direction.

## Hard gates
- Do not create PRDs, issues, or implementation plans from an unreviewed model or missing required technical approach decision for meaningful work.
- Do not hide unknowns in polished prose. Record them in the model and context-state.
- Do not let diagrams become decoration. Each diagram must clarify a requirement, dependency, state, boundary, or data relationship.
- If the model contradicts current code or tests, identify the contradiction and route it through review rather than silently choosing one.

## Loop behavior
- If user answers change scope, update the model and context-state before continuing.
- If review finds blocking gaps, return to `grill-me`, `define-application`, `choose-technical-approach`, or another modeling pass.
- If implementation reveals a missing requirement, stop expanding implementation and update the model, PRD, issue, or context-state as appropriate.

## Next skills
Usually `manage-context-state`, then `outside-voice-review` or `review-application-model`, then `to-prd`.