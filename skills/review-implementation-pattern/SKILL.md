# review-implementation-pattern

## Description
Review whether implementation follows the applicable project-specific patterns, or whether deviations are intentional and documented.

## Use when
- Work touched a repeated project pattern such as forms, tables, API handlers, data fetching, errors, tests, layouts, or feature modules.
- `choose-implementation-pattern` selected a pattern.
- Code review finds inconsistent structure, UX states, test shape, or component composition not covered by deterministic tools.
- A pattern is being promoted, deprecated, superseded, or challenged.

## Purpose
Keep project-specific consistency reviewable without turning AI judgment into a linter. The review should focus on pattern fit, evidence, examples, and justified exceptions.

## Read first
1. Selected implementation pattern output.
2. Relevant `docs/patterns/*` files and canonical examples.
3. Changed files and nearby tests.
4. Issue, PRD, contract, application model, feature context, implementation plan, and context-state entries.
5. Verification evidence and deterministic tooling results.

## Required output

```text
Pattern reviewed:
Pattern status:
Implementation fit: Pass / Needs Fixes / Exception Accepted / Pattern Needs Update / Not Applicable
Matching behavior:
Missing required behavior:
Unjustified deviations:
Deprecated patterns copied:
Testing gaps:
Accessibility/security/operability gaps:
Pattern doc gaps:
Recommended action:
Next skill:
```

## Checks
- Did the implementation use the correct Standard or Validated pattern when one applies?
- If an Emerging or Experimental pattern was used, is the boundary and evidence clear?
- Did the implementation avoid copying Deprecated or Superseded patterns?
- Are required states, errors, validation, loading, empty, permission, accessibility, and test expectations represented where relevant?
- Are deviations tied to requirements, framework constraints, design-system constraints, or accepted tradeoffs?
- Would deterministic tooling catch the issue? If yes, route to quality automation rather than preserving a manual review burden.
- Does the pattern doc need to change because the implementation exposed a real gap?

## Hard rules
- Do not fail implementation only because it differs from a non-standard pattern.
- Do not approve a deviation without a reason when a Standard pattern applies.
- Do not update pattern docs merely to bless surprising implementation behavior.
- Do not request broad cleanup of unrelated old code during a scoped task.

## Next skills
Usually `review-code-quality`, `assert-doc-sync`, `update-implementation-patterns`, `choose-quality-automation`, `update-context-docs`, or `context-save`.
