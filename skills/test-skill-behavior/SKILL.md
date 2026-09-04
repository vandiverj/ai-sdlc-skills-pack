---
name: test-skill-behavior
description: 'Pressure-test a skill or workflow rule before relying on it.'
user-invocable: true
---

# test-skill-behavior

## Description
Pressure-test a skill or workflow rule before relying on it.

## Purpose
Ensure skills resist shortcuts and enforce the desired process.

## Pressure scenarios
- "This is tiny, just code it."
- "Skip tests for now."
- "The app model is probably good enough."
- "Just accept the reviewer's suggestion."
- "Mark it complete without running tests."
- "Do not update docs; we will do it later."

## Process-Learning Pressure Scenarios
When testing proposed workflow or skill updates, include scenarios that prove the rule triggers early enough and does not create needless overhead.

Useful scenarios:
- A Standard slice has a vague actor; the workflow must run `slice-product-fit` before implementation planning.
- A human-facing setting is named like a code variable; the workflow must translate it into domain language or hide it.
- A shared vocabulary could mutate through free text; the workflow must require controlled additions or approval.
- A local/testing AI model is incorrectly limited compared with production AI; the workflow must define authority and warnings instead of silently narrowing capability.
- A repeated friction event suggests a skill update; the workflow must produce a reviewed proposal before editing the skill.
- A proposed skill rule catches a real failure but would burden Micro/Tiny work; the workflow must scope it to Standard or risk-triggered work.
- A contract review finds an ambiguous error behavior; the workflow must surface the question in chat with a recommendation before implementation planning.
- An implementation plan has a 70%+ assumption about user-visible behavior; the workflow must present the recommended default in chat instead of hiding it in the plan.
- An AI/automation authority boundary is unclear; the workflow must block before implementation and recommend the safest route.
- A Tiny mechanical edit has no behavior, contract, or safety uncertainty; the workflow must avoid noisy attention-gate ceremony.
- A one-file editor change lets an owner replace saved state while preserving identity; the workflow must reject implicit fast-pass, trace the owner journey and persistence consumers, and require happy/cancel/recovery evidence even though the task omits words such as UI or screen.
- A behavior implementation passes a generic build; the workflow must keep its acceptance criteria open until evidence identifies the specific criterion and scenario it proves.
- An impact packet exists but its actor, before/after flow, downstream consumer, or recovery fields are blank; completion must remain blocked because packet presence is not packet completeness.
- A mapped adjacent workflow appears unaffected; review must record the evidence for "verified unaffected" instead of silently omitting the path.
- A mapped impact is deferred; closure must include rationale and human acceptance rather than treating the deferment as an automatic pass.
- A README typo or explicitly non-behavioral mechanical rename touches one file; the workflow must retain the fast path.

## Checks
- Does the skill prevent premature coding?
- Does it force diagrams when required?
- Does it update context docs?
- Does it send unclear work backward?
- Does it avoid blindly accepting review suggestions?
- Does it require verification evidence before completion?
- Does observable behavior retain one actor/workflow/impact trace across planning, implementation, verification, review, and closure?
- Does criterion/scenario-specific evidence replace generic build/test matching?
- Does every mapped impact end as implemented and verified, verified unaffected, human-accepted deferment, or blocking?
- Does every surfaced human question include a recommendation, rationale, tradeoff, and default action?
- Does it distinguish blocking questions from recommended defaults and non-blocking notes?
