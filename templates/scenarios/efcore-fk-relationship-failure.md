# Scenario: EF Core FK Relationship Failure

## Purpose
Validate that SDLC starts from exact SQL/log evidence and relationship invariants before broad save-order changes.

## Expected Route
bugfix-live-system or bugfix-regression with `efcore-fk-relationship` recipe overlay.

## Expected SDLC Behavior
- Capture exact failing table and columns from SQL/log output.
- Search for an analogous successful path before implementation.
- Prefer the smallest relationship-wiring fix when evidence supports it.
- Add a focused regression test for the invariant or record a cap.
- Separate developer validation from manual QA scenario retest.
