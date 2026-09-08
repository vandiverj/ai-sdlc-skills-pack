# Agent Work Review

Use when reviewing completed or in-progress AI agent work for workflow adherence, artifact alignment, verification evidence, Git reviewability, unsafe silent changes, or handoff quality.

## Read First
- User request, issue, PRD, contract, or implementation plan.
- Git diff, changed files, and recent commits if available.
- Verification evidence from the reviewed session.
- Threat-model and production-readiness evidence when risk or release surfaces are present.
- Related docs, feature context, application model, PRD, contract, ADRs, context-state, and classification output.

## Checks
- Work class and gates matched the actual risk and dirty surfaces.
- Fresh verification exists and supports the completion claim.
- Diff hygiene and commit boundaries are reviewable.
- The agent stayed within safe edit, tool, and read/write boundaries.
- Docs, contracts, code, tests, and context artifacts stayed aligned.
- Required rendered, security, release, pattern, or doc-sync reviews were not skipped silently.
- Tests, snapshots, generated baselines, thresholds, or CI changes were part of the approved task.
- Tool/MCP output that affected decisions was verified against project artifacts.
- Observable behavior retained its intended outcome, material connected impacts, and claim-specific proof through implementation.
- No mapped impact disappeared at a handoff; each is implemented and verified, verified unaffected, explicitly deferred with rationale and human acceptance, or blocking.

## Hard Rules
- Lead with risks, missing evidence, Git reviewability problems, and artifact drift.
- Do not infer safety from the implementer's confidence.
- Do not rewrite artifacts during review unless the user asks for fixes.
- If the work route was wrong, recommend `classify-work` before further implementation.

## Output
```text
Reviewed scope:
Inferred work class:
Expected gates:
Observed gates/evidence:
Missing evidence:
Contextual caps:
Git reviewability findings:
Artifact sync findings:
Experience-impact trace and closure findings:
Test/evidence integrity findings:
Possible silent doc/code drift:
Risk findings:
Recommended action:
Next skill:
```
