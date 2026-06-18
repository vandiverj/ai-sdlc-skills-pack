# Agent Response Packet Contract

Status: Candidate contract
Promotion state: Experiment
Last updated: 2026-06-18

## Purpose

Define the minimum output shape a delegated role must return so the orchestrator can reconcile evidence instead of trusting prose.

## Required Fields

- `status`: `complete`, `partial`, `blocked`, or `needs-human-review`
- `role`
- `scopeHandled`
- `evidenceUsed`
- `structuredClaims`
- `boundaryCheck`
- `capsRisks`
- `recommendedNextAction`

## Optional Fields

- `filesTouched`
- `commandsRun`
- `renderedEvidence`
- `knowledgeCandidates`
- `humanApprovalsNeeded`
- `fallbacksUsed`

## Source Of Truth

Generated packets and prompt templates should require this response shape. Future schemas may validate machine-readable variants.

## Forbidden Claims

- Do not omit failed, skipped, stale, or capped evidence.
- Do not claim source-of-truth selection without source links.
- Do not claim release, Git, deployment, ticket, database, or external-service action was performed unless explicitly approved and evidenced.

## Validation Path

Manual review in Cycle 1. Later cycles may add `sdlc response lint` schema checks.

## No-Install Fallback

Return these fields as Markdown headings.
