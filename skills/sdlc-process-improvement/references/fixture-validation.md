# Fixture Validation

Use this reference only when an SDLC process change affects routing, helper CLI behavior, fixture validation, QA, implementation planning, review, or release handoff.

Do not hardcode a personal/local project as the reusable SDLC fixture. Validation must be selected for the current task and repository.

Resolve validation targets in this order:
1. Current repository deterministic checks and dry-run packets.
2. Repo-local configured validation target in `.ai-local/sdlc-profile.md`, `.ai-local/sdlc-profile.json`, or another approved local profile.
3. Developer-provided disposable fixture or workspace repository approved for the current validation task.
4. No runnable fixture: record the evidence gap and do not claim fixture validation.

Initial SDLC setup may offer a local validation-target field, but external fixture repositories stay optional. Shared SDLC guidance must not assume one developer's machine, paths, projects, or preferred fixture app.

## Validation Packet

```text
Validation target:
Changed SDLC behavior:
Scenario exercised:
Commands run:
Expected evidence:
Actual evidence:
Regression concerns:
Follow-up changes:
```

## Minimum Checks

- Confirm the selected target follows the validation-target order and is appropriate for the changed SDLC behavior.
- Run the smallest command or scenario that exercises the changed behavior.
- Capture pass/fail evidence and any gaps.
- If no fixture can run, record why and use current-repo deterministic checks or a dry-run packet instead of claiming full validation.
