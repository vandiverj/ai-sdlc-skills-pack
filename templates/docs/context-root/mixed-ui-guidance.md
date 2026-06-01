# Mixed UI Guidance

Purpose: capture project-specific guidance for applications that combine legacy pages, embedded modern components, shared scripts, and service/API calls.

## Surfaces

- Legacy page/templates:
- Embedded React/modern components:
- Shared CSS/scripts:
- Backend/API calls:
- SQL/data dependencies:
- Third-party integrations:

## Review Focus

- Confirm which frontend owns the visible behavior.
- Check shared CSS/script side effects across nearby pages.
- Identify whether a React component is embedded in a legacy route.
- Trace user-visible workflow through API/service/data/integration boundaries.
- Keep QA steps focused on what testers can observe.

## Verification

- Legacy page smoke:
- Modern component smoke:
- API/service check:
- Data persistence check:
- Browser/device coverage:
- Caps:
