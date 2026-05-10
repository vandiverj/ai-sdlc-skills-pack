---
name: execute-plan
description: 'Execute an approved implementation plan sequentially while preserving the selected work route, safe-edit boundary, and evidence requirements.'
user-invocable: true
---

# execute-plan

## Description
Execute an approved implementation plan sequentially while preserving the selected work route, safe-edit boundary, and evidence requirements.

## Purpose
Keep implementation tied to the plan, tests, and verification rather than ad hoc coding. Detect when the original classification is no longer true.

## Process
1. Load the approved implementation plan and classification execution contract.
2. Check the plan's chat handoff and human attention items.
3. Reconfirm `safe-edit-boundary`.
4. Execute one task at a time.
5. Prefer TDD for behavior changes.
6. Stop on blockers, unclear requirements, or artifact disagreement.
7. Update `docs/context-state.md` if new questions arise.
8. Run verification commands listed in the plan.

## Chat attention preflight
Before editing files, confirm there are no unresolved `Needs decision before work` items from the contract, product-fit pass, implementation plan, or review.

If questions or meaningful assumptions remain, present them in chat with recommendations:

```text
Question:
Recommendation:
Why this fits current evidence:
Tradeoff or risk:
Default action if approved or not corrected:
```

Proceed only when blockers are resolved, explicitly accepted, or reclassified as safe defaults. For 70%+ assumptions that are safe but meaningful, present the recommended default and continue unless the human redirects. For obvious Tiny/Micro work, keep the preflight to one sentence unless risk appears.

## Mid-stream reclassification
Pause and return to `classify-work` when implementation reveals:

- more files/modules or broader scope than expected
- public contract, schema, API, CLI, integration, UI workflow, or compatibility changes
- data, auth, security, privacy, dependency, license, migration, infrastructure, concurrency, or architecture implications
- requirements that contradict the PRD, issue, model, contract, or plan
- tests or runtime behavior that disprove the plan
- tool/MCP information that conflicts with local artifacts
- verification evidence that cannot satisfy the current route

When reclassifying, explain what changed and whether the route escalates, narrows, or needs a different first gate.

## Do not
- Skip planned tests.
- Expand scope without updating classification, plan, and affected artifacts.
- Guess through ambiguous requirements.
- Ask naked questions without recommendations.
- Start implementation while unresolved `Needs decision before work` items remain.
- Continue on a Micro/Tiny route after behavior or public/shared surface changes appear.
- Update docs to match surprising implementation behavior before `assert-doc-sync`.
