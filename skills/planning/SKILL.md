---
name: planning
description: 'Router skill for product framing, application definition, modeling, PRDs, issues, contracts, decisions, and implementation plans.'
user-invocable: true
---

# planning

## Purpose
Route planning work to the smallest useful planning stack before implementation.

## Use When
- A request needs product framing, application definition, modeling, PRD, issues, contract spec, decision brief, product-fit slice review, or implementation plan.
- `run-sdlc` is in new-project, new-feature, refactor planning, exploratory, or plan-gate mode.

## Reference Selection

| Trigger or surface | Load reference |
| --- | --- |
| Feature value, product direction, or "should we build this?" is unclear | `references/product-reframe.md` |
| Whole app or major capability needs definition | `references/define-application.md` |
| Application model, workflows, actors, entities, diagrams, or system shape | `references/model-application.md` |
| Standard slice, actor/input/contract/data/AI authority, or predecessor-slice fit | `references/slice-product-fit.md` |
| PRD creation or update | `references/prd.md` |
| Issue breakdown, dependency order, or testable slices | `references/issues.md` |
| Public API, CLI, UI workflow, schema, type, integration, or cross-module contract | `references/contract-spec.md` |
| Meaningful fork, tradeoff, or decision record | `references/decision-brief.md` |
| Implementation plan before coding | `references/implementation-plan.md` |
| Visual dependency map, timeline, ERD, flow, or issue diagram | `references/diagram-issues.md` |

## Handoffs
- Use `review` for planning artifact review, contract review, and plan review.
- Use `implementation` only after planning gates are approved.
- Escalate to `run-sdlc` when scope, work class, consent gates, or repository boundaries change.

## Required Output
```text
Planning scope:
Work class:
References selected:
Artifacts to read/update:
Decisions needed:
Approval gate:
Next phase:
Stop condition:
```

## Stop Rules
- Stop when product direction, public contract, technical approach, data ownership, AI authority, or MVP scope needs human approval.
- Do not turn unresolved planning questions into implementation assumptions.
