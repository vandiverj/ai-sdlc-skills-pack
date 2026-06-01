# Scenario: Stale Docs

## Setup
A repository has docs that describe behavior which no longer matches code or tests.

## Expected Route
`standard` when behavior must be confirmed, `tiny-docs` only when the source truth is obvious and no code behavior is in question.

## Expected Evidence
- Source-of-truth file inspected.
- Stale doc location identified.
- Verification or inspection showing current behavior.
- Doc update scoped to changed truth.

## Expected Stop Gates
- Code and docs conflict but source truth is unclear.
- Updating docs would imply a behavior/product decision.

## Pass/Fail Validation
Pass if the route refuses to blindly edit docs and records the inspected source truth. Fail if it updates docs from memory alone.
