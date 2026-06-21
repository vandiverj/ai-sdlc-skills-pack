# Cycle 5a Clean-Chat Handoff

Date: 2026-06-20
Purpose: resume Cycle 5a/Cycle 5 work in a fresh chat without re-deriving the subagent and LM Studio routing results.

## Current State

Cycle 5a corrected the Cycle 5 subagent direction:

- Use Codex-native custom agents for hosted/lower-tier scout work when available.
- Use `codex exec --oss --local-provider lmstudio` as the proven LM Studio runner.
- Keep packet generation and validation as the evidence contract:
  - `sdlc agents scout-packet`
  - `sdlc agents scout-validate`

Active user-level Codex agent files are installed under:

```text
~/.codex/agents/sdlc-read-only-code-scout.toml
~/.codex/agents/sdlc-local-read-only-code-scout.toml
~/.codex/agents/sdlc-lmstudio-read-only-code-scout.toml
```

Reusable templates are in:

```text
templates/adapters/codex/sdlc-read-only-code-scout.toml
templates/adapters/codex/sdlc-local-read-only-code-scout.toml
templates/adapters/codex/sdlc-lmstudio-read-only-code-scout.toml
```

## Proven

Hosted custom agents:

- `sdlc_read_only_code_scout` spawns after user-level install and Codex/VS Code restart.
- `sdlc_local_read_only_code_scout` also spawns.
- `sdlc_read_only_code_scout` returned a no-finding packet with reviewed `sourcePointers`.
- `sdlc agents scout-validate --repo . --packet /private/tmp/cycle5a-custom-scout-findings-v2.json` passed.

Built-in native control:

- Built-in `explorer` subagent returned valid scout findings JSON for the same Cycle 5 packet.
- `sdlc agents scout-validate --repo . --packet /private/tmp/cycle5a-native-explorer-scout-findings.json` passed.

LM Studio through Codex CLI:

- `codex exec --oss --local-provider lmstudio -m google/gemma-4-26b-a4b-qat:2` successfully ran the read-only scout prompt.
- The raw `--output-last-message` was fenced markdown, not raw JSON.
- After stripping fences, `sdlc agents scout-validate --repo . --packet /private/tmp/cycle5a-codex-cli-oss-lmstudio-scout.extracted.json` passed.
- The CLI run reported 17,538 tokens used.

Feedback capture:

- Local `sdlc_feedback` events are valid.
- AirteraCode MCP feedback was recorded for the major Cycle 5a test results.

## Not Proven / Current Caps

- `sdlc_lmstudio_read_only_code_scout` is installed, but hosted parent sessions cannot spawn it.
- The same `agent type is currently not available` result was observed from:
  - VS Code extension,
  - Codex app,
  - normal hosted Codex CLI parent session launched with `codex`.
- Treat hosted-parent-to-OSS/LM Studio custom subagent spawning as unavailable in the tested surfaces.
- Direct LM Studio scout work should use `codex exec --oss --local-provider lmstudio` for now.
- No downstream non-`.agents` task has proven scout usefulness or cost savings yet.
- The LM Studio/Gemma CLI scout produced valid output after cleanup, but first-pass output formatting still needs validation or fence stripping.

## Key Files Changed Or Added

Core docs:

```text
docs/process-improvement/codex-local-model-sdlc-overview.md
docs/process-improvement/cycle-5-read-only-code-scout-subagent-pilot.md
docs/process-improvement/cycle-5-implementation-report.md
docs/process-improvement/cycle-5a-codex-native-subagent-adapters.md
```

Adapter templates:

```text
templates/adapters/codex/sdlc-read-only-code-scout.toml
templates/adapters/codex/sdlc-local-read-only-code-scout.toml
templates/adapters/codex/sdlc-lmstudio-read-only-code-scout.toml
```

Setup/runtime guidance:

```text
skills/agents/references/bounded-agent-catalog.md
skills/agents/references/runtime-adapter-rules.md
skills/setup-sdlc-in-repo/SKILL.md
templates/docs/agents/runtime-adapters.md
```

Earlier Cycle 5 fixes still in the same working tree:

```text
scripts/sdlc/lib/agentpackets.mjs
scripts/sdlc/lib/sdlcfeedback.mjs
templates/schemas/sdlc-feedback.schema.json
templates/schemas/sdlc-read-only-code-scout-findings.schema.json
```

## Validation Already Run

Latest relevant checks passed:

```bash
git diff --check
node scripts/test-skill-files.mjs
rg -n -P "[\x00-\x08\x0B\x0C\x0E-\x1F]" README.md SUMMARY.md WORKFLOW.md skills/*/SKILL.md
node scripts/sdlc/sdlc.mjs feedback validate --repo .
node scripts/sdlc/sdlc.mjs agents scout-validate --repo . --packet /private/tmp/cycle5a-custom-scout-findings-v2.json
node scripts/sdlc/sdlc.mjs agents scout-validate --repo . --packet /private/tmp/cycle5a-codex-cli-oss-lmstudio-scout.extracted.json
```

The control-character scan returns exit code 1 when clean because it finds no matches.

## Recommended Next Step

Use a real downstream repository task to test whether the scout is useful, not just valid.

Good next test:

```text
Use sdlc_read_only_code_scout on a low-risk cleanup task in www_dev or another non-.agents repo. Ask it to inspect a bounded file/folder for one of: duplication-scan, extraction-candidate-scan, abandoned-code-scan, or risk-surface-scan. Validate its returned packet, then accept/reject findings after source verification.
```

For LM Studio comparison:

```bash
codex exec --oss --local-provider lmstudio \
  -m google/gemma-4-26b-a4b-qat:2 \
  -C <repo-path> \
  --sandbox read-only \
  --skip-git-repo-check \
  --output-last-message /private/tmp/<task>-lmstudio-scout.json \
  '<read-only scout prompt using generated packet>'
```

Then strip markdown fences if present and run:

```bash
node ~/.agents/scripts/sdlc/sdlc.mjs agents scout-validate --repo <repo-path> --packet /private/tmp/<task>-lmstudio-scout.extracted.json
```

## Suggested Fresh-Chat Prompt

```text
We are in /Users/jerrickvandiver/.agents on branch CodexSdlc. Continue Cycle 5a from docs/process-improvement/cycle-5a-clean-chat-handoff.md. First read that handoff, then inspect git status. The goal is to finish/validate the current Cycle 5a changes, then decide whether to commit or run a downstream non-.agents scout test. Do not re-litigate the LM Studio custom subagent issue unless new evidence appears: hosted parent sessions cannot spawn sdlc_lmstudio_read_only_code_scout; the proven LM Studio path is codex exec --oss --local-provider lmstudio.
```

## Commit Readiness

Before committing, rerun:

```bash
git diff --check
node scripts/test-skill-files.mjs
rg -n -P "[\x00-\x08\x0B\x0C\x0E-\x1F]" README.md SUMMARY.md WORKFLOW.md skills/*/SKILL.md
node scripts/sdlc/sdlc.mjs feedback validate --repo .
git status --short
```

Do not commit the user-level `~/.codex/agents/*` files directly; only the reusable templates under `templates/adapters/codex/` are tracked in this repo.
