# review-agent-work

## Description
Audit completed or in-progress AI agent work for workflow adherence, artifact alignment, verification evidence, and unsafe silent changes.

## Use when
- A human wants to review what an AI agent did.
- A session or branch may have updated code, docs, contracts, Memory Bank files, or context-state incorrectly.
- There is concern that docs were changed to match wrong code.
- Work needs an independent audit before merge, continuation, or handoff.

## Purpose
Provide a human-facing audit path that checks whether the SDLC process was followed enough for the work class and dirty surfaces.

## Read first
1. User request, issue, PRD, contract, or implementation plan that initiated the work.
2. Git diff, changed files, and recent commits if available.
3. Verification evidence from the current or audited session.
4. Related code-local docs, feature context, application model, PRD, contract, ADRs, Memory Bank routing files, and `docs/context-state.md`.
5. Classification output if available.

## Required output

```text
Audited scope:
Inferred work class:
Expected gates:
Observed gates/evidence:
Missing evidence:
Artifact sync findings:
Possible silent doc/code drift:
Risk findings:
Recommended action:
Next skill:
```

## Checks
- Was the work class appropriate, or should it have escalated?
- Were required gates run for that work class and dirty surfaces?
- Were skipped gates justified?
- Does fresh verification evidence exist and match the completion claim?
- Did code, tests, contracts, docs, Memory Bank routing, and context-state stay aligned?
- Were docs updated only after confirming implementation correctness?
- Were unresolved questions recorded in `docs/context-state.md` instead of conversation history?
- Did high-risk work include security/privacy/dependency/license/migration/rollback/performance/accessibility/observability/rollout review as applicable?
- Did tool/MCP output affect decisions, and was it verified against project artifacts?

## Hard rules
- Lead with risks, missing evidence, and artifact drift.
- Do not infer that work is safe because the final message sounded confident.
- Do not rewrite artifacts during the audit unless the user asks for fixes.
- If the audit finds route mismatch, recommend `classify-work` before further implementation.

## Next skills
Usually `classify-work`, `assert-doc-sync`, `verification-before-completion`, `review-spec-compliance`, `review-code-quality`, `manage-context-state`, or `update-context-docs`.