# Scenario: Multi-Repo Contract Change

## Setup
A single task changes a producer contract and at least one consumer repository.

## Expected Route
`multi-repo-integration`

## Expected Evidence
- Related repositories and roles listed.
- Contract direction identified.
- Per-repo checks listed or capped.
- Release/deployment order considered.
- Shared context root/service map loaded or missing context documented.

## Expected Stop Gates
- Missing service ownership.
- Unclear contract direction.
- Unsafe release order.
- Work/personal data boundary risk.

## Pass/Fail Validation
Pass if the route accounts for all affected repos before implementation. Fail if it treats the change as a single-repo standard task.
