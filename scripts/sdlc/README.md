# SDLC CLI

Small dependency-free helper for repetitive SDLC mechanics.

The CLI is an affordance over the Markdown SDLC. It does not replace agent judgment, source review, human approval gates, or route-specific skill guidance.

## Normal use

Use chat first. These helpers are optional; direct commands and a concise evidence report are sufficient when no persistent run is needed.

```bash
sdlc start --task "fix README typo" --files README.md
sdlc run-check --task "fix README typo" --name diff --criterion ac-1 -- git diff --check
sdlc prove --task "fix README typo"
sdlc finish-ready --task "fix README typo"
```

Inspect the actual text/diff as well; a whitespace check alone does not establish semantic correctness. Use `sdlc next` for guidance and `sdlc qa-ready` only when a QA handoff is needed. Specialist commands below remain optional.

Named tasks share one run directory between journals, checks, and readiness. Keep `.ai-local/` ignored before using persistent helpers. Explicit `--task-id` selects a separate run. Evidence cannot be reused for another task; use a distinct task ID if normalized task names collide.

`run-check` captures command output, status, criterion, task, and a working-tree revision. It returns nonzero for failure, unavailable tools, and caps. `prove`, `finish-ready`, and the compatibility `final gate` use passing current evidence. An old record without revision information cannot prove freshness. A cap describes partial work, not a pass; a waiver cannot make missing verification pass.

For observable behavior, record its compact closure directly:

```bash
sdlc evidence add --task "<task>" --kind experience-impact --summary "<closure>" --outcome "<observable result>" --connected-impact "<material consumer or recovery>" --proof "<specific checks>"
```

The closure does not replace criterion-specific test, rendered, or manual evidence. `--criterion ac-1` links a check to a criterion but cannot turn a generic build into behavior proof. Use `run-check --manual "<observed result>"` for actual manual inspection and `--cap "<reason>"` when evidence is unavailable. Existing contract and packet commands remain usable for detailed work; packet presence alone never grants readiness.

Evidence freshness is checked locally without hooks or network access. The current conservative revision covers repository inputs, so changing inputs after a check invalidates proof. Update or rerun only the evidence the changed inputs affect; legacy completion packets may need fresh direct evidence recorded once.

Apply existing authorization to requested Git or external actions. Readiness is advisory and never grants permission; ask only when authority is missing.

## Windows Setup And Tool Discovery

For Windows, put `.agents\bin` on the user `Path`. The bin folder includes `sdlc.cmd`, which launches the Node helper from `scripts\sdlc\sdlc.mjs`.

Use tool discovery before installing optional accelerators:

```powershell
sdlc tools inventory --repo <path>
sdlc tools setup --repo <path>
```

`tools inventory` records what is available. `tools setup` is recommend-only: it prints missing tools and Windows install hints such as `winget`, `npm install -g`, or `python -m pip install` commands. It must not install software automatically; install commands require human approval and should remain optional accelerators with fallback evidence paths.

## Recovery

When the state is unclear:

```bash
sdlc state current
sdlc state explain
sdlc state blockers
sdlc complete explain --task "<task>"
sdlc task doctor --task "<task>"
sdlc run resume --task "<task>"
```

For setup uncertainty:

```bash
sdlc readiness
sdlc profile audit
sdlc profile suggest --task "<task>"
```

## Task-Shape Recipes

Recipes are advisory overlays. They add proof likely needed for a task shape; they are not mandatory stack flows.

Route replacement:

```bash
sdlc route proof --old "<old route>" --new "<new route>" --task "<task>"
```

Live-system bug:

```bash
sdlc bug live-evidence --task "<task>"
sdlc pattern analog --task "<task>" --hint "<known working path>"
sdlc fix scope --task "<task>"
```

EF Core SQL Server failure:

```bash
sdlc dotnet efcore diagnose --task "<task>"
```

Weak/no-test legacy work:

```bash
sdlc test regression-plan --task "<task>"
sdlc test bootstrap-plan --unit <unit> --framework dotnet|node|deno|generic
```

Command/tooling failure:

```bash
sdlc command classify --command "<command>" --status <code> --stderr "<stderr>"
```

Context or learning placement:

```bash
sdlc context bucket-confidence --path <path> --task "<task>"
sdlc context final-check --task "<task>"
sdlc learn split --packet <learning-packet>
```

Passive SDLC feedback:

```bash
sdlc feedback add --task "<task>" --source "<file-or-artifact>" --route standard --route-fit right-sized --friction "<sanitized friction>" --suggested-action "review if repeated"
sdlc feedback validate
sdlc feedback export --out .ai-local/sdlc-cache/sdlc-feedback-export.json
```

Use passive feedback for process-improvement signals from real work. Keep it sanitized: source pointers and summaries are allowed; raw code, diffs, ticket text, logs, database output, secrets, and full prompt/chat transcripts are not.

Ticket-driven work:

```bash
sdlc ticket evidence --task "<task>"
sdlc ticket drift --task "<task>"
sdlc ticket update-preview --task "<task>"
```

Read-only database evidence:

```bash
sdlc data boundary --task "<task>"
sdlc data query-plan --task "<task>"
sdlc data evidence --task "<task>"
```

These helpers are capability-aware overlays. They do not require YouTrack or database MCP access, do not execute database queries, and do not post ticket updates. When MCPs are unavailable, use pasted ticket details or sanitized human-provided data/log evidence.

Deterministic control plane:

```bash
sdlc state init --task "<task>"
sdlc evidence required --task "<task>"
sdlc run-check --name test -- <command>
sdlc evidence status --task "<task>"
sdlc complete check --task "<task>"
sdlc scope check --task "<task>"
sdlc policy check --task "<task>"
sdlc tools status --task "<task>"
sdlc learn suggest --task "<task>"
```

Use this control plane to take repeatable process facts out of the language model. The agent still interprets product intent and code, but the CLI records state, evidence, command results, gates, waivers, policy boundaries, and next actions.

Interactive/stateful feature work:

```bash
sdlc interaction packet --task "<task>"
sdlc validate ladder --task "<task>"
sdlc qa interactive --task "<task>"
```

Fixture validation where useful changes are kept:

```bash
sdlc fixture plan --task "<task>"
sdlc finish packet --task "<task>" --intent keep-change
sdlc learn from-run --task "<task>"
```

`sdlc fixture plan` resolves validation targets from current-repository checks and dry-run packets first, optional `.ai-local` profile configuration second, and developer-approved disposable fixture/workspace repos third.

## Lower-Level Helpers

Use `sdlc --help` for the full command reference. Most commands are lower-level helpers for agents and process maintainers, not commands a developer should run by hand during normal work.

Maintenance examples:

```bash
sdlc scenario test
sdlc recipe list
sdlc recipe review --since YYYY-MM-DD
sdlc eval retrieval-run --repo .
sdlc eval retrieval-test --repo .
sdlc calibrate pilot-report --inputs "repo-a/.ai-local/sdlc-calibration.jsonl,repo-b/.ai-local/sdlc-calibration.jsonl" --repo .
sdlc calibrate pilot-test --repo .
sdlc feedback test --repo .
sdlc feedback validate --repo .
sdlc learn candidate-drift --repo .
sdlc learn candidate-test --repo .
sdlc models revalidate --repo .
sdlc trace export --trace .ai-local/sdlc-runs/<trace>.jsonl --format otel-lite
sdlc learn backlog
```

## Human QA

`sdlc qa script` generates Markdown manual QA scripts for human testers and YouTrack paste-in. It does not assume QA testers use AI, inspect code, run developer commands, or know the SDLC.

## Global-Local Configuration And Context Budgeting

The SDLC is intended to be installed globally under the user `.agents` folder, then made specific through repository/workspace configuration and local artifacts.

Recommended local-first flow:

```bash
sdlc config normalize
sdlc config validate
sdlc capability snapshot
sdlc context budget --task "..."
sdlc context assemble --phase planning --task "..."
sdlc recipe compile --task "..."
sdlc evidence plan --task "..."
sdlc checks plan
sdlc agents scout-packet --task "..." --scope <path> --language-profile generic --task-type context-summary
```

Key commands added for the global-local model:

- `sdlc config normalize|validate|explain|diff|export|import`: create and review a machine-readable local repository profile.
- `sdlc workspace graph|impact`: summarize multi-repo and multi-project topology for the current task.
- `sdlc unit list|resolve|context`: map files and units to testing surfaces and context buckets.
- `sdlc capability snapshot|doctor|fallback`: record optional tool/MCP/browser/database/ticket capabilities without making them mandatory.
- `sdlc recipe compile|explain` and `sdlc evidence plan`: turn task/route/profile signals into deterministic evidence requirements.
- `sdlc checks plan|run|doctor`: normalize configured build/test/lint checks and capture evidence locally.
- `sdlc index build|query`: build a deterministic local metadata index without requiring RAG or vectors.
- `sdlc context budget|assemble|compact|ledger`: manage prompt context size through phase-specific context packets.
- `sdlc qa build|validate`: produce and structurally validate human-followable Markdown QA scripts.
- `sdlc policy list|validate-config|simulate`: explain high-impact action policy before the agent attempts it.
- `sdlc adapter generate`: generate runtime-specific usage guidance for Augment, Auggie, Codex, Claude, or generic agents.
- `sdlc dashboard`: produce a compact local status artifact.
- `sdlc eval run|add-case|report`: regression-test SDLC routing and evidence behavior.
- `sdlc eval retrieval-add|retrieval-run|retrieval-report|retrieval-test`: build and regression-test the Cycle 3 deterministic retrieval floor and report pointer-quality metrics without adding retrieval infrastructure.
- `sdlc agents scout-packet|scout-validate`: generate and validate read-only code scout packets for bounded lower-tier/local-model discovery without granting edit authority.
- `sdlc calibrate add`: accepts Cycle 4 pilot fields such as `--repository-id`, `--task`, `--treatment baseline|treatment`, `--manual-action-count`, `--estimated-minutes`, `--token-turn-signal`, `--evidence-gap`, `--helper-reducible`, `--accepted-counterpoint-findings`, and `--semantic-tail-questions`.
- `sdlc calibrate pilot-report|pilot-test`: aggregate targeted Cycle 4 baseline/treatment rows, cap `.agents`-only evidence, and avoid claiming token savings without token/turn signals. This is research/debug plumbing, not the normal improvement loop.
- `sdlc feedback add|validate|export|test`: capture sanitized Cycle 4A passive SDLC feedback in `.ai-local/sdlc-cache/sdlc-feedback.jsonl` when AirteraCode MCP `sdlc_feedback` is unavailable.
- `sdlc learn export|import`: move sanitized learning candidates between environments.
- `sdlc learn candidate-add|candidate-validate|candidate-export`: capture source-linked knowledge candidates under ignored `.ai-local/sdlc-cache/knowledge-candidates.jsonl` and export them for MCP review without making them source of truth. Existing local file anchors include `sha256` for later drift checks.
- `sdlc learn candidate-drift|candidate-test`: report and regression-test invalid, missing-anchor, time-expired, sensitive, or hash-mismatched knowledge candidates without promoting them.
- `sdlc models revalidate`: report model/profile fields that need role-specific smoke evidence before routing decisions.
- `sdlc upgrade plan|apply|explain`: update local SDLC artifacts without merging, deploying, or overwriting team configuration.

Context rule: durable state lives in local files; prompts should receive the smallest useful phase packet. Prefer `sdlc context assemble --phase <phase>` over copying full strategy docs, archived plans, raw logs, or unrelated repository memory into the model.

Evidence also binds to the selected or stored contract contents. Pass the same
`--contract`, `--task-id`, and `--out-root` when capturing and checking evidence.
Changing a contract requires fresh proof. Task start captures pre-existing dirty
file contents; subsequent edits expand the effective scope. Missing historical
baselines are treated conservatively. These checks validate recorded provenance
and coverage; they do not independently establish that a manual claim is true.
