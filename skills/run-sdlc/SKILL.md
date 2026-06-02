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

## Core rule
Do not run the whole workflow by default. Run the smallest route that prevents the most likely expensive failure.

Use the route matrix from `classify-work`: Micro, Tiny, Standard, High-risk, Exploratory, Review-only, or Release/handoff. Treat the full SDLC as available capability, not a mandatory ladder.

For skill-pack architecture, phase ownership, and future consolidation decisions, use the local reference `references/router-map.md`. Do not load that reference for every normal task; load it when route ownership, skill reachability, or skill-vs-reference-vs-agent placement matters.

For concrete route recipes, use `references/route-recipes.md`. Load it when the agent or SDLC helper CLI needs required context packets, checks, evidence shape, stop gates, or completion criteria for common routes.

Before finalizing a route, apply the security trigger overlay from `classify-work/references/security-route-triggers.md`. The overlay can add gates/evidence or escalate risk without changing the base route name.

When available, the helper CLI in `bin/sdlc` or `scripts/sdlc/sdlc.mjs` should automate mechanical task open/start/current/id/bundle/status/review/checkpoint/ledger/verify/QA/finish decisions, profile, readiness, health, context restore/audit/freshness/contradiction/inventory/place/update plans, context pack, change graph lite, run start/finish, touched-surface ledgers, impact packets, route packet, review packet, release packet, developer verification packets, manual smoke packets, human QA Markdown scripts, final gates, Git action packets, packet completion/status, done checks, multi-repo packets/ledgers/QA scripts, contract packets, data/integration/live-bug packets, rendered evidence, surface/unit detection, safe learning capture/review/promotion, security/tool audit packets, verification, calibration/learned-flow promotion, and handoff tasks. It is an affordance over the SDLC, not a replacement for route judgment, human approval gates, review, or verification interpretation.

Distinguish testing surfaces before selecting rendered evidence. Swagger/OpenAPI-only APIs, backend services, background jobs, imports/exports, data changes, and provider integrations are testable surfaces, but they are not rendered product UI unless a user-facing browser workflow is actually changed. Use `sdlc surface detect` and `sdlc unit detect` when a repository contains multiple projects or when route selection is unclear.

For repositories containing multiple deployable codebases, reason at `workspace -> repository -> deployable/codebase unit -> context bucket`. Prefer the repo-level unit registry in `.ai-local/sdlc-profile.md`; use optional unit-local `.ai-local/sdlc-profile.md` only for high-detail units. Unit mappings should include path, test surface, context bucket, commands, deploy method, and Swagger/OpenAPI hints.

Process learnings may be captured in `.agents/learnings/` only after sanitizing product/client details. Keep portable SDLC lessons separate from product-specific durable facts. Product facts usually belong in repo/unit/shared external context, not the skills pack.

Optional external evidence MCPs such as YouTrack and read-only database access are capability-aware overlays, not required dependencies. Use them only when profile/runtime policy allows and they materially reduce task uncertainty. If they are unavailable, use pasted ticket context, local code/tests/docs, and human-provided sanitized logs/query results instead. Read-only access still needs data-boundary care because it can expose private tickets, customer data, proprietary schemas, production records, or secrets.

## Helper CLI operating model
Use the CLI as a small set of mechanical helpers, not as a checklist to exhaust.

Default spine for normal work:

```bash
sdlc intake packet --task "<human task>"
sdlc recipe match --task "<human task>"
sdlc run dashboard --task "<human task>"
sdlc task preflight --task "<human task>"
sdlc state init --task "<human task>"
sdlc evidence required --task "<human task>"
```

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
sdlc run-check --name build -- <project build command>
sdlc touched packet
sdlc impact packet --task "<human task>"
sdlc interaction packet --task "<human task>"
sdlc validate ladder --task "<human task>"
sdlc verify packet --task "<human task>"
sdlc qa script --task "<human task>"
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
- Interactive/stateful features: capture the starting state, action sequence, state changes, feedback/animation, recovery path, and strongest available validation ladder.
- Fixture validation with kept changes: treat useful fixture changes as real product work; verify, review, and prepare commit preview only after explicit finish intent.
- Deterministic completion: record state, required evidence, command results, scope, policy, and waivers locally before claiming done.
- Context saves: run bucket confidence and split product-specific facts from portable process lessons before promoting learnings.

When the developer is unsure where things stand, use `sdlc task doctor --task "<human task>"` and summarize only the current route, recipes, evidence, missing gates, QA readiness, and next decision.

For context, multi-repo, contract, health, and calibration improvement work, use the dedicated helpers:

```bash
sdlc context audit
sdlc context update-plan --task "<human task>"
sdlc multi status
sdlc multi packet --task "<human task>"
sdlc contract packet --task "<human task>"
sdlc health
sdlc calibrate inspect
sdlc calibrate propose
```

If a security trigger appears in the context pack or route packet, keep the security overlay in the evidence and stop for any consent gate before acting.

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
