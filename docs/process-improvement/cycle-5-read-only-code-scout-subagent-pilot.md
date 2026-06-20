# Cycle 5 Implementation Plan: Read-Only Code Scout Subagent Pilot

Status: Packet generator and findings validator implemented
Promotion state: Experiment
Parent plan: [codex-local-model-sdlc-overview.md](codex-local-model-sdlc-overview.md)
Prior cycle: [cycle-4a-implementation-report.md](cycle-4a-implementation-report.md)
Related contracts:
- [three-tier-routing-matrix.md](three-tier-routing-matrix.md)
- [model-capability-drift-revalidation.md](model-capability-drift-revalidation.md)
- [sdlc-feedback-contract.md](sdlc-feedback-contract.md)
Last updated: 2026-06-20

## Purpose

Cycle 5 starts the actual subagent path without jumping straight to write-capable automation.

The durable agent role is a generic `read-only-code-scout`, not a narrow `duplicate-code-finder`. The scout receives a bounded role packet with:

- `languageProfile`: Classic ASP, C#/.NET, TypeScript/React, SQL, Node, Python, or generic.
- `taskType`: duplication-scan, abandoned-code-scan, extraction-candidate-scan, test-gap-scan, risk-surface-scan, or context-summary.
- `scope`: named files or a bounded folder set.
- `modelTierPreference`: local, cheaper-frontier, deterministic-only, or manual-fallback.
- `allowedActions`: read-only.
- `outputContract`: structured findings packet only.

The orchestrator remains responsible for final judgment, source verification, edits, tests, user-facing claims, and escalation.

## Hypothesis

If the SDLC can invoke or compile one generic read-only code scout role with language/task parameters, then the orchestrator can offload low-risk discovery to cheaper/local tiers while preserving code quality through source-linked findings, strict no-edit permissions, and top-frontier reconciliation.

Failure mode it addresses:
The current SDLC has lower/local model strategy and passive feedback, but no concrete way for the orchestrator to trigger a bounded worker. Without a first runner, model-tier policy remains theoretical.

Expected agent behavior change:
The orchestrator selects a safe scout packet for bounded read-only discovery, runs it through the available runtime or manual fallback, verifies findings against sources, and records useful/failed attempts through `sdlc_feedback`.

Expected developer experience change:
The developer should not manually coordinate local model prompts for routine discovery. They should only approve runtime use when needed and review the orchestrator's final verified result.

Expected code-quality change:
Routine discovery should improve without allowing lower-tier models to edit code, make final claims, or bypass verification.

How we will know it worked:
At least one real or fixture Standard task uses `read-only-code-scout` to produce source-linked findings that the orchestrator can accept, reject, or partially use with less human coordination than manual scouting.

How it could make things worse:
It could add noisy findings, hide uncertainty, overuse local models, or create process ceremony if scout output is not cheap to verify.

## Selected Architecture

### Role, Profile, Task

Use this hierarchy:

```text
agentRole: read-only-code-scout
languageProfile: classic-asp | dotnet-csharp | typescript-react | sql | node | python | generic
taskType: duplication-scan | abandoned-code-scan | extraction-candidate-scan | test-gap-scan | risk-surface-scan | context-summary
```

Rationale:

- Role agents stay stable across repositories.
- Language profiles tune syntax, idioms, and risk cues without creating one agent per language.
- Task types keep each invocation concrete without creating one permanent agent per task.

Rejected durable shape:

```text
duplicate-code-finder
```

That is useful as a pilot `taskType`, but too narrow as a permanent subagent identity.

## Authority Boundary

The scout may:

- read named files or approved bounded folders,
- summarize source-linked findings,
- identify candidate duplicate logic, dead/abandoned code, missing tests, or extraction opportunities,
- propose verification questions,
- report uncertainty and caps.

The scout must not:

- edit files,
- run destructive commands,
- stage, commit, push, merge, deploy, or release,
- query databases or tickets unless separately approved in a later cycle,
- claim final correctness,
- decide route fit,
- promote model capability,
- update durable SDLC guidance.

The orchestrator must verify source pointers before acting on findings.

## Runtime Strategy

Preferred order:

1. Deterministic local packet generation.
2. Manual fallback packet that can be pasted into a lower-tier/local runtime.
3. Codex CLI sub-session runner if available and explicitly approved.
4. LM Studio/OpenAI-compatible local endpoint only when configured and approved.

No local model runtime is required for the first implementation. Cycle 5 may implement the packet and reconciliation contract first, then add runtime invocation behind capability checks.

## Packet Contract

Input packet fields:

- `schemaVersion`: `sdlc.read_only_code_scout.request.v1`
- `agentRole`: `read-only-code-scout`
- `languageProfile`
- `taskType`
- `taskSummary`
- `scope`
- `allowedActions`: `["read"]`
- `forbiddenActions`
- `evidenceRequired`
- `outputSchema`
- `escalationTriggers`
- `modelTierPreference`
- `fallbackInstruction`

Output packet fields:

- `schemaVersion`: `sdlc.read_only_code_scout.findings.v1`
- `agentRole`
- `languageProfile`
- `taskType`
- `scopeReviewed`
- `findings`
- `sourcePointers`
- `confidence`
- `uncertainty`
- `verificationQuestions`
- `caps`
- `recommendedNextAction`

Findings must be source-linked. A finding without a source pointer is advisory noise and should not drive edits.

## Candidate First Task Types

Use one of these for the first pilot:

1. `duplication-scan`: find one safe repeated code pattern in a named file.
2. `abandoned-code-scan`: find unreachable, unused, or legacy-looking code that needs human confirmation.
3. `test-gap-scan`: identify missing test coverage for a bounded changed surface.
4. `context-summary`: summarize one file or folder for orchestrator planning.

Recommended first pilot:
`duplication-scan` or `context-summary` on a low-risk legacy file because findings are easy to verify and no writes are needed.

## Implementation Slices

### Slice 1: Contract And Templates

Implemented: added request and findings schemas for `read-only-code-scout`.

Acceptance:
- The request template includes role/profile/task/scope/authority fields.
- The findings template requires source pointers and caps.
- The contract states that findings are advisory until orchestrator verification.

### Slice 2: CLI Packet Generator

Implemented:

```bash
sdlc agents scout-packet --task "<task>" --language-profile classic-asp --task-type duplication-scan --scope "path/to/file.asp" --repo .
```

Acceptance:
- Generates a paste-ready or JSON packet.
- Does not invoke a model by default.
- Refuses empty scope.
- Includes read-only authority and forbidden action list.

### Slice 3: Findings Validator

Implemented:

```bash
sdlc agents scout-validate --packet <findings.json> --repo .
```

Acceptance:
- Validates required fields.
- Warns on missing source pointers.
- Rejects packets that claim edits, final correctness, or forbidden actions.

### Slice 4: Manual Runtime Pilot

Next step: use the generated packet with either:

- a lower-tier frontier sub-session,
- LM Studio local model,
- or manual fallback with the same packet.

Acceptance:
- One low-risk task produces a findings packet.
- Orchestrator verifies at least one accepted/rejected finding against source.
- `sdlc_feedback` records whether the scout reduced friction or created noise.

### Slice 5: Optional Invocation Adapter

Deferred: only after manual packet validation, add a runtime adapter behind explicit capability checks.

Possible command:

```bash
sdlc agents scout-run --task "<task>" --language-profile classic-asp --task-type duplication-scan --scope "path/to/file.asp" --runtime codex-cli --model-tier local
```

Acceptance:
- Requires explicit approval before first runtime invocation.
- Falls back to packet output when runtime is unavailable.
- Captures output as a local artifact.
- Does not permit edits.

## Quality Oracle Ladder

Best proof:
A real bounded task uses the scout, the orchestrator verifies source-linked findings, and the final code outcome improves or developer coordination drops.

Good proof:
A fixture or low-risk real file produces useful scout findings and clean validation.

Fallback proof:
Packet generation and validation work without invoking a model.

Unavailable proof:
Local model role fitness. That requires repeated runs by model/runtime/profile.

Do not claim:
Do not claim local model readiness, write-capable delegation readiness, or reduced cost from one scout run.

## Metrics

Capture through `sdlc_feedback`:

- task type,
- language profile,
- runtime/model tier used,
- accepted findings,
- rejected findings,
- missing source pointers,
- verification effort,
- human correction,
- friction reduced or introduced,
- suggested next action.

## Stop Conditions

Stop or fallback to orchestrator-only work if:

- scope is unclear,
- task requires edits,
- output lacks source pointers,
- scout invents facts,
- model/runtime is unavailable,
- findings are more expensive to verify than doing the scout manually,
- sensitive data boundary is unclear.

## Human Approval Needed

Approval is needed before:

- invoking Codex sub-sessions automatically,
- invoking LM Studio/local model endpoints,
- using a lower-tier model on private code outside approved local policy,
- implementing write-capable worker roles,
- committing or pushing changes.

No approval is needed to generate local read-only packets and schemas in `.agents`.
