---
name: to-issues
description: 'Break a PRD into small, testable implementation issues.'
user-invocable: true
---

# to-issues

## Description
Break a PRD into small, testable implementation issues.

## Inputs
- PRD.
- Application model.
- Issue/task diagrams.
- Context-state open questions.

## Each issue must include
- Goal.
- Related PRD section.
- Related application model section.
- Related feature context.md file, if applicable.
- Acceptance criteria.
- Test expectations.
- Public or cross-boundary contract impact: yes / no / unknown.
- Dependencies.
- NOT in scope.
- Definition of Done additions.

## Rules
- Do not create giant vague issues.
- Do not create issues that require undefined components.
- Mark unresolved questions rather than pretending they are resolved.
- If contract impact is "yes" or "unknown", route through `write-contract-spec` before implementation planning.