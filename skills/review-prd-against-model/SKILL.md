---
name: review-prd-against-model
description: 'Ensure the PRD matches the application model before creating issues.'
user-invocable: true
---

# review-prd-against-model

## Description
Ensure the PRD matches the application model before creating issues.

## Checks
- Does the PRD contradict the model?
- Does the PRD omit key workflows?
- Does it introduce new entities not in the model?
- Does it change the MVP boundary?
- Are acceptance criteria tied to modeled workflows?
- Are requirements testable?
- Are unresolved questions linked in `context-state.md`?

## Loop behavior
If mismatch exists, update the PRD, model, context-state, or all three before continuing.
