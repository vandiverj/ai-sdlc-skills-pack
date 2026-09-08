# Implementation Plan

Use when execution would otherwise require meaningful guessing, coordination, sequencing, rollback, or cross-file responsibility decisions. Tiny work with a clear outcome, edit boundary, and proof may proceed without a separate plan artifact.

## Read first

- the user request and repository instructions,
- the smallest relevant product/contract context,
- affected source and tests needed to identify responsibilities,
- existing repository commands and dirty worktree state.

Read deeper models, decisions, threat reviews, patterns, or release material only when the task actually touches them.

## Plan content

```text
Status and scope:
Intended outcome:
Assumptions or decisions:
Files/responsibilities:
Ordered implementation steps:
Material connected impacts:
Verification:
Documentation changes, if durable truth changes:
Safe edit and rollback boundary:
```

Add contract, data, security/privacy, dependency, migration, deployment, accessibility, performance, observability, or agent-strategy sections only when those surfaces are present.

For observable behavior, include the affected actor/outcome, the connected path most likely to regress, and evidence for the result and recovery behavior. Use expanded upstream/downstream/adjacent and scenario mapping for unclear blast radius, High-risk, cross-boundary, or multi-repository work.

## Ready when

- the intended outcome is testable,
- file responsibilities and sequence are clear enough to execute,
- the verification matches the changed surface,
- decision-bearing uncertainty is resolved or explicitly blocking,
- the plan does not introduce an unapproved dependency, contract, data, security, migration, or release decision,
- the change remains small enough to review and reverse proportionally.

Ask a human question only when its answer changes the implementation or requires additional authority. Include a recommendation and tradeoff.

## Stop rules

- Do not plan beyond the approved task.
- Do not manufacture `not applicable` sections or artifacts.
- Do not substitute a detailed plan for missing product intent.
- Do not implement while the plan still contains a blocking decision.
