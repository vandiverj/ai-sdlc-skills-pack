# Spec Compliance Review

Use to check whether implementation satisfies the issue, PRD, application model, acceptance criteria, and contract spec when present. Run before deeper code-quality or engineering-principles review.

## Checks
- Implementation satisfies the issue and acceptance criteria.
- Contract spec exists when a public API, CLI, UI workflow, schema, event, integration, or cross-module behavior changed.
- Public behavior matches the reviewed contract.
- Scope did not creep beyond the approved task.
- Application model is preserved or intentionally updated.
- Correct feature context and docs were updated or preserved.
- Tests align with required behavior and contract.
- Actor/job, before/after workflow, changed state/feedback, upstream/downstream/adjacent/recovery paths, and implementation responsibilities agree with the approved experience-impact trace.
- Scenario-specific evidence covers the primary, missing/ambiguous, and failure/recovery or regression paths; generic command success is not treated as proof of every criterion.
- Code, tests, contract, feature context, PRD, and model agree.

## Doc-Sync Behavior
Use context/doc-sync review when code, docs, contracts, or context may disagree. Do not silently update docs to match implementation before classifying whether requirements changed, implementation is wrong, docs are stale, tests are stale/missing, or uncertainty remains.

## Output
- Pass/fail.
- Missing requirements.
- Contract mismatches.
- Doc-sync discrepancies.
- Scope creep.
- Required fixes.
- Experience-impact items that are implemented and verified, verified unaffected, deferred with human acceptance, or blocking.
- Model/PRD/contract/context-state updates needed.
