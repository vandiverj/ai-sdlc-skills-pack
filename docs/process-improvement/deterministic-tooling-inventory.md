# Deterministic Tooling Inventory

Status: Candidate contract
Promotion state: Experiment
Last updated: 2026-06-18

## Purpose

Prefer deterministic tools over model judgment whenever a tool can answer the question with acceptable trust.

## Required Fields

- `tool`
- `surface`
- `command`
- `evidenceKind`
- `repoConfigured`
- `available`
- `writesFiles`
- `requiresApproval`
- `bestProof`
- `fallbackProof`

## Optional Fields

- `unit`
- `packageManager`
- `configFile`
- `lastRun`
- `knownFlake`
- `evidenceArtifact`

## Tool Classes

- tests, type checks, lint, format, build,
- schema/OpenAPI/JSON validators,
- SQL/migration dry-run checks,
- accessibility, link, spelling, prose, markdown checks,
- dependency/security/license scans when already approved,
- diff-size, forbidden-path, generated-file, and scope checks.

## Source Of Truth

Repo-local commands, package scripts, profiles, and `sdlc tools inventory` own actual availability.

## Forbidden Claims

Do not substitute model review when deterministic evidence exists and is runnable. Do not install new tools without approval.

## Validation Path

Use `sdlc tools inventory --repo <path>` and generated packet evidence contracts.

## No-Install Fallback

Record unavailable tools as caps and choose manual/source inspection proof.
