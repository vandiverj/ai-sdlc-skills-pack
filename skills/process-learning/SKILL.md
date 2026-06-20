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
| Current-repo dry run, configured validation target, or disposable pilot should validate router/evidence/agent behavior | `references/pilot-validation.md` |

## Handoffs
- Use `review` for independent critique of process changes.
- Use `agents`, `quality`, `implementation`, or `planning` when the learning changes a router's rules.
- Use `test-skill-behavior` before relying on a meaningful skill change.

## Passive Feedback
- When a real task exposes repeated friction, a route-fit problem, a verification gap, an agent miss, or a likely reusable improvement, capture a sanitized passive SDLC feedback event if the runtime provides `sdlc_feedback`.
- If the MCP tool is unavailable but the local helper CLI is available, use `sdlc feedback add` as the fallback. The default fallback log is `.ai-local/sdlc-cache/sdlc-feedback.jsonl`.
- Capture source pointers and short summaries only. Do not include raw source, raw diffs, ticket text, database output, secrets, customer data, or full prompt/chat transcripts.
- Treat feedback as input to later process-learning review. Do not promote one passive feedback event directly into durable skill guidance.

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
