# Scenario: Multi-Project Repository

## Purpose
Validate that SDLC reasons at deployable-unit level when one repository contains multiple separately built or deployed codebases.

## Task Shape
- One repository contains multiple API, worker, UI, or library projects.
- Units may have different commands, deployment paths, owners, and context buckets.
- A task may touch one unit while sharing contracts with another.

## Expected SDLC Behavior
- Resolve the affected unit from `.ai-local/sdlc-profile.md` or path-local context.
- Keep repo-level and unit-level context separate.
- Use the affected unit's commands, test surface, deploy method, and QA notes.
- Flag cross-unit risk only when shared code, contracts, data, or deployment coupling is involved.

## Failure To Catch
The agent treats the whole repository as one application and chooses incorrect tests or context.
