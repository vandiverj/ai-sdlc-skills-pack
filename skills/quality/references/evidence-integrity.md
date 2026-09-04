# Evidence Integrity

Use when test output, generated baselines, snapshots, thresholds, CI config, or completion evidence may be stale, incomplete, weakened, or hard to reproduce.

## Checks
- Evidence is from the current task/session or clearly labeled as historical.
- Commands and outputs are reproducible.
- Tests, snapshots, thresholds, generated baselines, and CI checks were not weakened without approval.
- Missing checks are listed as evidence gaps.
- Tool failures, environment mismatches, and skipped checks are not hidden.
- Evidence identifies the acceptance criterion and, for behavior work, the experience scenario or impact item it proves.
- A generic build, test, smoke, or manual note is not reused as proof for unrelated criteria merely because its label sounds like verification.

## Output
- Evidence reviewed.
- Integrity verdict.
- Stale or missing evidence.
- Possible weakened checks.
- Reproduction commands.
- Required follow-up.
