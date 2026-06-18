# Structured Claims And Failure Attribution

Status: Candidate contract
Promotion state: Experiment
Last updated: 2026-06-18

## Purpose

Make delegated outputs traceable enough that failures can be attributed to context, routing, implementation, verification, review, or handoff without relying on model confidence.

## Required Claim Fields

- `role`
- `inputPacket`
- `claimKind`: `deterministic`, `source-linked`, `judgment`, or `assumption`
- `claim`
- `evidenceOrSource`
- `uncertainty`
- `boundaryRespected`
- `caps`
- `requestedEscalation`

## Failure Attribution Fields

- `failedOutcome`
- `firstUnsupportedClaim`
- `suspectedStage`
- `confirmingEvidence`
- `repairAction`
- `scaffoldLearningCandidate`

## Optional Fields

- `confidence`
- `alternativeStage`
- `humanReviewNeeded`
- `relatedCommand`
- `relatedDiff`

## Source Of Truth

Task-local evidence, diffs, logs, tests, and human review confirm attribution. LLM attribution can propose a stage but cannot promote process changes alone.

## Forbidden Claims

- Do not update routing, model scorecards, or durable process policy from unconfirmed model attribution.
- Do not treat same-family model agreement as independent proof.

## Validation Path

Dry-run packets require structured response fields. Later fixture runs should replay claims against outcomes.

## No-Install Fallback

Use the fields as Markdown bullets in a response packet.
