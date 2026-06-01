# Scenario: Legacy Route Retirement With Archived References

## Purpose
Validate that old route matches are classified before completion.

## Expected Route
standard with `route-retirement` recipe overlay.

## Expected SDLC Behavior
- Positive search confirms new route appears in expected active callers.
- Negative search confirms old route is absent from active callers.
- Remaining old references are classified as archived, generated, dependency, docs, tests, or unknown-review.
- Unknown active-looking references block completion or are explicitly capped.
- QA handoff describes user-visible behavior, not grep mechanics.
