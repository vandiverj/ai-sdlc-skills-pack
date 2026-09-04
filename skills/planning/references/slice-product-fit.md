
# slice-product-fit

## Description
Challenge a planned implementation slice before coding so the work fits the actual product, the actual actor, and the surrounding system instead of only satisfying a task title.

## Use when
- Any `Standard`, `High-risk`, or `Exploratory` work is being planned.
- A slice receives input from a human, software client, AI/model, external service, or persisted data source.
- A slice changes user experience, data ownership, validation, permissions, public contracts, AI behavior, shared libraries, or cross-feature behavior.
- Micro/Tiny work reveals actor confusion, product-fit uncertainty, or cross-slice impact.

## Purpose
Use AI planning to widen perspective before implementation. The point is not to produce another document; it is to catch missing actors, bad assumptions, unclear authority, confusing inputs, brittle concepts, and predecessor work before code makes those choices expensive.

## Inputs
- User request or issue.
- Current application model, PRD, contract, implementation plan, or feature context when present.
- Existing UI/API/data patterns related to the slice.
- Known constraints, open questions, and acceptance criteria.

## Workflow
1. Identify the slice actor map.
   - Primary actor: the person, system, model, service, or job that directly uses or triggers this slice.
   - Secondary actors: people or systems affected by the outcome.
   - Operator/admin actors: people who configure, audit, recover, or support it.
   - Data subjects/owners: people or systems whose data, permissions, or safety are affected.
2. State the actor's job-to-be-done and the product outcome in plain language.
3. Check whole-product fit: explain how this slice advances the application purpose and where it could distort that purpose.
4. Challenge assumptions from first principles. Name what would be harmful if false.
5. Define concept ownership and scope.
   - Is the concept global, per user, per organization, per project, per child/member, per event, per environment, or per integration?
   - Should users select from a controlled set, create custom values, or request vetted additions?
6. Define the input/output contract.
   - Inputs, sources, validation, defaults, missing-data behavior, permissions, and persistence.
   - Outputs, consumers, side effects, traceability, and error states.
7. Review input experience and resistance.
   - Does the input method match the actor's mental model?
   - Are choices phrased in human/domain language instead of code language?
   - Does the UI/API reduce ambiguity and prevent invalid or low-quality input early?
8. Define AI or automation authority, if relevant.
   - What can it suggest, decide, mutate, persist, retry, explain, or escalate?
   - What requires human review, warnings, provenance, or rollback?
   - How does testing/local AI differ from production/provider AI?
9. Run at least three scenario walkthroughs.
   - Happy path.
   - Missing/ambiguous input.
   - Misuse, edge case, or cross-feature conflict.
10. Check cross-slice impact.
    - Shared data, libraries, vocabularies, schedules, permissions, docs, tests, and future phases.
    - Trace the before/after workflow, changed state/data/feedback, upstream triggers, downstream consumers, adjacent workflows, and failure/recovery paths.
11. Identify required predecessor work.
    - If a different slice, data model, vocabulary, contract, or UX foundation is needed first, stop and propose that before this slice.
12. Identify human attention items.
    - Surface actor, input, concept ownership, AI/automation authority, validation, predecessor, and cross-slice questions in chat when they affect the next route or implementation plan.
    - Include a recommendation with every question.
13. Decide the route.
    - Proceed as planned, revise the slice, split it, add a predecessor, defer it, or downgrade it if risk is actually Tiny/Micro.

## Required output

```text
Slice product-fit status: Proceed / Revise / Split / Add predecessor / Defer
Work class impact:
Primary actor:
Secondary actors:
Actor job-to-be-done:
Product outcome:
Whole-product fit:
Before workflow:
After workflow:
Changed state, data, and feedback:
Upstream triggers:
Downstream consumers:
Adjacent/regression workflows:
Failure and recovery paths:
Assumptions challenged:
Concept ownership and boundaries:
Input contract:
Output contract:
Human/domain language needed:
Validation and resistance controls:
AI/automation authority:
Cross-slice impacts:
Implementation responsibilities by impact:
Scenario walkthroughs:
Predecessor work needed:
Evidence needed before confidence:
Human attention items:
Recommended next skill:
```

## Human attention items
Do not leave product-fit uncertainty only in the artifact. Before implementation planning, surface decision-bearing items in chat using:

```text
Question:
Recommendation:
Why this fits current evidence:
Tradeoff or risk:
Default action if approved or not corrected:
```

Use:

- `Needs decision before work` for items below 70% confidence or items that affect actor/job definition, source of truth, input method, validation, AI/automation authority, safety/privacy, predecessor sequencing, or public/user-visible behavior.
- `Recommended default unless corrected` for 70%+ assumptions that are safe to carry forward but important for the human to notice.
- `Recorded for later` for non-blocking context.

If the recommended route is `Revise`, `Split`, `Add predecessor`, or `Defer`, present that recommendation in chat before writing the implementation plan.

## Hard rules
- Do not skip this for Standard work.
- Do not treat the first slice definition as correct when actor, input, concept ownership, or cross-slice impact is unclear.
- Do not expose code-shaped variables, model flags, provider details, or internal enums directly to a human actor unless that actor is a technical operator and the product intentionally supports that.
- Do not allow shared vocabularies or libraries to mutate through casual free text when consistency is required for future behavior.
- Do not let AI or automation authority remain implicit.
- Do not reduce impact analysis to changed files. Carry the actor journey and affected upstream, downstream, adjacent, and recovery paths into implementation ownership and scenario evidence.
- Do not proceed to implementation planning when the correct next step is a predecessor slice.
- Do not ask the human a product-fit question without giving a recommended answer, rationale, tradeoff, and default action.

## Next skills
Usually planning product framing, application definition/modeling, contract spec, PRD/issues, implementation-plan guidance, implementation pattern guidance, `review/references/threat-model.md`, or decision brief.
