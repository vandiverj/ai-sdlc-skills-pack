# choose-implementation-pattern

## Description
Choose the project-specific implementation pattern that should guide a task, such as forms, tables, API handlers, data fetching, errors, tests, page layouts, or feature modules.

## Use when
- Work touches a repeated project-specific structure or UI/backend pattern.
- The project has `docs/patterns/*` guidance that may apply.
- The agent is about to invent a new form, table, modal, API boundary, data-fetching shape, error workflow, test style, or feature organization.
- Review finds inconsistent implementation that deterministic tooling cannot catch.
- Existing examples disagree and the agent needs to know which pattern is current, emerging, deprecated, or superseded.

## Purpose
Help agents code in the product's established style without replacing linters, formatters, typecheckers, tests, design-system enforcement, or accessibility tooling. Patterns are project-local implementation guidance that should be visible in Git, supported by examples, and allowed to evolve as requirements and frameworks change.

## Read first
1. Work classification and selected context packet.
2. Target issue, PRD, contract, application model, and feature context.
3. `docs/patterns/README.md` and only the relevant `docs/patterns/<pattern>.md` files.
4. Existing source examples named by the pattern docs.
5. Approved technical approach, quality automation, agent strategy, and context-state entries that may affect the pattern.

## Required output

```text
Pattern decision needed:
Pattern status: Emerging / Validated / Standard / Deprecated / Superseded / Experimental / Not Found / Not Needed
Pattern docs loaded:
Canonical examples:
Applies because:
Does not apply when:
Required implementation guidance:
Testing expectations:
Accessibility/security/operability expectations:
Exceptions or deviations:
Missing/stale pattern guidance:
Artifacts to update:
Next skill:
```

## Pattern maturity
- `Emerging`: observed in code and promising, but not mandatory.
- `Validated`: used successfully in multiple places and recommended.
- `Standard`: default for new work; deviations require a reason.
- `Deprecated`: still exists; do not copy for new work.
- `Superseded`: replaced by a newer pattern.
- `Experimental`: allowed only in a spike or approved context.

## Selection rules
- Prefer deterministic tooling for syntax, formatting, import order, type safety, schema checks, simple accessibility rules, and generated artifact drift.
- Use implementation patterns for project-specific structure, UX states, component composition, domain conventions, tests, examples, and maintainability expectations.
- Prefer documented Standard or Validated patterns over copying arbitrary existing code.
- If only deprecated examples exist, do not copy them silently; route to `update-implementation-patterns` or record an exception.
- If no pattern exists, inspect examples and propose an Emerging pattern only when repeated evidence or clear design-system/framework constraints support it.
- If the pattern conflicts with requirements, accessibility, security, performance, or framework changes, record the conflict and route to update the pattern instead of forcing it.

## Hard rules
- Do not create pattern guidance from preference alone.
- Do not use pattern docs to duplicate linter, formatter, typechecker, test, or CI rules.
- Do not treat old code as canonical without checking pattern status and examples.
- Do not make a pattern mandatory until it has enough evidence and human review.
- Do not expand the task scope just to standardize unrelated code.

## Next skills
Usually `write-implementation-plan`, `review-implementation-pattern`, `update-implementation-patterns`, `review-code-quality`, `update-context-docs`, or `context-save`.
