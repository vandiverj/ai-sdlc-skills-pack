# Diagnose

Use before changing code when behavior is broken, root cause is unknown, or tests/logs conflict.

## Steps
- Reproduce or characterize the failure.
- Identify expected behavior from issue, tests, docs, contracts, or user report.
- Inspect the smallest relevant code path.
- Form competing hypotheses and test them with deterministic evidence.
- Separate root cause from symptoms and incidental cleanup.

## Output
- Reproduction status.
- Expected versus observed behavior.
- Likely root cause.
- Evidence.
- Proposed fix boundary.
- Tests or checks that should fail before the fix and pass after.
