# Cycle 5a Implementation Plan: Codex-Native Subagent Adapters

Status: User-level custom-agent discovery and validated hosted scout completed
Promotion state: Experiment
Parent plan: [codex-local-model-sdlc-overview.md](codex-local-model-sdlc-overview.md)
Prior cycle: [cycle-5-read-only-code-scout-subagent-pilot.md](cycle-5-read-only-code-scout-subagent-pilot.md)
Last updated: 2026-06-20

## Purpose

Cycle 5a corrects the Cycle 5 runtime direction. The read-only scout packet and findings contracts remain useful, but Codex-native custom agents should be the preferred Codex subagent path where available. `codex exec` remains a useful noninteractive smoke-test or fallback harness, not the default architecture for interactive subagents.

## Hypothesis

If the SDLC maps portable roles into user-level `~/.codex/agents/*.toml` custom-agent adapters, then Codex can spawn bounded scout subagents across repositories without requiring every downstream repo to copy SDLC agent files. The SDLC still keeps source-of-truth role policy, packet contracts, and findings validation outside runtime-specific files.

Failure mode it addresses:
The earlier Cycle 5 path made the orchestrator manually coordinate `codex exec` subprocesses and provider flags. That added ceremony, ran into this environment's external-provider execution policy, and obscured the fact that Codex already has native subagent configuration.

Expected behavior change:
The orchestrator asks Codex to spawn a named SDLC scout agent, supplies a bounded scout packet, waits for results, validates the findings packet, and verifies source pointers before acting.

Expected developer experience change:
The developer should see a normal Codex subagent workflow instead of manually assembling CLI commands for every scout. Manual commands remain available for debugging and model/runtime comparison.

Expected code-quality change:
Read-only scouts can reduce noisy discovery in the main thread without gaining write authority or bypassing orchestrator review.

How we will know it worked:
A real bounded task uses `sdlc_read_only_code_scout` or `sdlc_local_read_only_code_scout`, returns schema-valid findings, and at least one finding is accepted or rejected after source verification.

How it could make things worse:
Adapters could duplicate policy, hard-code fragile model names, or make subagent output feel more authoritative than it is. Keep adapters thin and validation mandatory.

## Implemented Slice

Added Codex custom-agent templates:

- `templates/adapters/codex/sdlc-read-only-code-scout.toml`
- `templates/adapters/codex/sdlc-local-read-only-code-scout.toml`

Installed active user-level adapters:

- `~/.codex/agents/sdlc-read-only-code-scout.toml`
- `~/.codex/agents/sdlc-local-read-only-code-scout.toml`
- `~/.codex/agents/sdlc-lmstudio-read-only-code-scout.toml`

Project-scoped fixture adapters were removed from `.agents/.codex/agents/` after the user-level install, because these SDLC agents are reusable personal/workflow adapters rather than repo-specific application configuration.

Updated reusable guidance:

- `skills/setup-sdlc-in-repo/SKILL.md`
- `skills/agents/references/runtime-adapter-rules.md`
- `skills/agents/references/bounded-agent-catalog.md`
- `templates/docs/agents/runtime-adapters.md`

## Adapter Policy

Portable source of truth:

- `agents/read-only-code-scout.md`
- `templates/schemas/sdlc-read-only-code-scout-request.schema.json`
- `templates/schemas/sdlc-read-only-code-scout-findings.schema.json`
- `sdlc agents scout-packet`
- `sdlc agents scout-validate`

Codex adapter files may define:

- concrete model name,
- model provider,
- reasoning effort,
- sandbox default,
- local provider inheritance behavior,
- runtime-specific caps.

Codex adapter files must not redefine:

- role authority,
- write permissions,
- evidence requirements,
- Git/release authority,
- final judgment ownership.

## Usage Pattern

Install the reusable SDLC adapters once at the user level:

```text
~/.codex/agents/sdlc-read-only-code-scout.toml
~/.codex/agents/sdlc-local-read-only-code-scout.toml
~/.codex/agents/sdlc-lmstudio-read-only-code-scout.toml
```

Use project-level `.codex/agents/` only when a repository needs an override, such as a stricter sandbox, repo-specific MCPs, or team-shared model choices.

Prompt shape:

```text
Use the sdlc_read_only_code_scout subagent. Give it the packet at <packet-path>. It must inspect only the scoped files, return findings matching templates/schemas/sdlc-read-only-code-scout-findings.schema.json, and stop without editing. Wait for it, then validate the returned packet and verify source pointers before acting.
```

For LM Studio/local model experiments, start the parent Codex session with the local provider first, then use `sdlc_local_read_only_code_scout` so provider/model settings inherit from the parent session.

When a direct LM Studio-pinned scout is needed today, use `codex exec --oss --local-provider lmstudio`. The `sdlc_lmstudio_read_only_code_scout` adapter is installed as a future custom-agent experiment and sets `model_provider = "oss"`, `oss_provider = "lmstudio"`, and the current tested model id, but tested hosted parent sessions cannot spawn it.

## Validation Needed

Validation completed:

- Attempted to spawn `sdlc_read_only_code_scout` directly through the currently exposed subagent tool.
- Before the user-level install and VS Code restart, the tool rejected the custom agent type with `unknown agent_type 'sdlc_read_only_code_scout'`.
- After installing the adapters under `~/.codex/agents/` and restarting VS Code, the tool accepted and spawned `sdlc_read_only_code_scout`.
- The hosted scout returned schema-shaped JSON but failed `sdlc agents scout-validate` because it reported no findings with an empty `sourcePointers` array.
- The adapter templates were tightened to require `sourcePointers` for reviewed files or line ranges even when `findings` is empty.
- The tool also accepted and spawned `sdlc_local_read_only_code_scout`; a small discovery smoke test returned the expected JSON.
- After reinstalling the tightened adapters under `~/.codex/agents/`, a second `sdlc_read_only_code_scout` run returned a no-finding packet with reviewed source pointers.
- `sdlc agents scout-validate --repo . --packet /private/tmp/cycle5a-custom-scout-findings-v2.json` passed.
- Added `sdlc_lmstudio_read_only_code_scout` under `~/.codex/agents/` with `model_provider = "oss"`, `oss_provider = "lmstudio"`, and `model = "google/gemma-4-26b-a4b-qat:2"`.
- The current session did not discover the newly added LM Studio-pinned agent immediately; based on the earlier user-level install behavior, a Codex/VS Code restart is expected before newly added user-level agent files become available.
- After restarting only the Codex extension, spawning `sdlc_lmstudio_read_only_code_scout` returned `agent type is currently not available`. This suggests the user-level file is visible enough to be considered, but this hosted extension/subagent surface cannot currently launch the OSS/LM Studio provider-backed custom agent from the existing session.
- After a full VS Code restart, `sdlc_lmstudio_read_only_code_scout` still returned `agent type is currently not available`. Treat direct OSS/LM Studio provider-pinned custom agents as unavailable in this hosted extension surface.
- A normal hosted Codex CLI parent session launched with `codex` also returned `agent type is currently not available` for `sdlc_lmstudio_read_only_code_scout`. Treat hosted-parent-to-OSS-provider custom subagent spawning as unavailable across the tested IDE, app, and CLI surfaces.
- `codex exec --oss --local-provider lmstudio -m google/gemma-4-26b-a4b-qat:2` successfully ran the read-only scout prompt against the same packet from the CLI. The first sandboxed attempt failed because Codex could not write its state DB and reported LM Studio unavailable; the approved unsandboxed CLI attempt reached LM Studio and completed.
- The Codex CLI + LM Studio result was wrapped in a markdown `json` fence, so the raw `--output-last-message` file was not directly valid JSON. After extracting the JSON body, `sdlc agents scout-validate --repo . --packet /private/tmp/cycle5a-codex-cli-oss-lmstudio-scout.extracted.json` passed.
- The CLI run reported 17,538 tokens used and returned a no-finding packet with reviewed source pointers.
- Spawned the built-in `explorer` subagent as a native-control test with the same read-only scout packet and `gpt-5.3-codex-spark`.
- The built-in explorer returned valid `sdlc.read_only_code_scout.findings.v1` JSON.
- `sdlc agents scout-validate --repo . --packet /private/tmp/cycle5a-native-explorer-scout-findings.json` passed.
- Orchestrator reviewed the returned source pointers. The path-boundary findings are not immediate fixes because outside-repo `/private/tmp` output/input is a documented fallback for sandboxed SDLC evidence, but they identify a future hardening decision: make allowed outside-repo paths explicit, such as repo-local paths plus approved temp roots.

Still pending:

- Run `sdlc_read_only_code_scout` on a real downstream repository cleanup/scout task and compare usefulness against the built-in explorer and LM Studio paths.
- Prefer `codex exec --oss --local-provider lmstudio` as the proven LM Studio scout runner for now. Keep `sdlc_lmstudio_read_only_code_scout` installed as a future custom-agent experiment, but do not treat it as available from hosted parent sessions.
- Record whether it reduced friction or created noise through `sdlc_feedback`.

Current evidence proves custom user-level agent discovery works after restart and that the hosted scout can return a locally valid no-finding packet. Do not claim usefulness, cost savings, or downstream readiness until the scout helps on a real non-`.agents` task with accepted/rejected findings.
