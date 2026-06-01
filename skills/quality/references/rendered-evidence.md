# Rendered Evidence

Use when UI or user-facing workflows can be run, rendered, or inspected.

## Checks
- App starts or page opens at the expected target.
- Relevant flows render without blank screens, console errors, overlap, or unusable states.
- Desktop and mobile/responsive viewports are checked when relevant.
- Screenshots or concise observations are captured.
- Accessibility checks run when available and proportional to the work.

## Fallback When Browser Automation Is Unavailable
- Run an HTTP/dev-server smoke check when possible to prove the app serves.
- Mark rendered UI review as capped, not passed.
- State which browser/rendered tool was unavailable.
- Hand off the exact URL and workflow that still needs visual inspection.
- Do not claim layout, overlap, responsive behavior, accessibility, or interaction quality from HTTP-only evidence.

## Output
- Rendered surface.
- Tool used.
- Viewports.
- Flow checked.
- Observed result.
- Console/accessibility issues.
- Screenshots/snapshots if available.
- Skipped visual checks and why.
