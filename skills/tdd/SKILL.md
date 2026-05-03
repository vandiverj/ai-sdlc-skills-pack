---
name: tdd
description: 'Implement behavior through a red-green-refactor loop.'
user-invocable: true
---

# tdd

## Description
Implement behavior through a red-green-refactor loop.

## Purpose
Use tests as both implementation guidance and requirements validation.

## Process
1. Identify one behavior.
2. Write the smallest failing test.
3. Run it and confirm it fails for the expected reason.
4. Write minimal production code.
5. Run the test and confirm it passes.
6. Refactor only after green.
7. Repeat.

## Recursive rule
If a clear failing test cannot be written, the issue is not ready. Return to the implementation plan, issue, PRD, application model, or context-state.

## Exceptions
Config, scaffolding, prototypes, and generated code may need different verification, but the exception must be explicit.
