# Slice Product Fit

Use when a proposed slice may solve the wrong user problem, cross a product boundary, depend on predecessor work, or affect connected workflows. Standard work does not need a separate product-fit artifact when the outcome and boundaries are already clear in the issue or plan.

## Questions

1. Who or what uses the result, and what job are they trying to complete?
2. What observable product outcome should improve?
3. What input, state, output, or authority changes?
4. Which connected workflow or consumer is most likely to regress?
5. What failure or recovery behavior matters?
6. Does another slice, contract, vocabulary, or foundation need to exist first?

Expand the actor map, input/output contract, automation authority, upstream/downstream dependencies, and scenario inventory only when uncertainty or risk makes those details decision-bearing.

## Decision

Return one of:

- `Proceed`: the slice is coherent and ready for planning or implementation.
- `Revise`: the outcome or boundary should change.
- `Split`: independent outcomes should be delivered separately.
- `Add predecessor`: required foundation comes first.
- `Defer`: evidence or product value is insufficient.

## Output

```text
Decision and reason:
Actor/job and outcome:
Changed state or contract:
Material connected impact:
Recovery behavior:
Proof needed:
Human decision, if any:
```

Ask the human only when a choice materially affects product direction, public behavior, data ownership, automation authority, safety, or sequencing. Include a recommendation.

## Stop rules

- Do not create an artifact that merely repeats clear issue or product context.
- Do not treat the named file or happy path as the complete slice when evidence shows a connected impact.
- Do not require every impact category or a fixed number of scenarios when they are not relevant.
- Do not proceed when the correct next step is a predecessor or product decision.
