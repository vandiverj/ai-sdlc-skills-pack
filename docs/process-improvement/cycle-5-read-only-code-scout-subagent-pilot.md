# Cycle 5 Implementation Plan: Read-Only Code Scout Subagent Pilot

Status: Manual fallback pilot, LM Studio runtime pilot, and Codex-native adapter correction completed
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
2. Codex-native custom-agent adapter when the current Codex surface supports subagents.
3. Manual fallback packet that can be pasted into a lower-tier/local runtime.
4. Codex CLI `codex exec` only as a noninteractive smoke-test, runtime comparison, or fallback harness.
5. Direct LM Studio/OpenAI-compatible endpoint only when configured and approved.

No local model runtime is required for the first implementation. Cycle 5 implements the packet and reconciliation contract first. Cycle 5a adds Codex custom-agent adapter templates so interactive Codex subagents can use the same contract without requiring the orchestrator to shell out to `codex exec`.

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

Implemented for manual fallback: generated a scout packet, produced a structured findings packet from a bounded read-only pass, validated the findings, and recorded `sdlc_feedback`.

Runtime/model execution status:

- LM Studio was reachable at `http://192.168.137.171:1234`.
- `google/gemma-4-26b-a4b-qat` was listed by the API.
- The primary `google/gemma-4-26b-a4b-qat` model id hit reasoning-only output, malformed contract output, and then an LLGuidance structured-output backend error after schema attempts.
- Server-side `json_schema` structured output was not usable with the current backend/schema combination.
- `google/gemma-4-26b-a4b-qat:2` with plain JSON prompting produced a valid scout findings packet that passed `sdlc agents scout-validate`.
- Codex CLI successfully called `google/gemma-4-26b-a4b-qat:2` through a custom `lmstudio-lan` provider pointed at `http://192.168.137.171:1234/v1` with `wire_api="responses"`.
- After LM Studio was configured to listen on localhost, Codex CLI's built-in `--oss --local-provider lmstudio` path also successfully called `google/gemma-4-26b-a4b-qat:2`.
- Codex CLI custom providers rejected `wire_api="chat"` in version 0.139.0, so the LAN adapter path must use the Responses wire API.
- A real bounded read-only scout task through Codex CLI + LM Studio produced an invalid first packet, then a valid corrected packet after stricter contract prompting.
- The corrected local-model packet's finding was source-linked but weak; orchestrator verification found the cited source exists and the parse-error sentinel behavior is already surfaced by validation.
- An approved `gpt-5.3-codex-spark` scout sub-session was blocked by execution policy because it would send private workspace content to an external model provider. A retry after explicit informed user approval was also blocked, so this runtime path is unavailable for private workspace content in this environment.
- User-run `gpt-5.3-codex-spark` scout from a local terminal reached the model but failed because the findings schema was not accepted by structured output. The schema was repaired by adding explicit `type: "object"` keys to forbidden-field `not.anyOf` branches.

Still pending: prove usefulness on a real bounded scout task through one of:

- a lower-tier frontier sub-session only for non-private/sanitized packets or an environment where policy permits external disclosure,
- user-run frontier sub-session with the structured-output-compatible schema,
- repeated LM Studio local-model runs with first-pass valid packets and useful findings,
- or manual fallback with the same packet as the comparison baseline.

Acceptance:
- One low-risk task produces a findings packet.
- Orchestrator verifies at least one accepted/rejected finding against source.
- `sdlc_feedback` records whether the scout reduced friction or created noise.

### Slice 5a: Codex-Native Subagent Adapter

Implemented as adapter-template correction:

- `templates/adapters/codex/sdlc-read-only-code-scout.toml`
- `templates/adapters/codex/sdlc-local-read-only-code-scout.toml`

Preferred prompt shape:

```text
Use the sdlc_read_only_code_scout subagent. Give it the packet at <packet-path>. It must inspect only the scoped files, return findings matching templates/schemas/sdlc-read-only-code-scout-findings.schema.json, and stop without editing. Wait for it, then validate the returned packet and verify source pointers before acting.
```

Acceptance:
- Uses user-level `~/.codex/agents/*.toml` as the default reusable runtime adapters over `agents/read-only-code-scout.md`.
- Uses project-level `.codex/agents/*.toml` only for repo-specific overrides or team-shared adapter choices.
- Includes `sdlc_lmstudio_read_only_code_scout` as an experimental direct LM Studio-pinned adapter, but tested hosted parent sessions cannot spawn it yet. Use `codex exec --oss --local-provider lmstudio` for direct LM Studio scout runs until that changes.
- Keeps hosted-model privacy policy explicit.
- Lets local-provider sessions inherit LM Studio model/provider settings from the parent Codex session.
- Falls back to packet output or `codex exec` smoke testing when native subagents are unavailable.
- Does not permit edits.

Validation note:
Before installing the adapters under `~/.codex/agents/` and restarting VS Code, the current chat subagent tool rejected the custom `sdlc_read_only_code_scout` agent type. After restart, both `sdlc_read_only_code_scout` and `sdlc_local_read_only_code_scout` were accepted. The first hosted scout returned schema-shaped JSON but failed local validation because no-finding packets still need reviewed `sourcePointers`. The adapter templates now state that `sourcePointers` must be included even when `findings` is empty. After reinstalling the updated adapters, a second hosted scout returned reviewed source pointers and passed `sdlc agents scout-validate`.

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
