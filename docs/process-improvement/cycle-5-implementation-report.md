# Cycle 5 Implementation Report

Date: 2026-06-20
Status: Read-only code scout packet generator, findings validator, manual fallback pilot, LM Studio runtime pilot, Codex CLI local-model smoke test, bounded LM Studio scout task, and Codex-native adapter correction completed
Plan: [cycle-5-read-only-code-scout-subagent-pilot.md](cycle-5-read-only-code-scout-subagent-pilot.md)

## Implemented

- Added portable `read-only-code-scout` role definition.
- Added scout request schema: `sdlc.read_only_code_scout.request.v1`.
- Added scout findings schema: `sdlc.read_only_code_scout.findings.v1`.
- Added `sdlc agents scout-packet`.
- Added `sdlc agents scout-validate`.
- Updated CLI help and README.
- Updated the downstream agent catalog template so new repos can include the generic scout role.
- Ran Slice 4 manual fallback pilot with source-linked scout findings.
- Ran LM Studio runtime pilots against `google/gemma-4-26b-a4b-qat` and `google/gemma-4-26b-a4b-qat:2`.
- Verified Codex CLI can call LM Studio through both the default localhost `lmstudio` provider and a custom `lmstudio-lan` Responses provider.
- Ran a real bounded read-only scout task through Codex CLI + LM Studio and validated the corrected findings packet.
- Attempted an approved `gpt-5.3-codex-spark` lower-tier frontier scout sub-session, but execution policy blocked private workspace disclosure to the external model provider even after explicit user approval.
- Fixed scout findings and SDLC feedback schemas so forbidden-field `not.anyOf` branches include explicit `type: "object"` for Codex/OpenAI structured-output compatibility.
- Added Codex-native custom-agent adapter templates for hosted and local-provider read-only scouts.
- Installed the Codex-native custom-agent adapters under user-level `~/.codex/agents/` for reusable cross-repo use.
- Added a direct LM Studio-pinned scout adapter: `sdlc_lmstudio_read_only_code_scout`.
- Removed the project-scoped `.agents/.codex/agents/` fixture copies so downstream repos do not need per-repo SDLC agent setup by default.
- Updated setup and agent runtime-adapter guidance so user-level `~/.codex/agents/*.toml` is the preferred reusable Codex subagent adapter path where available, while project `.codex/agents/*.toml` is reserved for overrides and `codex exec` remains a noninteractive smoke-test/fallback harness.
- Ran a built-in Codex `explorer` subagent as a native-control scout test with the same Cycle 5 packet and validated its returned findings packet.
- Fixed a validator false positive where a finding summary that described read-only boundaries was treated as a forbidden edit claim.
- Fixed `sdlc feedback validate` so multi-line JSONL logs fall back to line-by-line parsing instead of being parsed as one JSON object.
- Fixed the generated `Required Findings JSON` example so no-finding packets include reviewed `sourcePointers` and match the tightened validator contract.
- Kept runtime invocation, local model calls, and write-capable subagents out of scope.

## Validation

Commands run:

```bash
node --check scripts/sdlc/lib/agentpackets.mjs
node scripts/sdlc/sdlc.mjs agents scout-packet --repo . --task "Cycle 5 scout smoke" --scope "scripts/sdlc/lib/agentpackets.mjs" --language-profile generic --task-type context-summary --json
node scripts/sdlc/sdlc.mjs agents scout-packet --repo . --task "Cycle 5 scout smoke" --scope "scripts/sdlc/lib/agentpackets.mjs" --language-profile generic --task-type context-summary --out .ai-local/sdlc-cache/scout-packet-smoke.md
node scripts/sdlc/sdlc.mjs agents scout-validate --repo . --packet /private/tmp/scout-findings-valid.json
node scripts/sdlc/sdlc.mjs agents scout-packet --repo . --task "Cycle 5 manual scout pilot on read-only-code-scout implementation" --scope "scripts/sdlc/lib/agentpackets.mjs,agents/read-only-code-scout.md,docs/process-improvement/cycle-5-read-only-code-scout-subagent-pilot.md" --language-profile generic --task-type context-summary --out .ai-local/sdlc-cache/cycle5-manual-scout-packet.md
node scripts/sdlc/sdlc.mjs agents scout-validate --repo . --packet /private/tmp/cycle5-manual-scout-findings.json
node scripts/sdlc/sdlc.mjs feedback add --repo . --task "Cycle 5 manual scout pilot" --source "docs/process-improvement/cycle-5-read-only-code-scout-subagent-pilot.md,scripts/sdlc/lib/agentpackets.mjs,agents/read-only-code-scout.md" --route standard --route-fit right-sized --friction "manual fallback scout validated packet workflow; no independent runtime invoked" --caps "manual fallback only,no local model invocation,no independent subagent process" --evidence-gap "runtime model savings not measured" --suggested-action "decide first approved runtime invocation path for read-only-code-scout"
node scripts/sdlc/sdlc.mjs feedback validate --repo .
curl -sS http://192.168.137.171:1234/v1/models
curl -sS http://192.168.137.171:1234/v1/chat/completions -H 'Content-Type: application/json' -d @/private/tmp/lmstudio-scout-request-text.json -o /private/tmp/lmstudio-scout-response.json
node scripts/sdlc/sdlc.mjs agents scout-validate --repo . --packet /private/tmp/lmstudio-scout-findings.json
curl -sS http://192.168.137.171:1234/v1/chat/completions -H 'Content-Type: application/json' -d @/private/tmp/lmstudio-scout-request-v2.json -o /private/tmp/lmstudio-scout-response-v2.json
node scripts/sdlc/sdlc.mjs agents scout-validate --repo . --packet /private/tmp/lmstudio-scout-findings-v2.json
codex exec -m google/gemma-4-26b-a4b-qat:2 -C /Users/jerrickvandiver/.agents --sandbox read-only --skip-git-repo-check -c 'model_provider="lmstudio-lan"' -c 'model_providers.lmstudio-lan={name="LM Studio LAN", base_url="http://192.168.137.171:1234/v1", wire_api="responses"}' --output-last-message /private/tmp/codex-lmstudio-smoke.txt 'Return only this exact JSON object: {"ok":true,"runtime":"codex-cli-lmstudio"}'
codex exec --oss --local-provider lmstudio -m google/gemma-4-26b-a4b-qat:2 -C /Users/jerrickvandiver/.agents --sandbox read-only --skip-git-repo-check --output-last-message /private/tmp/codex-lmstudio-default-smoke.txt 'Return only this exact JSON object: {"ok":true,"runtime":"codex-cli-default-lmstudio"}'
node scripts/sdlc/sdlc.mjs agents scout-packet --repo . --task "Cycle 5 real scout runtime comparison" --scope "scripts/sdlc/lib/agentpackets.mjs,scripts/sdlc/lib/sdlcfeedback.mjs,agents/read-only-code-scout.md" --language-profile node --task-type risk-surface-scan --out .ai-local/sdlc-cache/cycle5-real-scout-runtime-comparison.md
codex exec --oss --local-provider lmstudio -m google/gemma-4-26b-a4b-qat:2 -C /Users/jerrickvandiver/.agents --sandbox read-only --skip-git-repo-check --output-last-message /private/tmp/cycle5-lmstudio-scout-findings.json '<read-only scout packet prompt>'
node scripts/sdlc/sdlc.mjs agents scout-validate --repo . --packet /private/tmp/cycle5-lmstudio-scout-findings.json
codex exec --oss --local-provider lmstudio -m google/gemma-4-26b-a4b-qat:2 -C /Users/jerrickvandiver/.agents --sandbox read-only --skip-git-repo-check --output-last-message /private/tmp/cycle5-lmstudio-scout-findings-retry.json '<contract repair prompt>'
node scripts/sdlc/sdlc.mjs agents scout-validate --repo . --packet /private/tmp/cycle5-lmstudio-scout-findings-retry.json
codex exec -m gpt-5.3-codex-spark -C /Users/jerrickvandiver/.agents --sandbox read-only --skip-git-repo-check --output-schema templates/schemas/sdlc-read-only-code-scout-findings.schema.json --output-last-message /private/tmp/cycle5-frontier-scout-findings.json '<read-only scout packet prompt>'
node -e "for (const f of ['templates/schemas/sdlc-read-only-code-scout-request.schema.json','templates/schemas/sdlc-read-only-code-scout-findings.schema.json','templates/schemas/sdlc-feedback.schema.json']) { JSON.parse(require('fs').readFileSync(f,'utf8')); }"
node scripts/sdlc/sdlc.mjs agents scout-validate --repo . --packet /private/tmp/cycle5a-native-explorer-scout-findings.json
git diff --check
node scripts/test-skill-files.mjs
rg -n -P "[\x00-\x08\x0B\x0C\x0E-\x1F]" README.md SUMMARY.md WORKFLOW.md skills/*/SKILL.md
```

Observed result:

- Scout request JSON generated successfully.
- Scout Markdown packet generated successfully.
- Synthetic findings packet validated successfully.
- Manual fallback findings packet validated successfully.
- `sdlc_feedback` recorded the manual fallback pilot with caps for no local model invocation and no independent subagent process.
- Local feedback JSONL validation passed with 2 valid events and 0 invalid events after fixing multi-line JSONL parsing.
- LM Studio model discovery succeeded for `google/gemma-4-26b-a4b-qat`.
- First full scout prompt consumed completion budget as reasoning tokens and returned no visible content.
- Plain JSON retry returned visible JSON but failed local scout validation because required top-level `sourcePointers` and finding `summary` were missing.
- LM Studio `json_schema` structured-output retries failed in the backend with an LLGuidance unsupported-key error.
- A later plain JSON prompt against `google/gemma-4-26b-a4b-qat:2` produced a valid scout findings packet that passed `sdlc agents scout-validate`.
- Codex CLI successfully called `google/gemma-4-26b-a4b-qat:2` through a custom `lmstudio-lan` provider using `wire_api="responses"` and returned the expected smoke-test JSON.
- After LM Studio was configured to listen on localhost, Codex CLI also successfully called `google/gemma-4-26b-a4b-qat:2` through the built-in `--oss --local-provider lmstudio` path and returned the expected smoke-test JSON.
- A custom provider with `wire_api="chat"` was rejected by Codex CLI 0.139.0; custom providers require `wire_api="responses"`.
- Real bounded LM Studio scout task generated a packet, but the first returned findings failed contract validation because findings used `description` instead of `summary` and top-level `sourcePointers` were objects instead of strings.
- A corrective LM Studio retry returned a valid-looking findings packet and passed `sdlc agents scout-validate`.
- The LM Studio retry finding pointed at `scripts/sdlc/lib/sdlcfeedback.mjs:220`; orchestrator verification found the pointer exists, but the finding is weak because parse-error sentinel rows are already reported as invalid feedback rows by the validator.
- The `gpt-5.3-codex-spark` frontier scout sub-session was blocked before execution by policy because it would disclose private workspace contents to an external model provider. A retry after explicit informed user approval was also blocked; this environment should treat external frontier scout sub-sessions over private workspace content as unavailable, not merely approval-gated.
- User-run `gpt-5.3-codex-spark` scout from a local terminal started successfully but failed with `invalid_json_schema` because the findings schema used `not.anyOf` branches without explicit `type` keys. The schema was updated to include `type: "object"` in those branches.
- Schema JSON files parsed successfully.
- Required repo checks passed; control-character scan found no matches.
- User-level Codex adapter files were installed under `~/.codex/agents/`.
- A user-level LM Studio-pinned Codex adapter was added for `google/gemma-4-26b-a4b-qat:2`.
- The currently exposed subagent tool rejected `sdlc_read_only_code_scout` as an unknown custom agent type, so this surface does not prove custom Codex agent discovery.
- A built-in `explorer` subagent using `gpt-5.3-codex-spark` returned valid scout findings JSON for the same packet, and `sdlc agents scout-validate` passed.
- After moving adapters to `~/.codex/agents/` and restarting VS Code, both custom agent names were discoverable by the subagent tool.
- The first `sdlc_read_only_code_scout` run returned schema-shaped JSON but failed local validation because `sourcePointers` was empty when `findings` was empty.
- The adapter templates were updated to require reviewed source pointers even for no-finding packets.
- `sdlc_local_read_only_code_scout` accepted a discovery smoke test and returned the expected JSON.
- A second `sdlc_read_only_code_scout` run returned reviewed source pointers and passed `sdlc agents scout-validate`.
- `sdlc_lmstudio_read_only_code_scout` was installed under `~/.codex/agents/` with LM Studio provider/model settings.
- The running session did not discover the newly added LM Studio-pinned custom agent immediately; it likely needs the same Codex/VS Code restart that was required for the first user-level agent install.
- After restarting only the Codex extension, spawning `sdlc_lmstudio_read_only_code_scout` returned `agent type is currently not available`, so this surface still cannot launch the LM Studio-pinned custom agent from the existing hosted session.
- After a full VS Code restart, `sdlc_lmstudio_read_only_code_scout` still returned `agent type is currently not available`; direct OSS/LM Studio provider-pinned custom agents should be treated as unavailable in this hosted extension surface.
- A normal hosted Codex CLI parent session launched with `codex` also returned `agent type is currently not available` for `sdlc_lmstudio_read_only_code_scout`; hosted-parent-to-OSS-provider custom subagents are unavailable in the tested IDE, app, and CLI surfaces.
- `codex exec --oss --local-provider lmstudio -m google/gemma-4-26b-a4b-qat:2` successfully ran the read-only scout prompt from the CLI and completed against LM Studio.
- The raw `--output-last-message` file contained fenced `json` markdown rather than plain JSON; after extracting the JSON body, `sdlc agents scout-validate` passed.
- The CLI run reported 17,538 tokens used and returned a no-finding packet with reviewed source pointers.
- The built-in explorer's path-boundary findings were reviewed. They are not immediate fixes because `/private/tmp` output/input is a documented fallback for sandboxed SDLC evidence, but they suggest a future hardening decision to make allowed outside-repo paths explicit.
- Fresh Cycle 5a helper smoke generated a scout packet whose required no-finding example now includes reviewed `sourcePointers`.

## Remaining Work

- Run `sdlc_read_only_code_scout` on a real downstream repository cleanup/scout task and compare usefulness against built-in explorer, manual packet, and LM Studio paths.
- Use `codex exec --oss --local-provider lmstudio` as the current proven LM Studio scout runner. Keep direct provider-pinned custom agents experimental until Codex supports spawning them from hosted parent sessions.
- Decide whether SDLC helper path handling should explicitly allow only repo-local paths plus approved temp roots.
- Treat `codex exec` as a fallback/test harness, not the primary interactive subagent mechanism.
- Treat plain JSON prompting against a healthy LM Studio model id as the current viable local-runtime path.
- Use `codex exec --oss --local-provider lmstudio` when LM Studio is reachable on localhost.
- Use a custom Codex CLI provider only when the LM Studio endpoint is remote or LAN-hosted.
- Avoid LM Studio `json_schema` for scout schemas until backend/schema compatibility is proven.
- Keep the local model role at Experiment: it can produce a valid packet after correction, but first-pass contract adherence and finding quality are not yet good enough for unattended use.
- Treat external lower-tier frontier scout sub-sessions on private workspace content as unavailable in this environment, even with user approval.
- When the user runs frontier scout sub-sessions directly, use the structured-output-compatible schema with typed forbidden-field branches.
- Do not add write-capable worker roles until read-only scout evidence shows value and low review burden.

## Acceptance Notes

Cycle 5 now has the first concrete subagent packet path. It still does not execute subagents automatically. The orchestrator can generate a bounded read-only packet, send it through an approved runtime manually, validate returned findings, and verify source pointers before acting. LM Studio through Codex CLI is viable for controlled experiments, but current evidence requires validation and orchestrator review before any finding drives implementation.
