# Cycle 3 Implementation Plan: Knowledge Retrieval And Adaptivity

Status: Approved and implemented
Promotion state: Experiment
Parent plan: [codex-local-model-sdlc-overview.md](codex-local-model-sdlc-overview.md)
Prior cycle: [cycle-2-implementation-report.md](cycle-2-implementation-report.md)
Related stream: [cycle-1b-airteracode-knowledge-gateway.md](cycle-1b-airteracode-knowledge-gateway.md)
Last updated: 2026-06-19

## Purpose

Cycle 3 turns the Cycle 1B knowledge-candidate gateway and Cycle 2 routing/response measurement into a retrieval and adaptivity experiment.

The goal is to prove that captured knowledge helps future agents find the right source-of-truth artifacts without becoming hidden memory, stale process lore, or a competing source of truth.

Cycle 3 should answer:

```text
source-linked knowledge candidates + source artifacts + deterministic search floor
-> retrieval eval cases
-> scored retrieval/context packets
-> drift and decay signals
-> model/runtime/profile revalidation prompts
-> human-reviewed promotion or rejection
```

It should not answer by trusting generated summaries, broad MCP retrieval, automatic tuning, automatic knowledge promotion, or model self-confidence.

## Planning Scope

Work class:
Standard SDLC process improvement.

References selected:
- [codex-local-model-sdlc-overview.md](codex-local-model-sdlc-overview.md)
- [cycle-1b-airteracode-knowledge-gateway.md](cycle-1b-airteracode-knowledge-gateway.md)
- [cycle-2-implementation-report.md](cycle-2-implementation-report.md)
- [knowledge-candidate-contract.md](knowledge-candidate-contract.md)
- [sdlc-knowledge-feedback.md](sdlc-knowledge-feedback.md)
- [model-capability-drift-revalidation.md](model-capability-drift-revalidation.md)
- [structured-claims-failure-attribution.md](structured-claims-failure-attribution.md)
- [three-tier-routing-matrix.md](three-tier-routing-matrix.md)
- [sdlc-friction-token-human-orchestration-audit.md](sdlc-friction-token-human-orchestration-audit.md)

Artifacts to read/update during implementation:
- `scripts/sdlc/lib/learning.mjs`
- `scripts/sdlc/lib/scenarios.mjs`
- `scripts/sdlc/lib/models.mjs`
- `scripts/sdlc/lib/calibration.mjs`
- `scripts/sdlc/lib/cli.mjs`
- `scripts/sdlc/README.md`
- `templates/schemas/sdlc-knowledge-candidate.schema.json`
- new retrieval-eval schema/doc if approved by this plan
- this plan and the eventual Cycle 3 implementation report

Decisions needed:
- Whether retrieval eval cases should live under existing `sdlc eval` commands or a new narrowly scoped helper surface.
- Whether Cycle 3 should use only local JSONL fallback candidates or also smoke the AirteraCode MCP candidate list path when available.
- Whether model drift reporting should be a separate helper or a report derived from `sdlc models inventory`, calibration rows, and routing receipts.

Recommended defaults:
- Extend the existing `sdlc eval` area with retrieval-specific cases instead of adding a broad retrieval command group.
- Use local JSONL fallback candidates as the mandatory path; treat AirteraCode MCP list/validate as optional smoke evidence only.
- Generate model drift/revalidation reports from existing inventory and calibration data first; do not promote a scorecard or learned router.

Approval gate:
Human approval is needed before implementation starts, and again before commit or push. New MCP retrieval, hosted/vector retrieval, background jobs, dependency installs, local model execution, write-capable delegation, sensitive data indexing, ticket/database access, deployment, merge, release, or destructive Git commands are not approved by this plan.

Next phase:
Implement the slices below after review.

Stop condition:
Stop if implementation requires new retrieval infrastructure, broad MCP retrieval, indexing private/sensitive data, automatic knowledge promotion, automatic model routing, or local-model consolidation without explicit approval.

## Implementation Hypothesis

Hypothesis:
If Cycle 3 adds a small retrieval eval contract, deterministic Stage 1 query set, source-linked context-economy scoring, anchor drift/decay reporting, and model profile revalidation prompts, then the SDLC can start improving context retrieval and routing adaptivity from evidence without trusting unreviewed knowledge records as truth.

Failure mode it addresses:
Knowledge candidates can be captured and validated, but the SDLC does not yet prove that retrieval returns the right source artifacts, that stale candidates are detected, or that model/runtime/profile changes invalidate routing assumptions.

Expected agent behavior change:
Agents should treat knowledge records as pointers, check retrieved claims against source artifacts, record when retrieval missed or overreturned context, and mark stale model/knowledge evidence before using it for routing or planning.

Expected developer experience change:
The developer should see whether retrieval helped, missed, or created review burden through a compact report instead of reading scattered knowledge candidates, MCP output, and process docs.

Expected code-quality change:
Future implementation and review work should start from better source artifacts with fewer wrong-context cascades, while high-risk claims still reconcile against code, tests, contracts, docs, and human review.

How we will know it worked:
At least one Stage 1 deterministic retrieval eval set can be run against local repo artifacts and graded against `rg -l` ground truth. Reports show hit@k, precision-at-small-k, context economy, stale/drifted records, and caps. The candidate path remains valid through `sdlc learn candidate-validate`.

How it could make things worse:
It could add retrieval ceremony before there is enough evidence, make agents trust candidates over source files, produce noisy consolidation output, or hide context-selection failures behind passing mechanical metrics.

## Failure Mode Classification

- wrong context: retrieval returns the wrong artifact or too much context, and the agent builds on it.
- stale evidence: knowledge candidates, model profiles, or routing assumptions remain trusted after anchors, packets, models, runtimes, or tools change.
- weak verification: candidate validation proves envelope shape but not retrieval usefulness or content correctness.
- over-process: eval rows and drift reports could burden ordinary Micro/Tiny work if made mandatory.
- unsafe repo change: private, customer, ticket, database, secret, or production details could be captured into reusable knowledge.
- poor handoff: future agents may not know whether a retrieval result is proof, a pointer, or a stale candidate.
- tool/runtime mismatch: MCP availability or local model support could be assumed when only the JSONL fallback is guaranteed.

## Evidence Summary

Local evidence consulted:
- The parent overview defines Cycle 3 as "Knowledge Retrieval And Adaptivity" and requires deterministic retrieval floors, semantic-tail candidates, change detection, and model drift reports.
- Cycle 1B implemented knowledge-candidate fallback validation/export in `.agents` and a live AirteraCode candidate gateway, but explicitly deferred retrieval ranking and content correctness.
- Cycle 2 implemented tier-routing receipts, response linting, route-fit calibration fields, mixed-scope QA, and dry-run validation, but did not prove model promotion, token savings, local-model safety, or retrieval quality.
- `knowledge-candidate-contract.md` is Provisional and already defines schema version, class, anchors, confidence, decay, drift status, sensitivity, owner, and source artifacts.
- `sdlc-knowledge-feedback.md` emphasizes anchor drift, confidence decay, retrieval evals, detection over generation, champion/challenger tuning, and the deterministic `rg` floor.
- Existing helper surfaces include `sdlc learn candidate-validate|candidate-add|candidate-export`, `sdlc eval run|add-case|compare|report`, `sdlc calibrate summary|inspect|propose`, and seed model inventory.

No external research was added for this plan. Current provider, model, MCP, and runtime claims remain limited to the local docs and implemented helper behavior already recorded in prior cycle reports.

## Affected Surfaces

- Knowledge candidate validation and fallback JSONL export.
- Retrieval eval case format and deterministic scoring.
- Stage 1 deterministic query set and Stage 2 semantic-tail candidate list.
- Calibration and friction reporting when retrieval misses or overreturns context.
- Model capability drift and revalidation reporting.
- Scenario/eval tests for retrieval and knowledge-boundary behavior.
- Process docs explaining source-of-truth boundaries, privacy caps, and no-install fallback.

## Candidate Approaches Considered

### Candidate A: Documentation-Only Cycle 3

New capability or behavior:
Write guidance for retrieval eval, drift signals, and source-of-truth boundaries without adding helper support.

Coding-quality impact:
Clarifies behavior but leaves future agents to manually grade retrieval and drift.

Platform/tool support impact:
No new tool risk.

Repo configurability impact:
Good, but weakly enforceable.

No-install fallback:
Excellent.

Evidence and validation path:
Skill-file checks and manual review only.

External inspiration used:
Checklist and knowledge-management discipline.

Machine-native representation considered:
None beyond existing candidate JSONL.

Experiment-before-process path:
Too weak to prove the Cycle 3 hypothesis.

Cost/risk:
Low cost, low payoff.

Why reject as the only approach:
Cycle 3 needs measured retrieval behavior, not only more guidance.

### Candidate B: Deterministic Retrieval Eval And Drift Reports

New capability or behavior:
Add a narrow retrieval eval contract, Stage 1 deterministic query cases graded against `rg`, context-economy scoring, anchor drift/decay report shape, and model revalidation prompts derived from existing local data.

Coding-quality impact:
Reduces wrong-context risk before agents use captured knowledge for planning or implementation.

Platform/tool support impact:
Uses local files, `rg`, JSONL, and existing CLI patterns. MCP remains optional.

Repo configurability impact:
Good; cases and reports can stay in ignored `.ai-local` paths or approved tracked templates.

No-install fallback:
Use `rg` and Markdown/JSONL reports. If `rg` is unavailable, record the cap and use targeted search/manual grading.

Evidence and validation path:
CLI smoke tests, candidate schema validation, deterministic eval cases, scenario regression, and manual inspection of reports.

External inspiration used:
Measurement-first retrieval eval and statistical process-control style drift detection.

Machine-native representation considered:
Retrieval eval rows and drift reports as JSONL/Markdown with stable fields.

Experiment-before-process path:
Run as Candidate -> Experiment. Do not promote retrieval or model routing rules until reports produce useful evidence.

Cost/risk:
Moderate; adds eval fields but avoids new retrieval infrastructure.

Why choose:
It is the smallest Cycle 3 step that proves retrieval usefulness and staleness handling without broad automation.

### Candidate C: MCP Retrieval Ranking And Semantic Index

New capability or behavior:
Use AirteraCode MCP as a retrieval/search layer over knowledge candidates and source artifacts, then rank context for agents.

Coding-quality impact:
Potentially high later, but only after eval and trust boundaries are proven.

Platform/tool support impact:
Depends on MCP availability, access policy, retrieval behavior, and possibly new indexing code.

Repo configurability impact:
Needs source allowlists, sensitivity policy, update cadence, and stale-index handling.

No-install fallback:
Must keep JSONL/local search path, but main benefit would depend on MCP.

Evidence and validation path:
Would need retrieval eval first.

External inspiration used:
Hybrid retrieval and knowledge gateway.

Machine-native representation considered:
MCP query receipts and retrieval feedback rows.

Experiment-before-process path:
Premature for Cycle 3 implementation.

Cost/risk:
High; could create hidden memory or source-of-truth confusion.

Why reject for Cycle 3:
Build the ruler before expanding retrieval machinery.

### Candidate D: Automated Local Consolidation And Champion/Challenger Tuning

New capability or behavior:
Run local model consolidation and automatic retrieval tuning over candidate records.

Coding-quality impact:
Could find duplicates, contradictions, stale anchors, and context gaps.

Platform/tool support impact:
Requires local model execution and stable eval harness.

Repo configurability impact:
Needs caps on output volume, sensitivity, allowed records, and tuning knobs.

No-install fallback:
Manual review remains possible.

Evidence and validation path:
Needs Candidate B first, then manual challenger trials.

External inspiration used:
Offline batch optimization and detection-over-generation.

Machine-native representation considered:
One-knob challenger configs and eval deltas.

Experiment-before-process path:
Defer until the eval harness is trusted and manual tuning shows value.

Cost/risk:
Moderate to high; can amplify stale or wrong records and create review-burden noise.

Why reject for initial Cycle 3:
Automation before the ruler is trusted would invert the process discipline.

### Candidate E: Model Scorecard And Learned Routing Promotion

New capability or behavior:
Promote model capability profiles and route recommendations from collected calibration and response data.

Coding-quality impact:
Useful only after repeated confirmed outcomes by task shape and role.

Platform/tool support impact:
Depends on measured model/runtime behavior.

Repo configurability impact:
Needs per-repo model profiles and drift budgets.

No-install fallback:
Manual routing remains possible.

Evidence and validation path:
Requires multiple real or fixture rows, human review sampling, and drift revalidation.

External inspiration used:
Scorecards and capability drift monitoring.

Machine-native representation considered:
Profile rows tied to route receipts and response lint outcomes.

Experiment-before-process path:
Only emit revalidation prompts in Cycle 3.

Cost/risk:
High if promoted from too little evidence.

Why reject for Cycle 3:
Cycle 3 can report staleness and missing evidence, but should not promote learned routing or model scorecards.

## Selected Approach And Rationale

Choose Candidate B.

Cycle 3 should build the retrieval ruler and adaptivity reports, not the full retrieval engine. The selected approach gives future cycles objective evidence for whether knowledge candidates and retrieval help agents choose context while preserving source-of-truth boundaries and no-install fallback behavior.

## Repo Capability Contract Impact

Cycle 3 should not require every downstream repo to add a retrieval system. A mature repo may optionally provide:

```text
Knowledge candidate path:
Retrieval eval case path:
Allowed retrieval sources:
Disallowed retrieval sources:
Deterministic search command:
Semantic-tail query owners:
Context economy budget:
Staleness budget:
Sensitive data restrictions:
Model profile path:
Revalidation triggers:
```

Shared `.agents` guidance should define the contract shape and defaults only. Product facts, private URLs, ticket text, customer data, and repo-specific domain rules stay in repo-local context or approved MCP records.

## Quality Oracle Ladder

Best proof:
Stage 1 retrieval eval cases are graded against `rg -l` or equivalent deterministic search, candidate JSONL validates, scenario tests pass, and reports show hit@k, precision-at-small-k, context economy, drift status, and caps.

Good proof:
Manual inspection confirms retrieved results are pointers to source artifacts, not proof, and semantic-tail candidates are clearly marked human-graded.

Fallback proof:
Markdown or JSONL retrieval cases and manual grading can run without MCP, local models, or new dependencies.

Unavailable proof:
Cycle 3 does not prove semantic retrieval quality, local-model consolidation quality, MCP retrieval ranking, learned routing, model promotion, or cost reduction.

Human-only proof:
Whether a semantic-tail query actually captures rationale, ownership, regulations, or "how things fit together" remains human-graded until enough eval evidence exists.

Do not claim:
Do not claim candidates are correct because they validate, retrieval is useful because records exist, or a model is fit for a role from inventory metadata alone.

## Process Weight Budget

New commands:
Prefer at most narrow additions under existing `sdlc eval` and `sdlc models` surfaces. Avoid a broad retrieval command group.

New concepts:
Retrieval eval case, deterministic floor, semantic-tail query, context economy, anchor drift report, model revalidation prompt.

New files/artifacts:
Potential retrieval eval contract, optional schema, Stage 1 cases, Stage 2 candidates, Cycle 3 report.

New decisions required:
Where eval cases live, whether MCP smoke is in scope, and whether model drift is a helper or report.

New context loaded:
Existing knowledge, eval, model inventory, calibration, and scenario helper surfaces.

New human approvals:
Only for implementation, commit/push, MCP retrieval expansion, sensitive indexing, dependency installs, local model execution, or promotion of candidates into source-of-truth docs.

Removed complexity:
Future agents get a compact retrieval report instead of rereading scattered docs, candidate files, and chat notes to decide whether retrieval helped.

Net process weight:
Neutral-to-slightly-heavier for SDLC maintainer work; no change for ordinary Micro/Tiny tasks.

Why the weight is worth it:
The added structure is limited to Standard+ knowledge/retrieval experiments and gives future cycles evidence before adding retrieval automation.

## Comparative Evaluation

Before:
Agent confusion: candidate validation proves envelope shape, but not retrieval usefulness or freshness.
Commands needed: candidate validation/export and route calibration are separate.
Context needed: agents must read multiple process docs to infer retrieval boundaries.
Evidence quality: no deterministic floor for retrieval.
Code-quality risk: wrong-context failures can silently affect planning and implementation.
Developer effort: human must manually judge whether knowledge capture helped.

After:
Agent confusion reduced: retrieval output is scored as pointer quality, not proof.
Commands reduced or clarified: eval/report output becomes the normal evidence path.
Context reduced: retrieval reports name source artifacts, caps, and overreturned context.
Evidence improved: mechanical queries compare against deterministic search.
Code-quality risk reduced: stale and missing context signals are visible earlier.
Developer effort reduced: review focuses on misses, drift, caps, and semantic-tail candidates.
Remaining tradeoff: reports add maintainer ceremony until retrieval value is proven.

## Adoption Test

Reachability:
The right skills trigger through process-improvement, planning, and tools/retrieval guidance.

Would the agent know the next action?
Yes: build Stage 1 eval, validate candidates, run deterministic checks, report caps, then stop before retrieval expansion.

Could a new repo configure this?
Yes, by keeping eval cases and candidates in repo-local `.ai-local` fallback files and optionally adding a profile section later.

Could a tiny task bypass it?
Yes. Retrieval eval is not required for ordinary Micro/Tiny work.

Could a high-risk task be forced through it?
High-risk tasks may use retrieval output only as pointers and must reconcile against source artifacts.

Could unavailable optional tools be skipped cleanly?
Yes. MCP, local models, and semantic retrieval are optional; `rg` or manual search is the fallback.

Would the final output tell the developer what changed and what was proven?
Yes, through a Cycle 3 implementation report and verification evidence.

## Iteration Tool Used

Use this `sdlc-process-improvement` plan review. Do not use `improvement-loop` unless this draft itself needs a separate critique/revision cycle before implementation.

## Promotion Ladder State

Current state:
Candidate.

Target after implementation:
Experiment, if deterministic retrieval eval and drift reports pass local checks.

Do not promote to Durable until:
Multiple current-repo, configured-fixture, or real-task runs show retrieval improves context selection without increasing wrong-context errors, review burden, or stale evidence.

## Cross-Domain Inspiration

- Quality-control ruler before optimization: build the eval measurement before tuning retrieval.
- Library catalog model: retrieval helps find source artifacts but does not become the book.
- Statistical process-control signals: drift and performance signals trigger revalidation, retuning, or removal.

## Machine-Native Representation Plan

Use stable machine-readable rows where they help future helpers:

```text
Retrieval eval case:
schemaVersion:
query:
expectedArtifacts:
gradingMode: deterministic | human-graded
difficulty: mechanical | semantic-tail
holdout: train | test
deterministicCommand:
costBudget:
ownerArtifact:

Retrieval result:
caseId:
candidateArtifacts:
hitAtK:
precisionAtSmallK:
contextEconomy:
missingExpected:
overreturned:
caps:

Drift report:
recordId:
anchor:
previousAnchorState:
currentAnchorState:
driftStatus:
revalidationAction:
ownerArtifact:
```

Markdown remains the human-readable report format.

## Experiment Before Durable Process

Stage 1:
Create deterministic mechanical queries where local search gives ground truth. The knowledge/retrieval path must not do worse than `rg`.

Stage 2:
Draft semantic-tail query candidates for indirect relationships, rationale, ownership, and "why" questions. Keep these human-graded.

Stage 3:
Only after Stage 1 and manual Stage 2 evidence, consider MCP retrieval ranking, local consolidation, or champion/challenger tuning.

Champion/challenger rule:
Change one knob at a time, compare against a held-out slice, keep the challenger only if quality improves and context economy remains within budget, and never let the loop edit source-of-truth content.

## Implementation Plan

### Slice 0: Baseline And Scope Guard

Goal:
Confirm the current candidate, eval, model inventory, and calibration helpers that Cycle 3 can build on.

Tasks:
1. Run and inspect current `sdlc learn candidate-validate`, `sdlc eval run`, `sdlc models inventory`, and `sdlc calibrate inspect` behavior.
2. Identify whether retrieval eval belongs under existing `sdlc eval` code paths with minimal CLI changes.
3. Record current caps in the Cycle 3 implementation report.

Acceptance:
The implementation starts from existing helper behavior and does not duplicate candidate validation, route calibration, or model inventory.

### Slice 1: Retrieval Eval Contract

Goal:
Define the retrieval eval case and result shape.

Tasks:
1. Create a compact contract doc or section for retrieval eval cases.
2. Add a JSON schema only if it can be used by a helper or test in the same cycle.
3. Include deterministic and human-graded modes, holdout flags, context-economy budget, expected artifacts, and owner artifact.
4. State that retrieval output is a pointer, not proof.

Acceptance:
The contract is understandable without reading the full parent overview and has a no-install Markdown/JSONL fallback.

### Slice 2: Deterministic Stage 1 Cases

Goal:
Build the first mechanical query set.

Tasks:
1. Add at least three current-repo queries shaped like "find references to X".
2. Grade expected artifacts against `rg -l` or record a cap if `rg` is unavailable.
3. Keep cases generic and reusable; do not include personal fixture paths or private product facts.
4. Add a scenario or helper smoke that fails when deterministic expected artifacts are missed.

Acceptance:
Stage 1 can report hit@5, precision@5, context economy, missing expected artifacts, overreturned artifacts, and caps.

### Slice 3: Candidate Validation And Drift Report

Goal:
Tie captured knowledge to anchors and freshness without claiming content correctness.

Tasks:
1. Verify existing knowledge candidate schema fields support anchors, confidence, decay, and drift status.
2. Add or document a report that flags anchor-changed, time-expired, missing-anchor, and missing-owner cases.
3. Ensure the report recommends revalidation or source-artifact review, not automatic promotion.
4. Keep sensitive/restricted records opt-in and blocked from shared docs.

Acceptance:
Cycle 3 can show which records are current, stale, capped, or invalid for routing/retrieval use.

### Slice 4: Model Capability Drift Report

Goal:
Tie routing decisions to model/runtime/scaffold evidence freshness.

Tasks:
1. Use `sdlc models inventory`, routing receipts, response-lint results, and calibration rows as inputs.
2. Report model/runtime/profile fields that remain unknown, stale, or invalidated by packet/schema/tool changes.
3. Emit revalidation prompts only; do not promote a model to a role.
4. Keep local model execution out of scope.

Acceptance:
The report makes stale model capability assumptions visible before future routing changes.

### Slice 5: Semantic-Tail Query Candidates

Goal:
Prepare Stage 2 without automating semantic retrieval.

Tasks:
1. Draft human-graded query candidates for relationships, rationale, ownership, constraints, and "how this fits together."
2. Mark each as semantic-tail and human-graded.
3. Name expected source-of-truth artifacts and what would count as overbroad context.
4. Defer scoring automation unless deterministic Stage 1 is stable.

Acceptance:
Semantic-tail cases are ready for human review but cannot be mistaken for deterministic proof.

### Slice 6: Reports, Docs, And Scenario Coverage

Goal:
Make the experiment reviewable and reversible.

Tasks:
1. Update `scripts/sdlc/README.md` only if new helper commands are added.
2. Add scenario/eval coverage for deterministic retrieval, candidate boundary behavior, and no-promotion claims.
3. Write `cycle-3-implementation-report.md` after implementation.
4. Keep all run outputs under ignored `.ai-local` or `/private/tmp` unless they are durable docs/templates.

Acceptance:
The implementation report maps each acceptance criterion to fresh local evidence.

## Files To Create

Potential, subject to implementation review:
- `docs/process-improvement/retrieval-eval-contract.md`
- `docs/process-improvement/cycle-3-implementation-report.md`
- `templates/schemas/sdlc-retrieval-eval-case.schema.json`
- `templates/scenarios/knowledge-retrieval-deterministic-floor.md`

## Files To Modify

Potential, subject to implementation review:
- `scripts/sdlc/lib/scenarios.mjs`
- `scripts/sdlc/lib/learning.mjs`
- `scripts/sdlc/lib/models.mjs`
- `scripts/sdlc/lib/cli.mjs`
- `scripts/sdlc/README.md`
- `docs/process-improvement/knowledge-candidate-contract.md`
- `docs/process-improvement/model-capability-drift-revalidation.md`

## Files Expected Not To Change

- Portable role files under `agents/*.md`, unless role wording must point to the new retrieval report.
- Runtime adapter contracts, unless a helper output format changes.
- AirteraCode MCP implementation, unless separately approved.
- Downstream product repositories and private fixture paths.

## Technical Approach Fit

Use the existing Node helper CLI style, JSONL local cache conventions, Markdown reports, and scenario tests. Do not add dependencies. Use `rg` as the deterministic floor when available.

## Quality Automation Fit

Use existing skill and doc checks plus targeted Node syntax checks and CLI smoke tests. Add helper-specific checks only if code changes require them.

## Retrieval Approach Fit

Approved approach:
Retrieval eval only. Retrieval output remains a pointer to source artifacts. No new graph, vector, hosted, MCP retrieval, or semantic index is approved by this plan.

Allowed sources:
Tracked `.agents` docs, skills, templates, scripts, schemas, and ignored local JSONL candidates created from sanitized records.

Disallowed sources:
Secrets, credentials, production data, raw customer/client data, raw ticket/database output, private fixture facts in shared docs, and unapproved external documents.

## Agent Strategy Fit

Single orchestrator implementation is preferred. A process-learning reviewer may review findings after implementation. No local model, subagent execution, or write-capable delegated automation is part of this plan.

## Threat Model Fit

Risk surfaces:
MCP/tool trust, knowledge poisoning, stale summaries, sensitive data capture, and source-of-truth confusion.

Mitigations:
Envelope validation, source artifacts, anchors, sensitivity tags, no automatic promotion, no sensitive shared docs, deterministic search floor, and explicit caps.

## Production Readiness Fit

This is process tooling, not production application code. Commit and push require explicit approval. Rollback is a normal Git revert of docs/helper changes and removal of ignored `.ai-local` test outputs.

## Maintainability Approach

Keep retrieval eval code narrow and colocated with existing eval/learning helpers. Prefer one stable row shape over a new framework. Keep docs concise enough that future agents can run the experiment without rereading the parent overview.

## Tools/MCPs Allowed

Allowed:
Local shell commands, Git inspection, `rg`, Node scripts, existing SDLC helper commands, local JSON/Markdown files.

Optional with separate approval:
AirteraCode MCP read/list/validate smoke against synthetic/internal candidates.

Not allowed by this plan:
MCP retrieval expansion, hosted services, dependency installation, local model execution, external web research, ticket/database access, or sensitive data indexing.

## Test-First Steps

TDD is practical if helper code changes:
1. Add or update scenario/eval cases for retrieval floor behavior.
2. Add schema validation samples if a schema is introduced.
3. Run the new helper against a small deterministic query set.

TDD exception:
Pure documentation edits can be verified with doc/skill checks and targeted grep instead of code tests.

## Verification Commands

Before commit, run:

```bash
git diff --check
node scripts/test-skill-files.mjs
rg -n -P "[\x00-\x08\x0B\x0C\x0E-\x1F]" README.md SUMMARY.md WORKFLOW.md skills/*/SKILL.md
git status --short
```

If helper code changes, also run the relevant subset:

```bash
node --check scripts/sdlc/lib/learning.mjs
node --check scripts/sdlc/lib/scenarios.mjs
node --check scripts/sdlc/lib/models.mjs
node scripts/sdlc/sdlc.mjs scenario test --repo .
node scripts/sdlc/sdlc.mjs eval run --repo .
node scripts/sdlc/sdlc.mjs learn candidate-validate --file <sample-jsonl>
```

Future implementation should replace `<sample-jsonl>` with the generated Cycle 3 sample path and add the exact retrieval eval smoke command once the command shape is finalized.

## Documentation And Context Updates

Update only the owning docs:
- Cycle 3 plan/report for experiment scope and evidence.
- Retrieval eval contract if created.
- Knowledge/model drift contracts if their required fields or validation path changes.
- `scripts/sdlc/README.md` if helper commands change.

Do not put local maintainer machine paths, fixture names, private project details, or MCP internals into reusable skills.

## Artifact Lifecycle And Cleanup Path

Durable:
Cycle 3 plan, contracts, schemas, scenarios, helper code, and implementation report.

Temporary:
Generated eval reports, sample candidates, run outputs, and smoke artifacts under `.ai-local` or `/private/tmp`.

Cleanup:
Use normal ignored artifact cleanup after the implementation report records needed evidence. Do not delete evidence before the report links or summarizes it.

## Safe-Edit Boundary

Edit only Cycle 3 docs, narrowly related process contracts, SDLC helper modules, schemas, scenarios, and README command references needed for the plan. Do not edit unrelated skills, downstream repos, MCP code, runtime adapters, or generated package metadata.

## Chat Handoff Before Execution

Needs decision before work:
None, if the recommended defaults are accepted.

Recommended default unless corrected:
Use existing `sdlc eval` and local JSONL fallback paths for Cycle 3. This keeps the cycle no-install and avoids creating a retrieval subsystem before the eval ruler exists.

Recorded for later:
AirteraCode MCP retrieval and local-model consolidation remain later-cycle candidates after deterministic eval and drift reporting are proven.

## Rollback Or Stop Conditions

Rollback path:
- Revert any new retrieval eval helper code and CLI routes.
- Revert any new schemas/templates/scenarios.
- Keep the Cycle 3 plan/report as historical evidence unless superseded.
- Delete ignored `.ai-local` smoke artifacts if they are not needed for the report.

Stop if:
- Retrieval eval requires new dependencies or hosted services.
- MCP retrieval becomes necessary to pass local checks.
- Sensitive/private data would be indexed or captured.
- The implementation starts promoting knowledge candidates or model profiles automatically.
- Stage 1 cannot be graded against deterministic local evidence.

## Ten-Loop Review Log

| Loop | Lens | Evidence consulted | Weakness found | Revision made | Residual risk |
| --- | --- | --- | --- | --- | --- |
| 1 | Usability | Parent overview and Cycle 2 report | Cycle 3 could look like broad retrieval infrastructure | scoped to eval and reports only | still maintainer-facing |
| 2 | Capability | Cycle 1B report | candidate gateway validates envelopes but not retrieval usefulness | made retrieval eval the primary capability | content correctness remains human-reviewed |
| 3 | Efficiency | friction audit contract | retrieval could add more review burden than it saves | added context-economy and overreturned-context scoring | metrics may be rough at first |
| 4 | Evidence integrity | knowledge feedback and `rg` floor | capture success is not retrieval success | required Stage 1 deterministic queries | semantic-tail remains harder |
| 5 | Best practices | tools retrieval guidance | retrieval could become hidden memory | stated pointer-not-proof and source-of-truth rules repeatedly | agents may still overtrust reports |
| 6 | Safety | Cycle 1B sensitivity boundary | candidate/retrieval data could leak private facts | disallowed sensitive shared-doc sources and kept MCP optional | repo-local policy still needed downstream |
| 7 | Composability | existing `eval`, `learn`, `models`, `calibrate` helpers | a new command group would duplicate existing surfaces | prefer extending existing eval/model reports | exact CLI shape remains open |
| 8 | Validation realism | scenario/eval helper code | existing eval is route-focused, not retrieval-focused | planned deterministic retrieval scenario/helper smoke | implementation may need careful naming |
| 9 | Maintainability | knowledge/model drift contracts | scorecards could be promoted too early | report revalidation prompts only, no learned routing | future pressure may skip evidence |
| 10 | Adoption | developer adoption constraints | normal developers should not learn retrieval internals | kept Cycle 3 as maintainer/Standard+ experiment with Tiny bypass | docs must stay concise after implementation |

## Acceptance Criteria

- Cycle 3 implementation remains no-install and local-first.
- Retrieval output is documented and reported as pointer quality, not proof.
- Stage 1 deterministic query cases can be graded against local search or record an explicit cap.
- Reports include hit@k, precision-at-small-k, context economy, missing expected artifacts, overreturned context, and caps.
- Knowledge candidate validation still passes for valid fallback records and fails malformed records.
- Drift reporting flags stale, missing-anchor, or time-expired records without promoting them.
- Model capability drift reporting emits revalidation prompts without promoting local models or learned routing.
- No MCP retrieval, local model execution, sensitive data indexing, dependency install, write-capable delegation, commit, push, merge, deploy, or release is performed without explicit approval.

## Validation Target Plan

Default validation target:
Current repository deterministic checks and dry-run packets.

Optional configured target:
Use only if `.ai-local` profile names an approved validation target and the developer approves that target for this cycle.

Fallback:
If no runnable retrieval helper exists yet, use Markdown/JSONL cases plus deterministic `rg` output and record the missing helper as a cap.

Do not claim:
Do not claim runnable fixture validation, semantic retrieval improvement, MCP retrieval quality, or model capability promotion unless fresh evidence exists.

## Configuration/Defaults Changed

This plan proposes no immediate configuration change. Implementation may add optional local eval/candidate paths under `.ai-local`, but must not require downstream repos to configure retrieval.

## Commit/Push Approval Needed

Yes. Commit and push require explicit human approval after verification passes.
