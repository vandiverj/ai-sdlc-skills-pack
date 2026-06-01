# Design Review

Use when building UI screens, changing user flows, adding visual states, or reviewing the actual rendered experience.

## Checks
- User flow clarity.
- Layout decisions and visual hierarchy.
- Accessibility, keyboard/focus, contrast, and screen reader implications.
- Empty, loading, error, disabled, permission, and success states.
- Mobile/responsive behavior.
- User-facing copy.
- Console errors, viewport issues, overlap, text fit, and obvious interaction issues.

## Rendered Evidence
For UI work, code inspection is not enough when the product can be run. Prefer Browser, Playwright, screenshots, app/device inspection, or equivalent approved tooling.

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
- Required design fixes.
- Optional improvements.
- Questions to resolve.
- Rendered evidence or reason not available.
- Impact on PRD/model/context files.
