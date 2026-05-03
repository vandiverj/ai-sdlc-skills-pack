# Implementation Patterns

## Purpose
Project-specific implementation patterns describe how this application usually builds repeated surfaces such as forms, tables, page layouts, modals, API handlers, data fetching, errors, tests, and feature modules.

Patterns guide AI and human contributors where deterministic tools cannot express project-specific product and code conventions. They do not replace linters, formatters, typecheckers, tests, accessibility tooling, design-system enforcement, or CI.

## Pattern maturity
- `Emerging`: observed in code and promising, but not mandatory.
- `Validated`: used successfully in multiple places and recommended.
- `Standard`: default for new work; deviations require a reason.
- `Deprecated`: still exists; do not copy for new work.
- `Superseded`: replaced by a newer pattern.
- `Experimental`: allowed only in a spike or approved context.

## Pattern lifecycle
```text
Discover
-> document as Emerging
-> use in more work
-> review results
-> promote to Validated
-> promote to Standard when stable
-> revisit on requirement, framework, design-system, accessibility, security, or performance changes
-> deprecate or supersede when needed
```

## Pattern files
| Pattern | Status | Load when |
| --- | --- | --- |
| `<pattern>.md` | Emerging / Validated / Standard / Deprecated / Superseded / Experimental | Work touches this repeated implementation surface. |

## Rules
- Prefer documented Standard or Validated patterns over arbitrary old code.
- Do not copy Deprecated or Superseded patterns into new work.
- Record exceptions when a Standard pattern does not fit.
- Add or promote patterns only from reviewed evidence.
- Route missing, stale, or disputed guidance through `update-implementation-patterns`.

## Last updated
- Date:
- Updated because:
- Confidence:
