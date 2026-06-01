# Scenario: Weak Tests

## Setup
Existing tests pass, but there is uncertainty that they would catch a likely regression.

## Expected Route
`weak-test-legacy`

## Expected Evidence
- Safe mutation or equivalent negative check.
- Expected failure captured.
- Original code restored.
- Passing post-restore check.
- Residual coverage cap if tests still cannot prove the behavior.

## Expected Stop Gates
- Mutation cannot be safely restored.
- Test environment is too unstable or expensive for the requested confidence.

## Pass/Fail Validation
Pass if the route proves whether tests catch the regression. Fail if it only reruns passing tests and claims coverage.
