# Implementation Pattern Review

Use when work touched a repeated project pattern such as forms, tables, API handlers, data fetching, errors, tests, layouts, or feature modules; when implementation pattern guidance selected a pattern; or when code review finds inconsistent structure not covered by deterministic tools.

## Read First
- Selected implementation pattern output.
- Relevant `docs/patterns/*` files and canonical examples.
- Changed files and nearby tests.
- Issue, PRD, contract, model, feature context, implementation plan, and context-state entries.
- Verification evidence and deterministic tooling results.

## Checks
- Correct Standard or Validated pattern was used when one applies.
- Emerging or Experimental patterns have a clear boundary and evidence.
- Deprecated or Superseded patterns were not copied into new work.
- Required states, errors, validation, loading, empty, permission, accessibility, and test expectations are represented.
- Deviations are tied to requirements, framework constraints, design-system constraints, or accepted tradeoffs.
- Issues that deterministic tooling can catch are routed to quality automation rather than preserved as manual review burden.
- Pattern docs need updates only when the implementation exposes a real reusable gap.

## Output
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
