---
name: review-issue-dependencies
description: 'Verify the issue list is buildable in order.'
user-invocable: true
---

# review-issue-dependencies

## Description
Verify the issue list is buildable in order.

## Checks
- Does each issue map to the PRD?
- Does each issue map to the application model?
- Are dependencies explicit?
- Is each issue independently testable?
- Is the first issue a useful vertical slice?
- Are setup/foundation tasks missing?
- Are any issues too large?
- Are unresolved questions recorded in `context-state.md`?

## Loop behavior
If gaps exist, update issues, PRD, model, or context-state before implementation planning.
