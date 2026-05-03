# execute-plan

## Description
Execute an approved implementation plan sequentially while preserving the selected work route, safe-edit boundary, and evidence requirements.

## Purpose
Keep implementation tied to the plan, tests, and verification rather than ad hoc coding. Detect when the original classification is no longer true.

## Process
1. Load the approved implementation plan and classification execution contract.
2. Reconfirm `safe-edit-boundary`.
3. Execute one task at a time.
4. Prefer TDD for behavior changes.
5. Stop on blockers, unclear requirements, or artifact disagreement.
6. Update `docs/context-state.md` if new questions arise.
7. Run verification commands listed in the plan.

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
- Continue on a Micro/Tiny route after behavior or public/shared surface changes appear.
- Update docs to match surprising implementation behavior before `assert-doc-sync`.