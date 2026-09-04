# Implementation Plan Review

Use before coding when an implementation plan is non-trivial, Standard/High-risk, touches public contracts, modifies architecture/dependencies/data, or contains unresolved product-fit questions.

## Checks
- Plan maps to approved issue, PRD, contract, model, and slice product-fit evidence.
- Scope is small enough to implement and review.
- Steps are ordered, testable, and reversible enough for the work class.
- Safe edit boundary, files, commands, and dirty surfaces are explicit.
- Required verification commands, rendered review, security review, doc-sync, and release checks are named.
- Dependencies, migrations, data handling, external services, and rollout/rollback are addressed when relevant.
- The plan uses project implementation patterns or explains deviations.
- The plan does not convert unresolved questions into hidden implementation assumptions.
- For observable behavior, the plan carries actor/job, before/after workflow, changed state/feedback, upstream/downstream/adjacent/recovery paths, implementation responsibilities, and scenario-specific evidence into an explicit closure model.

## Product-Fit Gate
- Do not approve a Standard implementation plan without slice-product-fit evidence or an explicit route downgrade to Tiny/Micro.
- Any decision-bearing question must be chat-ready:

```text
Question:
Recommendation:
Why this fits current evidence:
Tradeoff or risk:
Default action if approved or not corrected:
```

## Output
- Plan verdict: approve / revise / blocked.
- Required changes.
- Optional improvements.
- Missing evidence.
- Human decisions needed.
- Next step.
