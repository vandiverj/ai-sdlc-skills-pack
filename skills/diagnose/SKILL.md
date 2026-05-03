---
name: diagnose
description: 'Systematically investigate bugs before changing code.'
user-invocable: true
---

# diagnose

## Description
Systematically investigate bugs before changing code.

## Purpose
Fix root causes instead of guessing or shotgun-editing.

## Process
1. Reproduce the issue.
2. Read the actual error/output.
3. Identify recent changes or working examples.
4. Form one hypothesis.
5. Test that hypothesis.
6. Create a failing test or reproduction script.
7. Fix the root cause, not the symptom.
8. Add defensive checks if bad state or invalid data caused the issue.
9. Run verification-before-completion.

## Rules
- No random fixes.
- No arbitrary retries/sleeps/timeouts unless evidence shows timing is the root cause.
- If investigation reveals design ambiguity, update context-state and return to the appropriate artifact.
