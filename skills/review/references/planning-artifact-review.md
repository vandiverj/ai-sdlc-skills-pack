# Planning Artifact Review

Use for application model, PRD-to-model, and issue dependency checks before implementation planning.

## Application Model Checks
- Workflows, actors, feature boundaries, and entities are present and coherent.
- Permissions, trust boundaries, external integrations, and MVP boundary are clear.
- Diagrams match the written model.
- The first vertical slice is identifiable.
- Open questions are recorded in context-state or the active planning artifact.

## PRD Against Model Checks
- PRD does not contradict the application model.
- PRD does not omit key modeled workflows.
- PRD does not introduce new entities or change MVP scope without updating the model.
- Acceptance criteria are tied to modeled workflows and are testable.

## Issue Dependency Checks
- Each issue maps to PRD/model intent.
- Dependencies are explicit and buildable in order.
- Each issue is independently testable.
- First issue is a useful vertical slice.
- Setup/foundation tasks are present only when they unlock implementation.
- Large issues are split before implementation planning.

## Output
- Artifact reviewed.
- Verdict: pass / revise / blocked.
- Missing workflows or boundaries.
- Contradictions or scope drift.
- Dependency/order problems.
- Required artifact updates.
- Recommended next skill.
