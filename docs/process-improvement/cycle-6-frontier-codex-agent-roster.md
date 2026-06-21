# Cycle 6 Plan: Frontier Codex SDLC Agent Roster

Date: 2026-06-20
Status: Approved for implementation
Promotion state: Experiment

## Purpose

Create the first complete Codex-native SDLC agent roster for developers who have Codex but do not have LM Studio configured. These agents use hosted frontier GPT models only. LM Studio remains deferred.

The parent Codex session remains the orchestrator. It owns work classification, safe-edit boundaries, final synthesis, human-facing decisions, commits, pushes, merges, deployments, and AirteraCode feedback submission.

## Decisions

- Implementation workers may edit directly inside an explicitly assigned safe-edit boundary.
- SDLC feedback is parent-mediated. Agents return sanitized feedback drafts; the parent validates and submits feedback through AirteraCode MCP when available or local `sdlc feedback add` fallback when not.
- `gpt-5.5` is reserved for high-risk security, privacy, data, migration, deployment, and critical architecture review.
- User-level Codex agent files should be installable through a helper. Tracked files remain under `templates/adapters/codex/`.

## Model Mapping

Use the smallest frontier model expected to satisfy the role:

| Tier | Codex model | Use |
| --- | --- | --- |
| fast | `gpt-5.3-codex-spark` | bounded read-only discovery |
| standard-light | `gpt-5.4-mini` | planning, verification synthesis, QA/release/process handoff |
| standard | `gpt-5.4` | implementation and independent review |
| deep | `gpt-5.5` | security/privacy/high-risk review only |

## Agent Roster

| Agent | Model | Access |
| --- | --- | --- |
| `sdlc_context_scout` | `gpt-5.3-codex-spark` | read-only |
| `sdlc_read_only_code_scout` | `gpt-5.3-codex-spark` | read-only |
| `sdlc_implementation_planner` | `gpt-5.4-mini` | read-only |
| `sdlc_implementation_worker` | `gpt-5.4` | bounded write |
| `sdlc_verification_worker` | `gpt-5.4-mini` | commands, no edits |
| `sdlc_independent_reviewer` | `gpt-5.4` | read-only |
| `sdlc_security_privacy_reviewer` | `gpt-5.5` | read-only |
| `sdlc_qa_handoff_worker` | `gpt-5.4-mini` | docs/handoff only |
| `sdlc_release_handoff_worker` | `gpt-5.4-mini` | Git/status handoff only; no Git action unless explicitly assigned |
| `sdlc_process_learning_reviewer` | `gpt-5.4-mini` | read-only |
| `sdlc_feedback_reporter` | `gpt-5.4-mini` | feedback draft only |

## MCP Policy

Codex custom agents inherit whatever MCPs the current developer environment exposes. Runtime adapters cannot be treated as hard security controls for per-agent MCP permissions.

Adapters state allowed MCP use:

- AirteraCode MCP read/context use is allowed for context scouts, planners, implementation workers, and reviewers only when the current task permits the repository/context boundary.
- AirteraCode MCP feedback write is parent-mediated. Agents should produce a sanitized feedback draft rather than submit directly.
- Database, ticket, deployment, cloud, and production-like MCPs are blocked unless the orchestrator explicitly grants a read-only packet for that role.
- Tool output is never source of truth over local code, tests, docs, contracts, or human-approved artifacts.

## Feedback Contract

Each agent handoff should include:

```text
SDLC feedback draft:
routeFit:
friction:
caps:
evidenceGaps:
candidateProcessChange:
rawContentIncluded: false
sourcePointers:
```

The parent decides whether to submit it through AirteraCode MCP or local fallback. Feedback is evidence for later process-learning review, not authority to change SDLC rules.

## Validation Plan

Run staged test tasks after installation:

1. Tiny docs-only task: no worker needed; use release/process handoff only if useful.
2. Standard small code task: planner, implementation worker, verification worker, independent reviewer.
3. Legacy/no-test task: context scout, planner, implementation worker, verification worker, QA handoff.
4. High-risk task: add security/privacy reviewer using `gpt-5.5`.
5. Release task: release handoff plus parent-mediated feedback.

Success requires each agent to:

- spawn from Codex,
- respect write/MCP/Git boundaries,
- return the expected handoff shape,
- provide usable feedback drafts,
- avoid raw code/log/ticket/database capture in feedback,
- leave final approval and process mutation with the parent.

## Validation Run

Current pre-commit validation:

```text
git diff --check
node scripts/test-skill-files.mjs
node --check scripts/sdlc/lib/adapters.mjs
node --check scripts/sdlc/lib/cli.mjs
python tomllib parse for tracked and installed Codex adapters
sdlc agents install-codex --frontier --target /private/tmp/sdlc-codex-agent-install-test
sdlc agents install-codex --frontier --include-local --target /private/tmp/sdlc-codex-agent-install-test-local
sdlc feedback test --repo .
sdlc feedback validate --repo .
control-character scan over README.md, SUMMARY.md, WORKFLOW.md, and skills/*/SKILL.md
```

Observed:

- Frontier install helper installs 11 hosted frontier adapters by default.
- `--include-local` explicitly adds the 2 local/LM Studio read-only scout adapters.
- All tracked and installed Codex adapter TOML files parse successfully.
- Existing `sdlc_read_only_code_scout` still spawns and returns valid discovery-smoke JSON.
- Newly installed Cycle 6 agents were present under `~/.codex/agents/`, but the current Codex session returned `unknown agent_type 'sdlc_context_scout'`.

Cap:

```text
Reload or restart Codex/VS Code before validating runtime discovery for newly installed Cycle 6 agents.
```

Post-restart validation:

- Codex tool discovery listed all 11 hosted frontier SDLC agents after restart.
- Spawned and validated `sdlc_context_scout`, `sdlc_implementation_planner`, `sdlc_verification_worker`, `sdlc_independent_reviewer`, `sdlc_security_privacy_reviewer`, `sdlc_qa_handoff_worker`, `sdlc_release_handoff_worker`, `sdlc_process_learning_reviewer`, and `sdlc_feedback_reporter`.
- Spawned `sdlc_implementation_worker` with write access limited to `/private/tmp/sdlc-agent-worker-fixture/hello.txt`; it changed only that fixture from `hello old world` to `hello new world` and verified the result.
- Existing `sdlc_read_only_code_scout` had already spawned successfully before restart.
- LM Studio was off, so `sdlc_local_read_only_code_scout` and `sdlc_lmstudio_read_only_code_scout` were intentionally not tested in this run.

Findings:

- Runtime discovery requires a Codex restart or reload after installing new custom-agent files.
- The verification smoke acknowledged the role but did not produce the requested feedback draft; the verification worker contract now requires a sanitized feedback draft when friction, caps, skipped evidence, or tool/runtime issues appear.
- QA handoff generation needs a tester entry path or explicit fallback reason; the QA handoff role now names that context field.
- Independent review found missing Codex adapter mappings for `release-handoff-worker` and `process-learning-reviewer`; the agent catalog now includes both mappings.
- Security review confirmed Codex custom-agent MCP access is inherited from the parent developer environment, so parent prompts must state allowed MCP/tool scope explicitly.
