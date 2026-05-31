---
name: design-review
description: 'Review UI/user experience when the application has meaningful interface work.'
user-invocable: true
---

# design-review

## Description
Review UI/user experience when the application has meaningful interface work.

## Use when
- Building UI screens
- Changing user flow
- Adding visual states

## Checks
- User flow clarity
- Layout decisions
- Accessibility
- Empty/loading/error states
- Visual hierarchy
- Mobile/responsive behavior
- User-facing copy
- Rendered browser/app/device behavior when a runnable surface and approved tool are available
- Console, viewport, overlap, text-fit, keyboard/focus, and obvious interaction issues

## Rendered evidence
For UI work, code inspection is not enough when the product can be run.

Prefer Playwright, browser screenshots, app/device inspection, or equivalent approved tooling.

If rendered review is skipped, state why:

```text
Rendered surface:
Tool used:
Viewport(s):
Flow checked:
Observed result:
Console/accessibility issues:
Screenshots/snapshots:
Skipped visual checks and why:
```

## Output
- Required design fixes
- Optional improvements
- Questions to resolve
- Rendered evidence or reason not available
- Impact on PRD/model/context files
