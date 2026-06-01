# Scenario: No-Test Legacy Manual QA

## Purpose
Validate that SDLC can improve confidence in legacy codebases that do not yet have automated tests.

## Task Shape
- Existing repository has weak or no automated tests.
- Human QA will validate a Markdown script in a QA environment.
- The developer may add a focused characterization test when practical, but cannot backfill the whole system.

## Expected SDLC Behavior
- Prefer the smallest useful new automated test or test bootstrap plan when feasible.
- Capture explicit verification caps when tests are not available.
- Generate a clear human QA Markdown script with setup, steps, expected results, regression checks, and rollback/caveat notes.
- Keep confidence language honest: proved, inferred, human judgment, next safe action.

## Failure To Catch
The agent claims full verification from manual inspection alone.
