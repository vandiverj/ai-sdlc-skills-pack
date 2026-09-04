# Verification Before Completion

Use before saying work is complete, fixed, safe, ready, or handed off.

## Checks
- Run the narrowest targeted check that proves the changed behavior.
- Run broader checks proportional to the blast radius.
- Use documented project commands first.
- Record command, timestamp, exit code, stdout/stderr summary, and skipped checks.
- Mark overall verdict as `partial` when important checks cannot run.
- For observable behavior, verify the primary before/after journey plus missing/ambiguous input and failure/recovery or regression scenarios. Map each result to the acceptance criterion and experience-impact item it supports.
- Confirm every mapped upstream, downstream, adjacent, and recovery impact is implemented and verified, verified unaffected, explicitly deferred with rationale and human acceptance, or blocking.

## Hard Rule
Fresh, claim-specific evidence is required before completion claims. Confidence, packet presence, generic build/test output, or prior runs are not enough.
