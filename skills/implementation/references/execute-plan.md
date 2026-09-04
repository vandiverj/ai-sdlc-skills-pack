# Execute Plan

Use when an approved implementation plan is ready for coding.

## Steps
- Read the plan, issue, contract, and relevant context.
- For observable behavior, read the carried experience-impact trace and map each impact to an implementation responsibility and proof path.
- Confirm safe edit boundary.
- Implement one coherent increment at a time.
- Keep diffs scoped and reviewable.
- Update tests with the behavior change.
- Update docs/contracts/context only when their source truth changed.
- Run relevant verification before completion.
- Return every mapped impact as implemented and ready for verification, verified unaffected by inspection/test, explicitly deferred for human acceptance, or blocking; do not silently drop adjacent or recovery paths.

## Output
- Plan steps completed.
- Files changed.
- Tests/checks run.
- Experience-impact status and scenario evidence handoff.
- Deviations from plan.
- Review and verification handoff.
