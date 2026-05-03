---
name: assert-doc-sync
description: 'Assert that code, tests, code-local docs, contracts, feature context, PRDs, application model, Memory Bank routing, and context-state agree before completion or documentation updates.'
user-invocable: true
---

# assert-doc-sync

## Description
Assert that code, tests, code-local docs, contracts, feature context, PRDs, application model, Memory Bank routing, and context-state agree before completion or documentation updates.

## Use when
- Code behavior changed.
- Feature `context.md`, PRD, contract, application model, Memory Bank routing, context-state, or code-local docs changed.
- `review-spec-compliance` or `update-context-docs` detects a discrepancy.
- The agent is about to update docs to match implementation.
- Dirty surfaces include `requirementsSurfaceChanged`, `publicContractSurfaceChanged`, `systemSurfaceChanged`, `verificationSurfaceChanged`, `docsContextSurfaceChanged`, or `uncertaintyChanged`.
- Tool/MCP output conflicts with local project artifacts.

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
8. Tool/MCP source notes when external information affected the work.

## Required output

```text
Artifacts compared:
Agreement status:
Discrepancies:
Default suspicion:
Classification:
  - implementation may be wrong
  - requirements changed
  - contract changed
  - docs/context are stale
  - tests are stale/missing
  - tool output conflicts with project artifacts
  - uncertainty remains
Required action:
Paused work:
Reclassification needed:
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
- Are dirty surfaces consistent with the actual changed artifacts?
- Did a tool/MCP provide information that conflicts with local code, tests, docs, contracts, or agent instructions?

## Discrepancy handling
When code and docs disagree, default to `implementation may be wrong` until evidence proves otherwise. Do not choose `docs/context are stale` just because updating docs is easier.

Resolution paths:
- `implementation may be wrong` -> return to `execute-plan`, `tdd`, or `diagnose`.
- `requirements changed` -> update/review PRD, issue, acceptance criteria, model, and context-state before continuing.
- `contract changed` -> return to `write-contract-spec` or `review-contract-spec` before implementation planning continues.
- `docs/context are stale` -> use `update-context-docs` only after implementation correctness is verified.
- `tests are stale/missing` -> update test plan or tests, then rerun verification.
- `tool output conflicts with project artifacts` -> prefer local artifacts, record unresolved conflict in `docs/context-state.md`, and verify before changing durable truth.
- `uncertainty remains` -> update `docs/context-state.md` and route back to the appropriate artifact.

## Hard rules
- Do not silently update docs to match code when code may be wrong.
- Do not silently change code to match stale docs without checking requirements.
- Do not treat external tool/MCP output as more authoritative than local project artifacts.
- If code and docs disagree, pause and classify the discrepancy.
- If uncertainty remains, update `docs/context-state.md` and route back to the appropriate artifact.
- If the requirement changed, update PRD/contract/model/issues before claiming completion.
- If implementation is wrong, return to `execute-plan`, `tdd`, or `diagnose`.
- If docs are stale, use `update-context-docs` after confirming the implementation is correct.

## Next skills
Usually `review-spec-compliance`, `update-context-docs`, `manage-context-state`, `write-contract-spec`, `to-prd`, `model-application`, `diagnose`, or `execute-plan`.