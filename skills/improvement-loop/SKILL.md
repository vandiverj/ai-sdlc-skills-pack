---
name: improvement-loop
description: 'Run explicitly requested, evidence-based critique and revision cycles on a bounded artifact until a stated stop condition.'
user-invocable: true
---

# improvement-loop

## Purpose

Improve one bounded artifact through repeated, distinct review passes. Use only when the user requests iteration, a fixed run count, measurable comparison, or convergence testing.

Ordinary reviews and SDLC process changes do not need this skill by default.

## Setup

Agree or infer:

```text
Target and objective:
Allowed edit scope:
Stop condition or run budget:
Evidence and validation:
Human approval boundaries:
```

If no stop condition is supplied, use three distinct review viewpoints and stop when no material change survives the final pass.

## Each run

1. Review the current candidate, not only the original.
2. Use a viewpoint meaningfully different from the previous run.
3. Propose only changes that improve purpose, usability, correctness, validation, maintainability, safety, or process weight.
4. Apply, defer, reject, or flag the proposal for human decision.
5. Record the evidence and next viewpoint in one short entry.

Do not make wording changes merely to create activity. A valid no-change run is preferable to churn.

## Measured mode

Use a frozen evaluator only when the user requests scoring or objective comparison, or when repeated changes could game the evaluation. Define hard gates, score dimensions, allowed evidence, and keep threshold before editing. Restart from the baseline if the evaluator changes.

## Convergence

Convergence requires distinct viewpoints and no unresolved material candidate. Any accepted material change resets the no-change count. Missing validation prevents convergence only when it could plausibly change the result.

Useful viewpoints include the end user, maintainer, tiny-task agent, high-risk agent, skeptical reviewer, tool-limited runtime, evidence critic, and process-weight critic.

## Output

```text
Target and runs completed:
Material changes:
Deferred or rejected ideas:
Evidence and validation:
Convergence or stop reason:
Human decision needed:
```

## Stop rules

- Stop when further edits would change purpose, safety, authority, or scope without approval.
- Stop when runs produce wording churn or repeat rejected ideas.
- Do not commit, push, merge, deploy, release, install dependencies, or take destructive action without the required approval.
