# Verification Before Completion

Use before saying work is complete, fixed, safe, ready, or handed off.

## Checks
- Run the narrowest targeted check that proves the changed behavior.
- Run broader checks proportional to the blast radius.
- Use documented project commands first.
- Record command, timestamp, exit code, stdout/stderr summary, and skipped checks.
- Mark overall verdict as `partial` when important checks cannot run.
- For observable behavior, verify the primary result and the most relevant recovery or regression path. Add scenarios when risk or uncertainty warrants them.
- Follow connected impacts that evidence identifies; do not require unrelated impact categories to be filled.

## Hard Rule
Fresh, claim-specific evidence is required before completion claims. Confidence, packet presence, generic build/test output, or prior runs are not enough.
