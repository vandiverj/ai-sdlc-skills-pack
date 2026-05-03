---
name: grill-me
description: 'Develop the conversation context that will later be synthesized by `to-prd`.'
user-invocable: true
---

# grill-me

## Description
Develop the conversation context that will later be synthesized by `to-prd`.

## Purpose
Interrogate assumptions, scope, edge cases, and tradeoffs before producing durable requirements.

## Use after
- `product-reframe`
- `define-application`

## Use before
- `model-application`
- `to-prd`

## Behavior
Ask targeted questions one at a time when possible. Prefer clarifying decisions over producing a premature spec.

## Output
- Clarified assumptions
- Decisions made
- Tradeoffs
- Edge cases
- Scope boundaries
- Remaining unknowns
- Questions that should be added to `docs/context-state.md`
