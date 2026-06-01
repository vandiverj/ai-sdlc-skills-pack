# Verification Before Completion

Use before saying work is complete, fixed, safe, ready, or handed off.

## Checks
- Run the narrowest targeted check that proves the changed behavior.
- Run broader checks proportional to the blast radius.
- Use documented project commands first.
- Record command, timestamp, exit code, stdout/stderr summary, and skipped checks.
- Mark overall verdict as `partial` when important checks cannot run.

## Hard Rule
Fresh evidence is required before completion claims. Confidence, code inspection, or prior runs are not enough.
