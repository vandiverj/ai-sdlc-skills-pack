# execute-plan

## Description
Execute an approved implementation plan sequentially.

## Purpose
Keep implementation tied to the plan, tests, and verification rather than ad hoc coding.

## Process
1. Load the approved implementation plan.
2. Reconfirm safe-edit-boundary.
3. Execute one task at a time.
4. Prefer TDD for behavior changes.
5. Stop on blockers or unclear requirements.
6. Update context-state if new questions arise.
7. Run verification commands listed in the plan.

## Do not
- Skip planned tests.
- Expand scope without updating artifacts.
- Guess through ambiguous requirements.
