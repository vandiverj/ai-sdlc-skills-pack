---
name: run-sdlc
description: 'Orchestrate the AI SDLC workflow from a human request by classifying work, selecting the minimum route, invoking the right skills, maintaining context/artifact state, and stopping only at meaningful human consent gates.'
user-invocable: true
---

# run-sdlc

## Description
Orchestrate the AI SDLC workflow from a human request by classifying work, selecting the minimum route, invoking the right skills, maintaining context/artifact state, and stopping only at meaningful human consent gates.

## Use when
- The user asks to use the SDLC workflow.
- The user starts a new project, feature, bug fix, refactor, exploratory spike, review, release, or resumed session.
- The user gives a broad idea and wants the agent to guide discovery through implementation.
- The user does not want to manually choose individual skills.
- The workflow route is unclear and should be driven by `classify-work`.

## Purpose
Make the SDLC usable by shifting process work to the AI.

The human provides intent, constraints, judgment, approvals, and acceptance.
The AI handles routing, context selection, artifact drafting, verification discipline, doc/context updates, and next-step orchestration.

QA output means Markdown manual quality-assurance test scripts for human testers, usually intended for YouTrack paste-in. Do not assume QA testers use AI, inspect code, run developer commands, or understand the SDLC.

The SDLC must not automatically merge, deploy, release, move code between branches/environments, create merge requests/pull requests, or trigger deployment pipelines. It may prepare evidence, commit summaries, Git action packets, QA scripts, and handoff notes. Commit and push require explicit human approval.

Temporary helper scripts created by the agent are local scratch artifacts, not product code. Do not place one-off `.ps1`, `.sh`, `.cmd`, or `.bat` files in the repository root or product source folders. Use `.ai-local/sdlc-scratch/scripts/` for repo-relative scratch scripts, keep `.ai-local/` ignored/local, and use `sdlc artifact scratch-audit` plus `sdlc artifact scratch-cleanup` to detect and age out stale scratch scripts. Only create a durable repo script when the task explicitly needs project tooling and the file is intentionally reviewed as part of the product diff.

Avoid failed optional-context probes. Do not directly read `docs/memory-bank/*`, `docs/context-state.md`, or other optional durable-context files unless the user names them, project guidance says they exist, or a successful directory/file listing has confirmed them. If using shell discovery for optional docs, make the command tolerate absence, for example by checking the directory before running `find`; an absent optional context directory should be recorded as a cap, not a failed tool call.

Avoid guessed configuration-file probes. Do not directly read framework/config filenames such as `tsconfig.app.json`, `vitest.config.ts`, `playwright.config.ts`, `.eslintrc*`, or similar unless the user names them, package scripts reference them, project guidance names them, or a successful file listing confirms them. If configuration discovery is needed, list the repository root or use package scripts first, then read only confirmed files.

## Core rule
Do not run the whole workflow by default. Run the smallest route that prevents the most likely expensive failure.

Use the route matrix from `classify-work`: Micro, Tiny, Standard, High-risk, Exploratory, Review-only, or Release/handoff. Treat the full SDLC as available capability, not a mandatory ladder.

### Tiny read-only orientation fast path
When the user explicitly asks for read-only orientation, classification, or next-action reporting and names the exact files to inspect:

- classify as Tiny or Micro unless security/data/release/multi-repo triggers are present,
- inspect each named file at most once and do not inspect unnamed files,
- do not run helper CLI commands, verification commands, git commands, browser tools, write/edit tools, or worker/delegation commands,
- do not continue into implementation, QA packets, handoff packets, or broader context restore unless the user explicitly asks,
- report the route, evidence used, caps from the file limit, next action, and stop.

This fast path exists to prevent tiny orientation tasks from loading broad process context, repeatedly reading files, or exposing unnecessary tool/process surfaces.

### Read-only planning and review budgets
For read-only planning, diagnosis, verification-strategy, release-readiness, or handoff tasks, treat the user's explicit caps as hard boundaries. "Do not edit", "do not run commands", "stop before verification", "inspect only", and named-file limits override the normal urge to restore broad context.

Default budgets unless the user asks for broader discovery:

- Tiny orientation: named files only, or at most 2 files.
- Tiny implementation plan: up to 6 relevant files; no local ignored docs unless the task is about SDLC context itself.
- Bug diagnosis: up to 8 relevant source/test files; run no commands unless the user explicitly asks for live verification.
- Verification strategy: up to 8 relevant source/test/UI files; describe commands to run later, but do not run them.
- Release/readiness review: project guidance, package scripts, and changed-files evidence only when command use is explicitly allowed; otherwise list git/test/build/browser evidence as missing.

Before reading beyond the budget, running a shell command, loading ignored local docs, or using helper CLI commands, stop and report the cap plus the smallest next question. Do not spend another model turn trying to improve the plan after enough evidence exists for the requested route.

When a route is read-only or plan-only:

- prefer `read` over `bash`, and never use `edit`/`write`,
- do not run `bash`, `npm`, `git`, dev servers, browser review, helper CLI, file-discovery commands, search commands, or verification commands unless explicitly allowed,
- do not read `.ai-local/`, ignored `docs/`, memory banks, or historical run artifacts unless the task asks for process/context review,
- for implementation-readiness, verification-strategy, and test-strategy routes, prioritize source files, tests, package scripts, and project guidance over durable-context documents. Do not read `docs/memory-bank/`, `docs/context-state.md`, `docs/application-model.md`, archived plans, or other broad context-restoration files unless the user names them, the task is about product/context modeling, or source/test evidence is insufficient and you report the reason before reading them,
- do not load secondary skill bodies such as `release`, `review`, `quality`, or `implementation` unless the user explicitly invoked them or the requested output depends on their exact local wording,
- do not probe guessed filenames. Use files named by the user, files named by already-read project guidance, or obvious active files from a confirmed repo layout; if the needed file is not known, stop and ask for discovery permission instead of trying multiple likely names,
- do not treat common framework names as evidence. Paths such as `src/App.jsx`, `src/App.tsx`, `src/index.ts`, `src/main.tsx`, `src/game/index.ts`, `src/game/state.ts`, `gameLogic.js`, `Scoreboard.jsx`, or `ShotControls.jsx` are guessed unless they were named by the user, project guidance, a directory listing, or a previously-read import,
- do not call `read` on a directory path. If you know only a directory, either use a single explicitly-allowed discovery command or stop and report that file discovery is needed,
- preserve the quality floor while reducing context. A failed `read`, failed search, failed helper command, or missing-file probe in a read-only/plan-only route is a quality regression, not an acceptable optimization cost,
- after any failed local read/tool operation, stop probing alternate filenames or extensions; answer from available evidence and name the missing discovery permission,
- make one evidence plan before reading files: identify the route, the exact files to inspect, the cap, and the reason for each file. Read that set once, then answer from it,
- do not inspect every caller or UI surface just because it might be relevant; pick the minimal representative files and name the remaining uncertainty as a cap,
- finish with route, evidence used, caps, missing evidence, and one next action.

For skill-pack architecture, phase ownership, and future consolidation decisions, use the local reference `references/router-map.md`. Do not load that reference for every normal task; load it when route ownership, skill reachability, or skill-vs-reference-vs-agent placement matters.

For concrete route recipes, use `references/route-recipes.md`. Load it when the agent or SDLC helper CLI needs required context packets, checks, evidence shape, stop gates, or completion criteria for common routes.

Before finalizing a route, apply the security trigger overlay from `classify-work/references/security-route-triggers.md`. The overlay can add gates/evidence or escalate risk without changing the base route name.

When available, the helper CLI in `bin/sdlc` or `scripts/sdlc/sdlc.mjs` should automate mechanical task open/start/current/id/bundle/status/review/checkpoint/ledger/verify/QA/finish decisions, profile, readiness, health, context restore/audit/freshness/contradiction/inventory/place/update plans, context pack, change graph lite, run start/finish, touched-surface ledgers, impact packets, route packet, review packet, release packet, developer verification packets, manual smoke packets, human QA Markdown scripts, final gates, Git action packets, packet completion/status, done checks, multi-repo packets/ledgers/QA scripts, contract packets, data/integration/live-bug packets, rendered evidence, surface/unit detection, safe learning capture/review/promotion, security/tool audit packets, verification, calibration/learned-flow promotion, and handoff tasks. It is an affordance over the SDLC, not a replacement for route judgment, human approval gates, review, or verification interpretation.

Distinguish testing surfaces before selecting rendered evidence. Swagger/OpenAPI-only APIs, backend services, background jobs, imports/exports, data changes, and provider integrations are testable surfaces, but they are not rendered product UI unless a user-facing browser workflow is actually changed. Use `sdlc surface detect` and `sdlc unit detect` when a repository contains multiple projects or when route selection is unclear.

For repositories containing multiple deployable codebases, reason at `workspace -> repository -> deployable/codebase unit -> context bucket`. Prefer the repo-level unit registry in `.ai-local/sdlc-profile.md`; use optional unit-local `.ai-local/sdlc-profile.md` only for high-detail units. Unit mappings should include path, test surface, context bucket, commands, deploy method, and Swagger/OpenAPI hints.

Process learnings may be captured in `.agents/learnings/` only after sanitizing product/client details. Keep portable SDLC lessons separate from product-specific durable facts. Product facts usually belong in repo/unit/shared external context, not the skills pack.

For passive process improvement, prefer the AirteraCode MCP `sdlc_feedback` tool when available. If it is unavailable, use `sdlc feedback add` as the local fallback. Capture only sanitized event metadata, source pointers, evidence summaries, friction, human corrections, route fit, and suggested actions; never include raw code, raw diffs, ticket text, database output, secrets, customer data, or full prompt/chat transcripts.

Optional external evidence MCPs such as YouTrack and read-only database access are capability-aware overlays, not required dependencies. Use them only when profile/runtime policy allows and they materially reduce task uncertainty. If they are unavailable, use pasted ticket context, local code/tests/docs, and human-provided sanitized logs/query results instead. Read-only access still needs data-boundary care because it can expose private tickets, customer data, proprietary schemas, production records, or secrets.

## Helper CLI operating model
Use the CLI as a small set of mechanical helpers, not as a checklist to exhaust.

Default spine for normal work:

```bash
sdlc command plan --task "<human task>"
sdlc contract task --task "<human task>"
sdlc context decision --phase planning --task "<human task>"
sdlc evidence matrix --task "<human task>"
sdlc intake packet --task "<human task>"
sdlc recipe match --task "<human task>"
sdlc run dashboard --task "<human task>"
sdlc task preflight --task "<human task>"
sdlc state init --task "<human task>"
sdlc evidence required --task "<human task>"
```

For a developer-facing short path, prefer:

```bash
sdlc start --task "<human task>"
sdlc next --task "<human task>"
sdlc prove --task "<human task>"
sdlc qa-ready --task "<human task>"
sdlc finish-ready --task "<human task>"
```

`sdlc start` and `sdlc console start` create a canonical task run journal under `.ai-local/sdlc-runs/<task-id>/run.md` and `run.json`. Prefer `sdlc next --task "<human task>"` when deciding what to do next; it should return one primary action, why it matters, the command or prompt to use, affected evidence, any human decision, and a fallback.

For Standard+ work, interrupted work, or work where model context is getting noisy, prefer the operator control surface:

```bash
sdlc operator start --task "<human task>"
sdlc operator next --task "<human task>"
sdlc operator implement-ready --task "<human task>"
sdlc operator verify-ready --task "<human task>"
sdlc operator qa-ready --task "<human task>"
sdlc operator finish-ready --task "<human task>"
```

The operator commands combine prompt analysis, local-first facts, journal state, command recommendations, and evidence readiness into bounded output. Use them to reduce repeated model reasoning, not to bypass judgment or human consent gates.

Use process modes to keep the workflow proportional:

```bash
sdlc mode detect --task "<human task>"
sdlc mode explain --mode legacy
```

Use `quick`, `normal`, `legacy`, `multi-repo`, `ticket`, `fixture`, `sensitive`, or `exploratory` as route modifiers, not replacements for judgment.

The command planner and guide are paved paths, not mandatory golden flows. Use them to reduce visible command clutter. If the agent skips a recommended evidence command or adds a heavier one, explain why in terms of route, risk, surface, or missing proof.

Before spending model context on mechanical discovery, use the local-first control plane for Standard+ work, risky work, cross-repo work, API/data work, no-test work, or rough voice-dictated prompts:

```bash
sdlc route fast-pass --task "<human task>"
sdlc context compile --task "<human task>" --budget 4000
sdlc evidence recommend --task "<human task>"
sdlc tools inventory --repo <repo>
sdlc tools gaps --task "<human task>" --repo <repo>
sdlc tools recommend --task "<human task>" --repo <repo>
sdlc capabilities negotiate --task "<human task>" --repo <repo>
sdlc prompt audit --task "<human task>" --repo <repo>
```

The original human prompt remains authoritative. Prompt cleanup is suggestion-first and must not silently rewrite product terms, ticket IDs, file paths, branch names, code symbols, API names, or user constraints. Use `sdlc prompt compile --phase <phase> --task "<human task>"` or `sdlc prompt compile --role <role> --task "<human task>"` when a bounded paste-ready prompt is useful.

Use `sdlc route fast-pass --task "<human task>"` before spawning subagents for tiny docs/mechanical work. If it returns `eligible: true`, run the listed deterministic checks and skip agent delegation unless new risk appears. Use `sdlc context compile --task "<human task>" --budget <tokens>` when model context is getting large; start with selected context only and load deferred context only for concrete questions. Use `sdlc evidence recommend --task "<human task>"` to choose checks from touched files and surfaces before asking a model to interpret broad uncertainty.

Use `sdlc context project --task "<human task>" --phase <phase>` when prompt context needs to be kept small. It should return a compact projection of high-value artifacts, local facts, and evidence gaps instead of inviting the agent to load every document.

When optimizing token use, measure the whole model-bound budget, not only visible context snippets. A smaller `AGENTS.md`, profile, or hand-written task packet is not an improvement if it increases model requests, total provider payload, repeated session carryover, tool calls, or final-quality repair loops. Prefer deterministic local projection of confirmed facts, but reject prompt/profile changes unless flight evidence shows preserved quality and lower or justified total provider budget.

Do not add feature-specific hand-written prompt packets as a default optimization. They can oversteer the model, increase turns, or hide missing local tooling. Use machine-generated, task-scoped context packets only when they are measured against a baseline with quality-control and prompt-budget comparison evidence.

Before running the first broad final proof, do any obvious same-surface cleanup that an already-read touched diff makes necessary for correctness, reviewability, or visible UI quality. After tests/build/typecheck pass, treat additional cleanup as a bounded reviewability decision, not an open-ended polish phase. Do post-green cleanup only when the stale code, style, docs, or tests would cause correctness risk, failing lint/format/diff checks, visible dead UI in an already-inspected touched surface, reviewer confusion on the product diff, or a user-requested acceptance gap. If cleanup is optional, record it as a follow-up or final note instead of reopening source reads/edits; if cleanup is necessary, batch it once with a precise target and rerun only the smallest verification that can prove it. Once final proof passes and no source edit follows it, do not run more discovery, status, or cleanup tools merely to improve confidence; give the final answer from the recorded evidence.

When a change removes UI branches, constants, or controls that may have related CSS/docs/tests, include the obvious same-surface cleanup in the first implementation pass before the first full green verification. After green verification, do not start CSS-only orphan-selector discovery just because a selector name might remain; only do it when a check fails, an already-read touched diff shows confusing dead style, rendered/manual evidence shows a visible problem, or the user explicitly asked for cleanup.

Use bounded agent handoff packets when they reduce ambiguity, organize verification/review/release/learning work, or support restart:

```bash
sdlc agents plan --task "<human task>"
sdlc agents packet --role verification-worker --task "<human task>"
sdlc agents lint --packet <path>
```

Skip packets for tiny work when they add overhead. Packets are work orders for the current agent/human workflow; they are not autonomous subagents.

Use `sdlc task journal-check --task "<human task>"` when a run feels inconsistent, resumed, or partially migrated. Treat warnings as recovery suggestions unless they affect safety, approval, sensitive data, destructive action, or evidence integrity.

When helping another developer adopt the SDLC, keep the visible workflow simple:

```text
Use SDLC for this task: <task>. Start local-first, preserve my original prompt, gather tool/context facts, verify with local evidence, prepare QA Markdown if needed, and stop before commit or push.
```

The same prompt style should work in Augment, Auggie CLI, Codex, or another coding agent that can see the user-level `.agents` folder. Runtime-specific adapter support is optional; do not assume every developer has the same MCPs, hooks, browser tools, ticket access, or database access.

Resume or recover unclear work with:

```bash
sdlc task doctor --task "<human task>"
sdlc run resume --task "<human task>"
```

Use `sdlc task fast-pass --task "<human task>"` when the work is clearly micro/tiny: one repo, one obvious unit or docs-only scope, no security/data/release trigger, no multi-context ambiguity, and no irreversible action. Fast-pass still needs changed-files awareness, one relevant verification path or explicit cap, and a final confidence block.

At closeout, prefer one finish surface:

```bash
sdlc complete check --task "<human task>"
sdlc finish packet --task "<human task>"
sdlc artifact scratch-audit
sdlc git guard --action commit
sdlc action preview --action commit
```

Only after explicit human approval should Git commands be run. Merge, deploy, release, MR/PR creation, pipeline triggers, and manual file movement remain outside default automation.

## Route-selected helpers
Select helpers by route and recipe. Do not run the full list.

Read-only review or release/handoff:

```bash
sdlc review packet --task "<review task>"
sdlc release packet
```

Common implementation evidence:

```bash
sdlc run-check --name test -- <project test command>
sdlc command recommend --task "<human task>" --phase verify
sdlc command capture --task "<human task>" --phase verify --command "<project command>" --status pass --summary "<short evidence>"
sdlc evidence ledger --task "<human task>"
sdlc evidence confidence --task "<human task>"
sdlc run-check --name build -- <project build command>
sdlc verify ladder --task "<human task>"
sdlc verify run --task "<human task>" --level targeted --command "<project command>"
sdlc touched packet
sdlc impact packet --task "<human task>"
sdlc interaction packet --task "<human task>"
sdlc validate ladder --task "<human task>"
sdlc verify packet --task "<human task>"
sdlc qa script --task "<human task>"
sdlc qa coverage --task "<human task>"
```

Recipe overlays add proof only when the task shape calls for it:

```bash
sdlc route proof --old "<old route>" --new "<new route>" --task "<human task>"
sdlc bug live-evidence --task "<human task>"
sdlc dotnet efcore diagnose --task "<human task>"
sdlc ticket evidence --task "<human task>"
sdlc ticket drift --task "<human task>"
sdlc data query-plan --task "<human task>"
sdlc data evidence --task "<human task>"
sdlc fixture plan --task "<human task>"
sdlc learn from-run --task "<human task>"
sdlc command classify --command "<command>" --status <code> --stderr "<stderr>"
sdlc context bucket-confidence --path <path> --task "<human task>"
sdlc tools status --task "<human task>"
sdlc scope check --task "<human task>"
sdlc policy check --task "<human task>"
```

Use the deterministic control plane when the task is Standard or larger, when work may be interrupted, or when completion evidence matters. `state`, `evidence`, `run-check`, `complete`, `scope`, `tools`, and `policy` commands move repeatable process facts out of model memory. Tiny/Micro work may stay lighter, but still needs changed-files awareness, one verification path or cap, and a final confidence block.

Use optional activity telemetry when the process itself needs evidence: repeated failures, repeated searches, cross-repo work, interrupted sessions, runtime/tool caps, onboarding feedback, or SDLC improvement pilots. Leave it off for tiny work unless the user asks for process capture.

```bash
sdlc activity status
sdlc activity on
sdlc activity start --task "<human task>" --runtime codex
sdlc activity command --task "<human task>" --phase verification --command "<command>" --status pass
sdlc activity cap --task "<human task>" --phase verification --surface browser --reason "<cap>"
sdlc activity summary --task "<human task>"
sdlc activity redundancy --task "<human task>"
sdlc process review --task "<human task>"
```

Activity modes are `off`, `light`, `full`, and `debug`. Repo-local config lives in `.ai-local/sdlc-activity-config.json`. Passive/hook capture must honor `off`; direct activity commands are intentional evidence capture. Never record raw ticket text, production rows, secrets, private URLs, customer data, raw logs, or proprietary code snippets in activity events. Use `debug` only for local troubleshooting and treat summaries as process-improvement evidence, not developer performance scoring.

Done checks are route-specific. Treat open checks as unresolved gates unless the human explicitly accepts the cap. The helper checks evidence shape for review-only, release-push, standard, ui-rendered-review, bugfix-regression, bugfix-live-system, weak-test-legacy, multi-repo-integration, contract-first, and tiny-docs routes; `sdlc complete check` adds control-plane state/evidence/gate validation. Neither replaces source review, human approval, or command interpretation.

Every route, including fast-pass, keeps the quality floor: changed-files awareness, at least one verification path or explicit cap, surface-correct evidence, context placement decision when durable knowledge changed, human QA Markdown when testers are involved, developer-controlled finish, and a final confidence summary that separates proved facts, inferred facts, remaining human judgment, and safe next action.

Use recipe overlays when the task shape calls for specific proof. Recipes are advisory overlays, not a replacement route and not a hardcoded golden flow. Record whether a recipe was accepted, ignored, or capped when it materially affects the task.

- Route replacement: classify active vs archived/generated/dependency references, prove new active callers, prove old active callers are retired, and include route behavior in QA handoff.
- Live-system bug: start from sanitized exact log/error/request evidence, identify the failing table/endpoint/provider behavior, look for an analogous successful path, and prefer the smallest evidence-backed fix.
- EF Core SQL Server failures: use the EF Core diagnostic overlay for FK/relationship failures and SQL Server OUTPUT/trigger metadata drift.
- No-test legacy work: generate a targeted regression or test-bootstrap plan and a human QA handoff rather than pretending broad automated coverage exists.
- Command failures: classify shell/tooling/setup failures separately from system-under-test failures before using command output as evidence.
- Ticket evidence: use YouTrack/ticket MCP only when available and allowed; refresh for drift before closeout; preview but do not post updates without explicit approval.
- Database evidence: plan bounded read-only metadata/aggregate/existence evidence first; redact summaries; never infer permission for writes, migrations, backfills, stored procedure execution, deploy, or release.
- Generated SPA artifact promotion: classify package type and artifact owner, prefer app publish scripts, map build-only apps to host targets through `homepage` or context, preserve host pages/config, clean only stale app-owned generated assets, and verify meaningful host-repo diffs before commit.
- Interactive/stateful features: capture the starting state, action sequence, state changes, feedback/animation, recovery path, and strongest available validation ladder.
- Fixture validation with kept changes: treat useful fixture changes as real product work; verify, review, and prepare commit preview only after explicit finish intent.
- Deterministic completion: record state, required evidence, command results, scope, policy, and waivers locally before claiming done.
- Context saves: run bucket confidence and split product-specific facts from portable process lessons before promoting learnings.

When the developer is unsure where things stand, use `sdlc task doctor --task "<human task>"` and summarize only the current route, recipes, evidence, missing gates, QA readiness, and next decision.

For context, multi-repo, contract, health, and process-improvement work, use the dedicated helpers:

```bash
sdlc context audit
sdlc context update-plan --task "<human task>"
sdlc multi status
sdlc multi packet --task "<human task>"
sdlc contract packet --task "<human task>"
sdlc health
sdlc feedback add --task "<human task>" --source "<file-or-artifact>" --route <route> --route-fit unknown --suggested-action "review if repeated"
sdlc feedback validate
sdlc calibrate inspect
sdlc calibrate propose
```

Prefer `sdlc_feedback` through AirteraCode MCP, or local `sdlc feedback add`, for normal passive SDLC improvement signals. Use `sdlc calibrate` helpers for targeted research or explicit baseline/treatment comparisons.

If a security trigger appears in the context pack or route packet, keep the security overlay in the evidence and stop for any consent gate before acting.

For runtime/tool differences, use adapters as suggestions:

```bash
sdlc adapter profile --runtime augment
sdlc adapter prompt --runtime auggie --task "<human task>"
sdlc adapter limits --runtime codex
sdlc hooks contract --runtime generic
```

Do not assume hooks, MCPs, browser access, ticket access, or database access exist. When they exist, treat them as capability-aware overlays; when they do not, continue with local evidence and human-provided context.

When route behavior itself is being tested or a known failure pattern is relevant, use scenario fixtures:

```bash
sdlc scenario list
sdlc scenario validate <scenario> --task "<human task>"
sdlc scenario test
```

When onboarding another developer or collecting SDLC usability feedback, keep the request plain-language first and use the feedback helpers only as a sanitized local capture mechanism:

```bash
sdlc help onboarding
sdlc onboarding pilot
sdlc feedback quick --task "<human task>" --friction "<short friction>" --note "<sanitized note>"
sdlc feedback review
sdlc feedback summary
```

Developer feedback is for workflow improvement, not individual performance measurement. Do not store proprietary code, client names, private URLs, credentials, raw logs, or customer data in shared `.agents` learnings.

For rendered UI work, accessibility is profile-driven and optional by default. Treat skipped optional accessibility as a cap or note, not as a stopping failure. Only require accessibility evidence when the repository profile or human explicitly marks it required.

When delegating implementation, verification, independent review, release handoff, process learning, or evidence-packet creation, or when running those roles as separate Codex-direct phases, the orchestrator may fill the general templates in `templates/prompts/sdlc/`. These templates are internal prompt-generation aids for the AI; do not require the human to provide prompts in that format.

## What this skill does
1. Interpret the user request.
2. Run or simulate `classify-work`.
3. Choose the SDLC mode and fast-pass route.
4. Identify the next necessary skill.
5. Run one coherent phase at a time.
6. Draft or update artifacts when the route requires them.
7. Stop at consent gates.
8. Continue after approval.
9. Reclassify when new evidence changes the route.
10. Ensure approved quality automation is considered and used when verification or tooling surfaces matter.
11. Choose agent strategy when delegation, specialists, model tiers, or runtime adapters may help.
12. Capture process-learning events when real work exposes friction, gaps, corrections, near misses, or useful workflow successes.
13. Run `slice-product-fit` for Standard implementation slices before implementation planning, and for smaller work when actor, input, contract, data, AI, or cross-slice risk appears.
14. Surface contract, product-fit, and planning attention items in chat when they affect the next decision or implementation path.
15. Run a documentation hygiene checkpoint at phase closeout so active routing
    docs point to current source truth, completed implementation plans are
    removed or marked inactive, slice-specific contracts are consolidated when
    stable, and backlog owns future work.
16. Keep the user oriented with short progress summaries.
17. Use compact evidence packets by default; reserve full reports for High-risk, release, audit-sensitive, cross-repo, or repeated-failure work.
18. Route meaningful Standard, High-risk, repeated-failure, or disputed work through an independent reviewer role when useful and supported.

## What this skill does not do
- Do not replace the specialized skills.
- Do not duplicate full instructions from other skills.
- Do not skip consent gates for product, technical, contract, data, security, or high-risk decisions.
- Do not implement before the required design, plan, contract, and approval gates for the work class.
- Do not update every artifact by default.
- Do not treat conversation history as durable truth.

## SDLC modes
Choose one mode:

```text
new-project
setup-sdlc
new-feature
bugfix
refactor
exploratory-spike
resume-work
review-work
release-work
```

## Required output at start

```text
SDLC mode:
Work class:
Classification confidence:
Context depth:
Technical approach status:
Quality automation status:
Retrieval approach status:
Agent strategy status:
Implementation pattern status:
Slice product-fit status:
Fast-pass route:
Immediate next skill:
Human consent gates expected:
Artifacts likely needed:
Evidence packet level:
Dirty surfaces likely:
Repository boundaries, if multiple repos are involved:
Verification expectation:
Contextual caps to watch:
Stop condition for this phase:
```

Keep this compact.

## Routing table

### Setup SDLC
Use when installing or refreshing this SDLC in a downstream repository.

Typical route:
```text
classify-work
-> context, for context selection
-> setup-sdlc-in-repo
-> agents, if AGENTS.md, agent roles, model tiers, or runtime adapters are needed
-> implementation, if technical approach or implementation pattern docs are missing or changing
-> quality, if command rails are missing or changing
-> tools, if retrieval/indexing is needed
-> quality
-> context, to save state
```

Stop at ambiguous existing instructions, runtime adapter choices, new tooling/dependency decisions, or any change that would overwrite project-specific guidance.

### New project
Use when the user starts from an idea or empty/new repo.

Typical route:
```text
classify-work
-> context, if repo exists or context selection is needed
-> planning, for product framing and application definition
-> implementation, for technical approach and implementation pattern choices
-> quality, for verification and automation rails
-> tools, if retrieval/RAG/indexing may be justified
-> agents, if multiple runtimes, specialists, or model tiers may matter
-> grill-me, if assumptions remain
-> planning, for application model
-> review, for application model review
-> planning, for PRD, issues, and first implementation plan
```

Stop at product direction, application definition, technical approach, quality automation when needed, retrieval approach when needed, application model, MVP PRD, and first implementation plan approval.

### New feature
Use when adding meaningful behavior to an existing project.

Typical route:
```text
classify-work
-> context
-> planning, for product framing, slice product-fit, and model updates
-> implementation, if new technical surface or repeated implementation patterns apply
-> quality, if verification or tooling rails are missing or changing
-> tools, if retrieval/RAG/indexing is part of the feature or context selection is failing
-> agents, if delegation, specialist review, or model-tier selection would reduce risk
-> planning, for PRD/issues/implementation plan
```

Stop at scope approval, technical approach, quality automation, or retrieval approval if needed, PRD/issue approval, and implementation plan approval.

### Bugfix
Use when fixing broken behavior.

Typical route:
```text
classify-work
-> context
-> implementation, for diagnosis
-> planning, if the fix is Standard or actor/input/contract/data/cross-feature assumptions changed
-> quality, if verification or tooling rails are missing or changing
-> tools, if diagnosis needs missing/stale retrieval rails
-> agents, if diagnosis needs read-only exploration, specialist review, or independent verification
-> planning, for implementation plan if non-trivial
-> implementation, for safe edit boundary and execution/TDD
-> quality, for verification before completion
-> context, if behavior/docs may disagree
```

Stop when expected behavior is unclear or a non-trivial/risky fix needs plan approval.

### Refactor
Use when changing structure without intended behavior change.

Typical route:
```text
classify-work
-> context, for context selection
-> planning, for Standard refactor product-fit if actors, contracts, shared concepts, or user-visible behavior may be affected
-> implementation, if patterns/dependencies/architecture change
-> quality, if verification or tooling rails are missing or changing
-> tools, if retrieval/index sources or context-selection workflow changes
-> agents, if the refactor can be split into bounded workers or specialist review
-> planning, for implementation plan
-> review, for implementation plan review
-> implementation, for safe edit boundary and execution/TDD
-> quality, for verification before completion
-> review, for code quality
```

Stop at technical approach, quality automation, or retrieval approval if architecture, dependency, verification, tooling, or retrieval rails change, and at refactor plan approval.

### Exploratory spike
Use when feasibility or direction is uncertain.

Typical route:
```text
classify-work
-> tools, if external/current research is needed
-> context
-> planning or grill-me
-> planning, if the spike is evaluating a product slice, user workflow, AI behavior, API contract, or shared concept
-> implementation, if comparing technical options or implementation patterns
-> quality, if comparing automation options or spike checks
-> tools, if comparing retrieval/RAG/index options
-> agents, if exploration benefits from read-only specialists or model-tier comparison
-> implementation, for safe edit boundary and spike/prototype execution
-> quality, for findings verification
-> context, to update uncertainty and save state
```

Stop at spike boundary approval and recommendation approval before production work.

### Resume work
Use when continuing a prior session.

Typical route:
```text
context
-> classify-work
-> agents, if restored work requires delegation or model-tier changes
-> context, for selected context and uncertainty updates
-> next required gate from restored state
```

Stop when current state is ambiguous or artifacts are stale/contradictory.

### Review work
Use when auditing AI or human work.

Typical route:
```text
classify-work
-> context
-> agents, if independent specialist review or verification is useful
-> review
-> context, if artifacts may disagree
-> quality, if evidence is missing
-> independent reviewer role, when behavior/risk/evidence warrants separate critique
```

Stop when findings require human decision or route mismatch requires reclassification.

### Release work
Use when preparing to finish, merge, ship, or document.

Typical route:
```text
classify-work
-> quality
-> review
-> context, for doc/context sync
-> quality, for health check or stale/missing rails if needed
-> tools, if release checks expose missing or stale retrieval/index rails
-> agents, if release review needs specialists or independent verification
-> review, if implementation patterns affected the release surface
-> release
-> context, to save final state
```

Stop at failed verification, unresolved high-risk findings, or release approval.

## Consent gates
Ask for human approval before proceeding past:

- Product direction or MVP scope.
- Application definition for meaningful new work.
- Technical approach, stack, architecture, deployment, persistence, or dependency choice.
- Quality automation, CI/local preflight, test framework, lint/type/build tooling, or verification command changes.
- Retrieval, RAG, embeddings, vector search, graph/index tooling, Obsidian-style navigation, hosted retrieval, or repo retrieval changes.
- Agent strategy, runtime adapters, model-tier mappings, specialist definitions, or delegation policy changes.
- Slice product fit, actor map, concept ownership, AI/automation authority, or predecessor-slice decisions for Standard work.
- Implementation pattern guidance, pattern maturity, canonical examples, deprecated examples, or pattern exceptions.
- New framework, runtime, production dependency, external service, auth provider, database, AI provider, or testing tool.
- Application model for meaningful work.
- PRD or acceptance criteria.
- Public/cross-boundary contract.
- High-risk implementation plan.
- Data migration, destructive operation, privacy/security decision, or rollback limitation.
- Final acceptance.

## Chat attention gates
Do not leave decision-bearing questions only in artifacts. When contract, product-fit, issue, implementation-plan, review, or execution preflight work finds questions, assumptions, or risks that affect the next implementation step, present them in chat before continuing.

Classify surfaced items as:

- `Needs decision before work`: blocking items, questions below 70% confidence, or choices that affect scope, public contract, data ownership, AI/automation authority, security/privacy, dependencies, persistence, rollback, or user-visible behavior.
- `Recommended default unless corrected`: meaningful assumptions at 70%+ confidence that are safe to proceed with, but should be visible to the human.
- `Recorded for later`: non-blocking context that does not affect the next step.

Every question must include a recommendation. Do not ask naked questions.

Use this shape:

```text
Question:
Recommendation:
Why this fits current evidence:
Tradeoff or risk:
Default action if approved or not corrected:
```

Block before implementation when any `Needs decision before work` item remains unresolved. For Tiny/Micro work, keep this lightweight and surface only items that affect behavior, safety, contracts, or user-visible outcomes.

## Human interaction style
Ask the fewest useful questions.

For broad ideas, ask 5-7 high-leverage questions max before drafting a first artifact. Prefer grouped questions with defaults.

Good first questions for a new app:
```text
1. Who is the primary user?
2. What is the first version supposed to help them do?
3. What must be true for this to feel successful?
4. What platforms or environments matter?
5. What data does it store or touch?
6. Does it need offline, sync, print, auth, sharing, or reminders?
7. Are there technical preferences or constraints?
```

## Progress updates
After each phase, summarize:

```text
Completed:
Decisions made:
Open questions:
Attention items surfaced:
Artifacts updated or proposed:
Next skill:
Human decision needed:
```

## Reclassification
Pause and return to `classify-work` when:

- The task is broader/narrower than expected.
- A later phase would downgrade or upgrade the approved work class.
- A new technical surface appears.
- A missing or inadequate quality automation surface appears.
- A missing, stale, risky, or unnecessary retrieval surface appears.
- A missing, stale, excessive, or unsafe agent strategy appears.
- A missing, stale, disputed, deprecated, or newly needed implementation pattern appears.
- A slice actor, user job, input method, validation boundary, concept owner, AI/automation authority, or cross-slice dependency is unclear.
- A requirement contradicts the model, PRD, issue, contract, or plan.
- A public contract changes.
- Security, privacy, data, migration, dependency, deployment, or operations risk appears.
- Verification cannot prove the completion claim.
- Artifact sync reveals disagreement.

## Artifact behavior
Use dirty surfaces to decide what to update.

Do not update every artifact every time. Draft artifacts when required, then ask for approval when they become decision-bearing.

At phase closeout, check that active implementation plans are still active,
contracts are grouped by durable product boundary where the surface is stable,
`docs/context-state.md` and Memory Bank route to current artifacts, backlog rows
own deferred/future work, and process-learning logs are treated as history
rather than active context routing.

## Hard rules
- Do not make the human manually pick skills.
- Do not continue through a consent gate silently.
- Do not implement meaningful work before the required route gates pass.
- Do not skip `slice-product-fit` for Standard implementation work before implementation planning.
- Do not choose or change stack/dependencies/services silently.
- Do not use heavy gates for Micro/Tiny work unless risk appears.
- Do not treat this skill as a mega-skill.
- When work spans fixture, product, and reusable-skill repositories, state which repos are editable, read-only, test fixtures, and push-allowed before acting. In SDLC pilots, fixture agents should test the workflow in the fixture repo; the orchestrator owns reusable skill-pack review and edits unless the human explicitly changes that boundary.
- For SDLC pilot work, use the pilot workflow and fixture prompt templates when available so the task intent, assigned phase, evidence, and role boundaries are explicit.
- For Git-tracked code/text edits, include diff hygiene such as `git diff --check` in the verification expectation when available.
- When editing repeated code, tests, JSX props, object literals, labels, options, or config-like branches, use enough surrounding context that each replacement target is unique. Avoid large multi-edit batches with short `oldText` snippets that may match multiple locations. For UI component files, patch by the named enclosing component, prop group, conditional branch, or nearby visible label rather than by repeated leaf text such as a button prop or status value. Do not replace a bare shared assignment/property line by itself, such as `shotLimit: ...`, `disabled: ...`, `className: ...`, or another value line likely to appear in multiple state updates; include the enclosing function name, state update block, or JSX branch in the edit context. If unsure whether an `oldText` snippet is unique, search/count it before calling the edit tool. In test files, include the surrounding `it(...)`/`describe(...)` name or adjacent assertions in each replacement; do not edit repeated assertion snippets by themselves. If more than one component branch or test block changes, prefer one narrow edit per branch/block instead of one broad multi-edit call. If an edit fails because the target is non-unique, read the exact nearby region and retry one narrow edit with unique context before continuing.
- Before the first edit in repeated UI/test/control surfaces, make a brief local edit map: file, enclosing function/component/test block, symbols or labels to remove, symbols or labels to add, and the exact current anchor that makes each edit unique. Do not mix imports, state-update branches, repeated JSX option branches, and tests into one speculative edit batch. Edit the import/type/constant area separately from each repeated UI branch or test block, using current-file anchors copied after the latest read.
- Before a coordinated same-file edit with several import/type/export/constant/function changes, read the current file region and copy `oldText` from the current content rather than inferring it from memory or from adjacent files. If removing or renaming a symbol, first confirm the symbol still exists in that file; skip stale removals instead of letting one bad edit fail the whole batch. Prefer splitting a large same-file change into smaller ordered edits when the file contains repeated imports, constants, or state update blocks.
- For TypeScript work that changes union-like domain values, shared types, component props, or test mocks/helpers, treat a passing test command as insufficient by itself. Run the repo's build/typecheck path before final verification, and run it earlier when a small type-risk edit could otherwise compound into later repair work. When adding, narrowing, or renaming domain ID/type unions, search the tests and fixtures for typed string literals that may no longer satisfy the union; update or intentionally type/cast those fixtures in the same first pass instead of waiting for build to discover them.
- When using search to confirm a symbol or pattern is absent after a removal, make the command absence-tolerant so an expected no-match result is not recorded as a failed tool call. For example, use a shell conditional, `rg "oldSymbol" src || true`, or phrase the result as an expected cap; reserve failing search exits for unexpected missing evidence.
- Do not claim completion without fresh verification evidence.

## Next skills
Usually one of: `classify-work`, `context`, `planning`, `implementation`, `quality`, `review`, `release`, `agents`, `tools`, `process-learning`, `setup-sdlc-in-repo`, `grill-me`, or `test-skill-behavior`.

## Global-Local Configuration And Prompt Context

When a repository has the SDLC helper CLI available, prefer local deterministic context assembly before loading broad process or repository documents.

Default start sequence for non-tiny tasks:

```bash
sdlc config validate
sdlc capability snapshot
sdlc context budget --task "..."
sdlc context assemble --phase planning --task "..."
sdlc recipe compile --task "..."
sdlc evidence plan --task "..."
```

Use the assembled context packet as the first prompt context projection. Do not load archived plans, full reference folders, raw command logs, or unrelated repo docs unless the packet is insufficient and there is a specific reason.

For later phases, ask the CLI for a new packet instead of carrying the whole previous chat:

- intake: `sdlc context assemble --phase intake --task "..."`
- planning: `sdlc context assemble --phase planning --task "..."`
- implementation: `sdlc context assemble --phase implementation --task "..."`
- verification: `sdlc context assemble --phase verification --task "..."`
- QA: `sdlc context assemble --phase qa --task "..."`
- finish: `sdlc context assemble --phase finish --task "..."`

The model may request additional files or code snippets, but it should state why they are needed.
