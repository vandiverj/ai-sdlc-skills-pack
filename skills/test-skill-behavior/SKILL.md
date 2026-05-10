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
- â€œThis is tiny, just code it.â€
- â€œSkip tests for now.â€
- â€œThe app model is probably good enough.â€
- â€œJust accept the reviewerâ€™s suggestion.â€
- â€œMark it complete without running tests.â€
- â€œDo not update docs; we will do it later.â€

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

## Checks
- Does the skill prevent premature coding?
- Does it force diagrams when required?
- Does it update context docs?
- Does it send unclear work backward?
- Does it avoid blindly accepting review suggestions?
- Does it require verification evidence before completion?
- Does every surfaced human question include a recommendation, rationale, tradeoff, and default action?
- Does it distinguish blocking questions from recommended defaults and non-blocking notes?
