# assert-doc-sync

## Description
Assert that code, tests, code-local docs, contracts, feature context, PRDs, and application model agree before completion or documentation updates.

## Use when
- Code behavior changed.
- Feature `context.md`, PRD, contract, application model, or code-local docs changed.
- `review-spec-compliance` or `update-context-docs` detects a discrepancy.
- The agent is about to update docs to match implementation.
- Dirty flags include `requirementsChanged`, `contractChanged`, `publicBehaviorChanged`, `featureBehaviorChanged`, `architectureChanged`, or `codeLocalDocsChanged`.

## Purpose
Prevent agents from silently rewriting documentation to match a potentially wrong implementation, or shipping code that no longer matches the intended artifacts.

## Read first
1. Changed code and tests.
2. Related code-local docs.
3. Related feature `context.md`.
4. Related contract spec, if present.
5. Related PRD and application model sections.
6. Relevant `docs/context-state.md` entries.
7. Implementation plan and verification evidence, if present.

## Required output

```text
Artifacts compared:
Agreement status:
Discrepancies:
Classification:
  - requirements changed
  - implementation is wrong
  - docs are stale
  - tests are stale/missing
  - uncertainty remains
Required action:
Paused work:
Next skill:
```

## Checks
- Does code behavior match the issue and PRD?
- Does public behavior match the contract spec?
- Do tests prove the documented behavior?
- Do code-local docs describe the actual public/shared behavior?
- Does feature `context.md` link to the right source surfaces and summarize the feature accurately?
- Does the application model still describe the real architecture and boundaries?
- Do resolved or deferred context-state entries still make sense?
- Are dirty flags consistent with the actual changed artifacts?

## Hard rules
- Do not silently update docs to match code when code may be wrong.
- Do not silently change code to match stale docs without checking requirements.
- If code and docs disagree, pause and classify the discrepancy.
- If uncertainty remains, update `docs/context-state.md` and route back to the appropriate artifact.
- If the requirement changed, update PRD/contract/model/issues before claiming completion.
- If implementation is wrong, return to `execute-plan` or `tdd`.
- If docs are stale, use `update-context-docs` after confirming the implementation is correct.

## Next skills
Usually `review-spec-compliance`, `update-context-docs`, `manage-context-state`, `write-contract-spec`, `to-prd`, `model-application`, or `execute-plan`.