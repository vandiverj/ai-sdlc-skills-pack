---
name: product-reframe
description: 'Challenge whether the app or feature idea is the right thing to build before defining the application.'
user-invocable: true
---

# product-reframe

## Description
Challenge whether the app or feature idea is the right thing to build before defining the application.

## Purpose
Prevent building a well-structured version of the wrong product.

## Use when
- Starting a new application
- Considering a major pivot
- A feature idea feels broad or speculative

## Questions to answer
- Who specifically needs this?
- What are they doing today instead?
- What pain proves this is real?
- What is the narrowest useful wedge?
- What assumption could make this app wrong?
- What should explicitly not be built?
- What would make this more valuable over time?

## Slice Reframe Mode
When evaluating an existing feature slice instead of a whole product, reframe the slice through the actor and the application purpose.

Ask:
- Who is the actual actor for this slice: human end user, admin/operator, downstream software, AI/model, external service, maintainer, or data owner?
- What job is that actor trying to complete, and what outcome should the product make easier?
- Does the proposed slice belong at this level, or should it be global, per user, per organization, per project, per event, per environment, or per integration?
- Is the slice hiding a necessary predecessor, shared vocabulary, contract, or validation model?
- Would a non-technical actor understand the choices, settings, warnings, and outputs?

If the slice is still viable, hand off to `slice-product-fit` before implementation planning for Standard work.

## Output
- Product thesis
- Target user
- Current workaround
- Core pain
- Narrow wedge
- Key assumptions
- NOT in scope
- Recommendation: proceed, narrow, or rethink
