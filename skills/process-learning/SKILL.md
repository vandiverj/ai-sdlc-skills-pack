---
name: process-learning
description: 'Router skill for capturing process events, reviewing repeated workflow signals, and updating reusable process guidance.'
user-invocable: true
---

# process-learning

## Purpose
Turn repeated SDLC friction and useful workflow discoveries into reviewed, portable process improvements.

## Use When
- A real task exposes repeated friction, a near miss, a routing gap, a verification gap, or a reusable process improvement.
- Process events need review or promotion into skills/templates/pattern guidance.

## Reference Selection

| Trigger or surface | Load reference |
| --- | --- |
| Capture one lightweight process-learning event | `references/capture-event.md` |
| Aggregate and review multiple events | `references/review-learning.md` |
| Update implementation patterns from reviewed evidence | `references/update-patterns.md` |
| Process review feedback needs disposition | `references/process-review-feedback.md` |
| Battle Soccer or another fixture should validate router/evidence/agent behavior | `references/pilot-validation.md` |

## Handoffs
- Use `review` for independent critique of process changes.
- Use `agents`, `quality`, `implementation`, or `planning` when the learning changes a router's rules.
- Use `test-skill-behavior` before relying on a meaningful skill change.

## Required Output
```text
Learning task:
Evidence:
Candidate owner:
Recommended change:
Validation needed:
Rollback/deprecation path:
```

## Stop Rules
- Do not update a durable process rule from one weak signal.
- Do not bury a human consent gate inside process automation.
