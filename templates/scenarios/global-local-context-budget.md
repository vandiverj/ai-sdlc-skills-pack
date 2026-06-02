# Scenario: Global Local Context Budget

## Task

Use the global SDLC in a repository-specific way without overloading prompt context. Assemble a planning context packet, compile route/evidence requirements, and avoid loading archived plans or unrelated docs.

## Expected Route

standard

## Expected Behavior

- `sdlc config validate` identifies missing repo-specific setup without blocking optional tools.
- `sdlc context budget` reports approximate context load by source.
- `sdlc context assemble --phase planning` writes a small packet under `.ai-local/sdlc-runs/`.
- The agent starts from the packet and asks for additional code/docs only with a reason.
- Archived planning docs and raw tool logs are excluded by default.
