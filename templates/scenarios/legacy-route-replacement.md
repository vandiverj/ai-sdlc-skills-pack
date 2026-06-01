# Scenario: Legacy Route Replacement

## Purpose
Validate route-retirement discipline for legacy-to-modern replacement work.

## Task Shape
- Existing callers use a legacy route or endpoint.
- New behavior lives behind a modern API or replacement route.
- Active callers, links, redirects, and permissions must be checked.

## Expected SDLC Behavior
- Search for active callers of old and new routes.
- Capture replacement contract and route-retirement evidence.
- Generate QA steps for both the happy path and "old path no longer used" regression.
- Preserve deployment-specific caution when old and new systems release separately.

## Failure To Catch
The agent implements the new route but leaves active legacy callers behind.
