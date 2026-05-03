# review-spec-compliance

## Description
Review whether the implementation satisfies the issue, PRD, application model, and contract spec when present.

## Run before
`engineering-principles-review` and `review-code-quality`

## Checks
- Did the implementation satisfy the issue?
- Did it satisfy acceptance criteria?
- Did it satisfy the contract spec, if one exists?
- Did public API, CLI, UI, schema, event, or integration behavior match the reviewed contract?
- Did it stay within scope?
- Did it preserve the application model?
- Did it update or preserve the correct feature context.md?
- Did it avoid hidden scope creep?
- Are tests aligned with the required behavior and contract?
- Do code, tests, contract, feature context, PRD, and model agree?

## Doc-sync behavior
Use `assert-doc-sync` when code/docs/contracts/context may disagree or when documentation was updated after implementation.

If disagreement exists, pause and classify:
- requirements changed
- implementation is wrong
- docs are stale
- tests are stale/missing
- uncertainty remains

Do not silently update docs to match implementation before this classification.

## Output
- Pass/fail.
- Missing requirements.
- Contract mismatches.
- Doc-sync discrepancies.
- Scope creep.
- Required fixes.
- Any model/PRD/contract/context-state updates needed.