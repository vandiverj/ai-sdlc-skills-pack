# Role Done Contracts

Status: Candidate contract
Promotion state: Experiment
Last updated: 2026-06-18

## Purpose

Define what the five supported Cycle 1 roles must return before the orchestrator can use their work.

## Shared Required Fields

Required: `role`, `task`, `scopeHandled`, `repositoryBoundary`, `evidenceUsed`, `claims`, `capsRisks`, `boundaryCheck`, `recommendedNextAction`.

Optional: `changedFiles`, `commandsRun`, `renderedEvidence`, `humanApprovalNeeded`, `knowledgeCandidate`.

## Role Done Rules

| Role | Done when | Must escalate |
| --- | --- | --- |
| implementation-worker | scoped changes and rationale are listed, evidence is run or capped, boundary is respected | destructive action, dependency install, migration, release, ambiguous requirements |
| verification-worker | commands/tools run, results, skipped checks, and caps are listed without edits | failure needs repair, waiver, new tool, dependency, product decision |
| independent-reviewer | blocking/non-blocking findings or no-findings statement includes evidence and residual risk | missing evidence, unsafe boundary, changed tests/snapshots without approval |
| release-handoff-worker | QA/finish material is tester-readable and human approval options are explicit | commit, push, merge, deploy, release, ticket writes |
| process-learning-reviewer | sanitized learning candidate and promotion recommendation are source-linked | sensitive facts, one weak signal proposed as durable policy |

## Source Of Truth

Portable role definitions in `agents/*.md` own role policy. `scripts/sdlc/lib/agentpackets.mjs` projects this contract into generated packets.

## Forbidden Claims

No role may claim final completion, release readiness, safety, or durable process promotion unless the orchestrator and required evidence gates support it.

## Validation Path

`sdlc agents packet --dry-run` includes the done contract. `sdlc agents lint --packet <path>` flags missing sections.

## No-Install Fallback

Manual role packets can copy the required fields from this contract.
