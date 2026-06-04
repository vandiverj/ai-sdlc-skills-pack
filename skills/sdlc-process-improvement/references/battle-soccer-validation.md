# Battle Soccer Validation

Use this reference only when the SDLC process change affects routing, helper CLI behavior, fixture validation, QA, implementation planning, review, or release handoff.

## Validation Packet

```text
Fixture target:
Changed SDLC behavior:
Scenario exercised:
Commands run:
Expected evidence:
Actual evidence:
Regression concerns:
Follow-up changes:
```

## Minimum Checks
- Confirm the fixture repository/app is available.
- Run the smallest command or scenario that exercises the changed SDLC behavior.
- Capture pass/fail evidence and any gaps.
- If the fixture cannot run, record why and use a dry-run packet instead of claiming full validation.
