# Fixture Validation

Use this reference only when an SDLC process change affects routing, helper CLI behavior, fixture validation, QA, implementation planning, review, or release handoff.

Do not hardcode a personal/local project as the reusable SDLC fixture. Use an approved disposable fixture, a configured downstream pilot repository, or a repo-local dry run selected for the current validation task.

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

- Confirm the fixture or dry-run target is available and appropriate for the changed SDLC behavior.
- Run the smallest command or scenario that exercises the changed behavior.
- Capture pass/fail evidence and any gaps.
- If no fixture can run, record why and use a dry-run packet instead of claiming full validation.
