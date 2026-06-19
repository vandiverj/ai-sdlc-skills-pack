# Knowledge Candidate Contract

Status: Implemented fallback contract
Promotion state: Provisional
Last updated: 2026-06-19

## Purpose

Define the no-MCP fallback envelope for reusable learning candidates. The AirteraCode MCP now owns live candidate submission when available, while this JSONL path remains the portable no-install fallback and export bridge.

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

Validate candidate JSON or JSONL rows against the envelope with:

```bash
sdlc learn candidate-validate --file <json|jsonl>
```

Create a fallback row with:

```bash
sdlc learn candidate-add --claim "..." --source <path> --owner <artifact>
```

Export rows for MCP review with:

```bash
sdlc learn candidate-export --repo .
```

Review candidate staleness, missing anchors, expired confidence, and deterministic anchor-hash caps with:

```bash
sdlc learn candidate-drift --repo .
```

MCP submission should be mechanical because the fallback row uses the same required fields as the live AirteraCode gateway.

Cycle 3 drift reporting is conservative. It does not validate candidate content correctness, promote candidates, or claim anchor-change detection unless a stored anchor hash is available.

## No-Install Fallback

Append JSONL records locally under `.ai-local/sdlc-cache/`.
