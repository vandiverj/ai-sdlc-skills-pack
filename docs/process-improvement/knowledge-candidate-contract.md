# Knowledge Candidate Contract

Status: Candidate fallback contract
Promotion state: Experiment
Last updated: 2026-06-18

## Purpose

Define the no-MCP fallback envelope for reusable learning candidates until the AirteraCode MCP owns candidate submission.

## Fallback Path

```text
.ai-local/sdlc-cache/knowledge-candidates.jsonl
```

## Required Fields

- `schemaVersion`
- `kind`
- `class`
- `claim`
- `sourceArtifacts`
- `anchors`
- `taskRunEvidence`
- `appliesTo`
- `confidence`
- `confidenceLastConfirmed`
- `decayPolicy`
- `driftStatus`
- `sensitivity`
- `ownerArtifact`
- `suggestedAction`

## Optional Fields

- `expiresAt`
- `reviewer`
- `relatedCandidates`
- `redactionNotes`
- `migrationTarget`

## Source Of Truth

Knowledge candidates point to source-of-truth artifacts. They do not outrank code, tests, contracts, PRDs, ADRs, approved docs, or human review.

## Forbidden Claims

- Do not write sensitive customer/client facts into shared `.agents` docs.
- Do not treat candidate capture as MCP implementation.
- Do not promote one weak signal to durable process policy.

## Validation Path

Validate candidate JSONL rows against the envelope manually or with future schema checks. Later MCP migration should be mechanical.

## No-Install Fallback

Append JSONL records locally under `.ai-local/sdlc-cache/`.
