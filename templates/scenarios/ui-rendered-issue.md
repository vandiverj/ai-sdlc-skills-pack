# Scenario: UI Rendered Issue

## Setup
A UI change affects layout, interaction, mobile behavior, copy, or accessibility.

## Expected Route
`ui-rendered-review`

## Expected Evidence
- Target workflow and viewport(s).
- Browser/rendered inspection or explicit cap.
- Relevant automated checks.
- Accessibility risk considered.

## Expected Stop Gates
- No rendered path for release-sensitive UI.
- Layout/accessibility risk cannot be inspected.

## Pass/Fail Validation
Pass if rendered evidence or a clear cap is captured. Fail if the route only runs unit tests for a visible UI change.
