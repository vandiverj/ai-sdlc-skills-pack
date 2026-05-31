---
name: review-agent-work
description: 'Review completed or in-progress AI agent work for workflow adherence, artifact alignment, verification evidence, Git reviewability, and unsafe silent changes.'
user-invocable: true
---

# review-agent-work

## Description
Review completed or in-progress AI agent work for workflow adherence, artifact alignment, verification evidence, Git reviewability, and unsafe silent changes.

## Use when
- A human wants to review what an AI agent did.
- A session or branch may have updated code, docs, contracts, Memory Bank files, or context-state incorrectly.
- There is concern that docs were changed to match wrong code.
- Work needs an independent review before merge, continuation, or handoff.

## Purpose
Provide a human-facing review path that checks whether the SDLC process was followed enough for the work class and dirty surfaces, using the Git diff and recent commits as the main review surface.

## Read first
1. User request, issue, PRD, contract, or implementation plan that initiated the work.
2. Git diff, changed files, and recent commits if available.
3. Verification evidence from the current or reviewed session.
4. Threat-model and production-readiness evidence when risk or release surfaces are present.
5. Implementation pattern guidance and review evidence when repeated project-specific surfaces are present.
6. Related code-local docs, feature context, application model, PRD, contract, ADRs, Memory Bank routing files, and `docs/context-state.md`.
7. Classification output if available.

## Required output

```text
Reviewed scope:
Inferred work class:
Expected gates:
Observed gates/evidence:
Missing evidence:
Contextual caps:
Git reviewability findings:
Artifact sync findings:
Test/evidence integrity findings:
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
- For Git-tracked code/text edits, was diff hygiene checked with `git diff --check` for uncommitted work, or `git show --check HEAD` / `git diff --check <base>..HEAD` for already-committed work?
- Do applicable contextual caps appear: missing context, missing validation, weak validation, hidden blast radius, rendered experience unverified, security/data uncertainty, review conflict, environment mismatch, or test/evidence tampering risk?
- Are the Git diff and recent commits reviewable, scoped to the task, and described by intentional commit messages?
- Are author and committer identity appropriate for the repository privacy/publication boundary before push or PR?
- Does any commit span unrelated tasks that should be split before merge?
- Did code, tests, contracts, docs, Memory Bank routing, and context-state stay aligned?
- Were docs updated only after confirming implementation correctness?
- Were unresolved questions recorded in `docs/context-state.md` instead of conversation history?
- Did high-risk work include `threat-model` coverage and security/privacy/dependency/license/migration/rollback/performance/accessibility/observability/rollout review as applicable?
- Did tests, snapshots, validation scripts, thresholds, generated baselines, or CI change? If yes, was that part of the approved task and does the new evidence surface still protect behavior?
- For UI/user-facing workflow changes, was the rendered browser/app/device experience inspected when tooling or a runnable surface was available?
- Did production-intended Standard or High-risk work include `production-readiness-review` coverage or equivalent evidence?
- Did work that touched repeated project-specific surfaces include `choose-implementation-pattern` or `review-implementation-pattern` coverage when applicable?
- Did tool/MCP output affect decisions, and was it verified against project artifacts?

## Hard rules
- Lead with risks, missing evidence, Git reviewability problems, and artifact drift.
- Do not infer that work is safe because the final message sounded confident.
- Do not treat the implementer's confidence as review evidence. Inspect the diff, artifacts, and verification record first.
- Do not rewrite artifacts during the review unless the user asks for fixes.
- If the review finds route mismatch, recommend `classify-work` before further implementation.

## Independent reviewer mode
When used as an independent reviewer, operate read-only by default.

Focus on:

- blocking vs non-blocking findings,
- evidence sufficiency,
- route/classification mismatch,
- contextual caps,
- test/evidence integrity,
- rendered-review gaps,
- hidden blast radius,
- human approval or waiver needs.

Do not implement fixes unless the user explicitly starts a separate fix route.

## Next skills
Usually `classify-work`, `review-agent-strategy`, `choose-implementation-pattern`, `review-implementation-pattern`, `threat-model`, `production-readiness-review`, `assert-doc-sync`, `verification-before-completion`, `review-spec-compliance`, `review-code-quality`, `manage-context-state`, or `update-context-docs`.
