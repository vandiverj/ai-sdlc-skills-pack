# Cycle 2 Implementation Plan: Measured Routing And Response Validation

Status: Approved and implemented
Promotion state: Experiment
Parent plan: [codex-local-model-sdlc-overview.md](codex-local-model-sdlc-overview.md)
Prior cycle: [cycle-1-implementation-report.md](cycle-1-implementation-report.md)
Last updated: 2026-06-19

## Purpose

Cycle 2 turns the Cycle 1 packet, adapter, model-inventory, and contract work into a measured no-execution routing experiment.

The goal is to prove that the SDLC control plane can recommend a tier, generate bounded packets, validate response shape, capture friction and route-fit evidence, and fix early dry-run defects before any write-capable delegated automation or learned routing is introduced.

Cycle 2 should answer:

```text
human intent + repo facts + task risk + available tools
-> tier-routing receipt
-> bounded agent packet
-> response packet / response lint
-> friction, route-fit, and failure-attribution row
-> current-repo validation packet, optional configured target, or real-task validation packet
-> human-readable next action
```

It should not answer by trusting model self-confidence, broad subagent fan-out, or local-model execution as proof.

## Planning Scope

Work class:
Standard SDLC process improvement.

References selected:
- [codex-local-model-sdlc-overview.md](codex-local-model-sdlc-overview.md)
- [cycle-1-contracts-dry-run-control-plane.md](cycle-1-contracts-dry-run-control-plane.md)
- [cycle-1-implementation-report.md](cycle-1-implementation-report.md)
- [cycle-2-backlog.md](cycle-2-backlog.md)
- [three-tier-routing-matrix.md](three-tier-routing-matrix.md)
- [agent-response-packet-contract.md](agent-response-packet-contract.md)
- [structured-claims-failure-attribution.md](structured-claims-failure-attribution.md)
- [runtime-adapter-contract.md](runtime-adapter-contract.md)
- [runtime-capability-matrix.md](runtime-capability-matrix.md)
- [sdlc-friction-token-human-orchestration-audit.md](sdlc-friction-token-human-orchestration-audit.md)

Artifacts to read/update:
- `scripts/sdlc/lib/agentpackets.mjs`
- `scripts/sdlc/lib/localreview.mjs`
- `scripts/sdlc/lib/journal.mjs`
- `scripts/sdlc/lib/units.mjs`
- `scripts/sdlc/lib/task.mjs`
- `scripts/sdlc/lib/evidence.mjs`
- `scripts/sdlc/lib/help.mjs`
- `scripts/sdlc/lib/scenarios.mjs`
- relevant tests or scenario fixtures under `scripts/`, `tests/`, or `templates/scenarios/` if present
- this plan and the Cycle 2 backlog

Decisions needed:
- Whether `mixed-scope` becomes a formal QA mode or the mixed dirty-tree case should report `workflow`.
- Whether `sdlc agents plan` should persist `promptAnalysis` and `localFirst`, or mark the journal as intentionally partial.
- Whether response-packet lint should be a strict role-response lint mode or a warning-only overlay on the existing final-response lint.

Recommended defaults:
- Add `mixed-scope` as a formal QA mode because it is more precise than `workflow` and matches the dirty-tree signal.
- Have non-JSON `sdlc agents plan` persist `promptAnalysis` and `localFirst`; reserve a partial marker only for explicitly no-write or JSON-only inspection.
- Extend existing `sdlc response lint` instead of adding a new command.

Approval gate:
Human approval is needed before implementation starts, and again before commit or push. No runtime execution, dependency install, MCP write, local model invocation, ticket write, deploy, migration, merge, or destructive Git command is approved by this plan.

Next phase:
Implement the slices below after review.

Stop condition:
Stop if implementation requires direct `codex exec`, local-model execution, new dependencies, external services, or write-capable delegated automation.

## Implementation Hypothesis

Hypothesis:
If Cycle 2 adds measured tier-routing receipts, response-packet lint alignment, friction/outcome capture, and fixes the two Cycle 1 dry-run defects, then the SDLC can evaluate delegated-agent usefulness with less human orchestration burden and without granting automation authority.

Failure mode it addresses:
Cycle 1 can generate packets and adapter/model inventory, but it does not yet measure whether a route was right, whether a delegated response is structurally usable, whether the human did more coordination work, or whether known dry-run edge cases produce misleading state.

Expected agent behavior change:
The orchestrator should recommend a tier with evidence and escalation triggers, require structured response fields from any delegated role, lint overclaims before final synthesis, and record route-fit/friction evidence before promoting process changes.

Expected developer experience change:
The developer should see why a role/tier was recommended, what evidence would make it acceptable, what caps remain, and what friction was introduced or removed without reading every SDLC process document.

Expected code-quality change:
Delegated outputs become easier to reject, repair, or escalate because response claims, caps, boundaries, and evidence gaps are explicit before the orchestrator uses them.

How we will know it worked:
A current-repo dry-run, configured validation target, developer-approved fixture, or real task can produce a routing receipt, agent packet, response-lint result, and calibration/friction row. Known Cycle 2 backlog issues no longer produce misleading QA mode or journal warnings.

How it could make things worse:
It could add more artifact work without improving decisions, make tiny tasks feel heavier, or create false confidence from a lint pass that only proves response shape.

## Failure Mode Classification

- weak verification: packet generation exists, but response evidence and caps are not yet strongly checked.
- poor handoff: developers may not know whether an agent-plan-only journal is incomplete by design or broken.
- stale evidence: model inventory and runtime checks are seed-level and need measured outcome rows before routing trust increases.
- over-process: adding routing artifacts could slow tiny tasks if they become mandatory.
- hidden assumption: a docs task with unrelated dirty source files can understate QA mode as `docs-process`.
- tool/runtime mismatch: runtime support is advisory until a local adapter check proves capability.

## Evidence Summary

Local evidence consulted:
- Cycle 1 implementation report shows packet generation, packet lint, adapter doctor, and model inventory are implemented as an Experiment.
- `sdlc adapter doctor --runtime codex-exec --json` returns comparable Cycle 1 capability data and caps, but does not invoke `codex exec`.
- `sdlc adapter doctor --runtime manual-packet --json` confirms the no-install fallback.
- `sdlc models inventory --json` reports the Gemma seed model with role quality, structured-output reliability, hardware, and latency as unknown.
- `sdlc response lint` already exists in `scripts/sdlc/lib/localreview.mjs` and currently detects broad final-response overclaims.
- `sdlc agents plan` writes an agent-plan packet but does not persist `promptAnalysis` or `localFirst`, matching the Cycle 2 backlog concern.
- `qaModeForSurfaces` currently returns `docs-process` when surfaces include docs plus unrecognized service behavior, matching the mixed-scope backlog concern.

No external research was used for this plan. Current runtime/provider feature claims remain limited to local Cycle 1 adapter outputs and the parent overview.

## Affected Surfaces

- Agent planning and packet generation.
- Response linting and structured-claim validation.
- Task journal validation.
- QA mode inference and evidence recommendations.
- Process friction, route-fit, and calibration capture.
- Scenario/fixture validation for agent routing behavior.
- Documentation for Cycle 2 outcomes and deferred work.

## Candidate Approaches Considered

### Candidate A: Backlog Cleanup Only

New capability or behavior:
Fix the mixed-scope QA mode and agent-plan-only journal warnings, then stop.

Coding-quality impact:
Improves correctness of existing helper output but does not advance routing measurement.

Platform/tool support impact:
No new runtime assumptions.

Repo configurability impact:
Low; mostly core CLI behavior.

No-install fallback:
Excellent.

Evidence and validation path:
Unit/smoke checks around QA inference and journal validation.

External inspiration used:
Checklist cleanup before expanding process.

Machine-native representation considered:
None beyond existing journal fields.

Experiment-before-process path:
Too small to test the parent overview's routing hypothesis.

Cost/risk:
Low cost, low strategic payoff.

Why reject as the only approach:
It leaves Cycle 2 without measured routing, response, or friction evidence.

### Candidate B: Measured Dry-Run Routing And Response Validation

New capability or behavior:
Extend existing helpers to emit tier-routing receipts, lint role response packets, capture friction/route-fit rows, and validate the known backlog defects.

Coding-quality impact:
Improves delegated-output rejection and escalation quality before write-capable automation exists.

Platform/tool support impact:
Uses existing CLI surfaces and manual-packet fallback. Runtime adapters stay advisory.

Repo configurability impact:
Good; repo-local journals, packets, calibration rows, and `.ai-local` outputs remain local and ignored.

No-install fallback:
Manual packet and Markdown response fields remain valid.

Evidence and validation path:
CLI smoke tests, response-lint fixtures, scenario validation, and a current-repo dry-run packet. Optional configured fixtures can add evidence but are not the default.

External inspiration used:
Scientific small experiment and quality-control sampling: measure route fit before promoting a process rule.

Machine-native representation considered:
Tier-routing receipts and response-lint JSON provide compact machine-readable control-plane state.

Experiment-before-process path:
Runs as Candidate -> Experiment only after local smoke and fixture evidence.

Cost/risk:
Moderate; adds fields and lint rules but avoids execution automation.

Why choose:
It is the smallest Cycle 2 step that tests the parent overview's routing, evidence, and friction claims without crossing automation boundaries.

### Candidate C: Direct Codex Exec Or Local-Model Runtime Prototype

New capability or behavior:
Have the helper CLI invoke `codex exec` or a local LM Studio model from generated packets.

Coding-quality impact:
Potentially useful later, but only after response validation and route-fit capture are proven.

Platform/tool support impact:
High runtime-specific risk.

Repo configurability impact:
Requires local model/runtime configuration, approval boundaries, and usage capture paths.

No-install fallback:
Weak unless a parallel manual path is retained.

Evidence and validation path:
Would need runtime availability, sandbox proof, response schema proof, and misroute tracking.

External inspiration used:
Automation pilot.

Machine-native representation considered:
Runtime invocation receipts and JSONL event capture.

Experiment-before-process path:
Too much for Cycle 2.

Cost/risk:
High; can obscure whether routing contracts or runtime plumbing caused failures.

Why reject for Cycle 2:
It crosses the stop line before response lint, friction capture, and dry-run route measurement exist.

### Candidate D: Learned Router Or Model Scorecard Promotion

New capability or behavior:
Automatically recommend or promote models from collected outcomes.

Coding-quality impact:
Useful only after enough confirmed route-fit and failure-attribution data exists.

Platform/tool support impact:
Would depend on stable local measurement and drift revalidation.

Repo configurability impact:
Needs scorecard schemas, model/runtime metadata, and stale-evidence handling.

No-install fallback:
Manual routing remains, but automatic recommendations would be under-evidenced.

Evidence and validation path:
Requires multiple fixture and real-task rows, human review sampling, and drift checks.

External inspiration used:
Statistical process control.

Machine-native representation considered:
Scorecards and confidence/staleness records.

Experiment-before-process path:
Collect rows in Cycle 2; do not learn from them yet.

Cost/risk:
High false-confidence risk.

Why reject for Cycle 2:
The overview explicitly says not to promote a learned or automatic router yet.

## Selected Approach And Rationale

Use Candidate B and include the two Cycle 2 backlog fixes as the first implementation slice.

This keeps the durable change small:
- no new model execution,
- no new dependency,
- no learned router,
- no direct local-model path,
- no expanded role catalog,
- no write-capable delegated automation.

The main design move is to make existing dry-run outputs measurable enough that later execution experiments have a baseline.

## Repo Capability Contract Impact

Cycle 2 should add or populate task-local fields that answer:

```text
Task route:
Candidate tier:
Evidence contract:
Escalation triggers:
Fallback tier:
Response packet status:
Structured claims present:
Boundary respected:
Caps:
Friction category:
Route fit:
Misroute tax:
Human correction:
```

Shared docs define the shape. Task journals, packets, response-lint JSON, and calibration rows own measured values.

## Quality Oracle Ladder

Best proof:
Automated tests or CLI smoke checks show `agents plan`, `agents packet`, `response lint`, `journal-check`, and QA mode inference produce the expected fields and warnings for controlled fixtures.

Good proof:
Scenario validation shows agent routing recommendations and response-lint results are understandable and no execution path was added.

Fallback proof:
Manual packet handoff plus Markdown response fields can be inspected without runtime support.

Unavailable proof:
Actual local model quality, token savings, runtime schema enforcement, and write-capable delegation safety.

Human-only proof:
Whether the route receipt and friction row reduce developer orchestration burden.

Do not claim:
Do not claim cost savings, model promotion, route learning, local-model safety, or production readiness from Cycle 2 alone.

## Process Weight Budget

New commands:
Prefer none. Extend `sdlc agents plan`, `sdlc agents packet`, `sdlc response lint`, `sdlc task journal-check`, and existing calibration/friction surfaces.

New concepts:
One operational concept: `tier-routing receipt`, already derived from the three-tier routing matrix.

New files/artifacts:
This plan and a Cycle 2 implementation report after execution. Task-local generated packets and calibration rows remain under ignored `.ai-local`.

New decisions required:
QA mode name, journal partial behavior, response-lint strictness, and fixture target availability.

New context loaded:
Cycle 1 docs, Cycle 2 backlog, relevant CLI modules, and scenario/fixture files.

New human approvals:
Implementation approval and later commit/push approval. Runtime execution and local-model invocation remain separate approvals.

Removed complexity:
Reduces repeated hand-written routing explanations, response-shape review, and ad hoc friction capture.

Net process weight:
Neutral-to-slightly-heavier for Standard+ work, lighter for later delegated experiments. Tiny work must still bypass the added packet path unless a handoff is useful.

Why the weight is worth it:
It creates evidence needed to decide whether future runtime execution is worth the risk.

## Comparative Evaluation

Before:
Agent confusion: packets exist, but route tier, response validity, and outcome learning are only partly connected.
Commands needed: manual inspection of packet, response, adapter, and calibration surfaces.
Context needed: developer may need to read multiple process docs to understand why a role was recommended.
Evidence quality: dry-run packet proof exists; route-fit and response-claim proof are weak.
Code-quality risk: delegated output could be structurally incomplete but still influence orchestration.
Developer effort: human manually reconciles route, response, caps, and friction.

After:
Agent confusion reduced: routing receipts and response lint name the relevant contract fields.
Commands reduced or clarified: existing commands surface next action and route evidence.
Context reduced: task-local packet/journal carries the measurable routing state.
Evidence improved: response claims, caps, route-fit, and friction rows become reviewable.
Code-quality risk reduced: incomplete or overclaiming delegated responses are easier to reject.
Developer effort reduced: less manual reconstruction of why a route/agent was used.
Remaining tradeoff: more fields in journals and packets could be noisy if shown for tiny tasks.

## Adoption Test

Reachability:
`run-sdlc`, `planning`, and `sdlc-process-improvement` can trigger this for SDLC process/routing work. `agents plan` and `response lint` are already discoverable in help.

Would the right skill trigger?
Yes, for implementation plans and SDLC process improvements.

Would the agent know the next action?
Yes, the plan updates existing commands and next-action fields rather than adding an unfamiliar command group.

Could a new repo configure this?
Yes, because measured outputs live in task-local `.ai-local` journals/packets and can use manual-packet fallback.

Could a tiny task bypass it?
Yes. Agent packets remain optional and should be skipped when they add overhead.

Could a high-risk task be forced through it?
Yes. Standard+ or high-risk delegated work should require response-shape and evidence/cap checks before orchestration trusts the output.

Could unavailable optional tools be skipped cleanly?
Yes. Runtime adapters remain advisory, and unavailable tools are recorded as caps.

Would the final output tell the developer what changed and what was proven?
Yes, the implementation report should list commands, fixture evidence, route-fit rows, and caps.

## Iteration Tool Used

Used the `sdlc-process-improvement` 10-loop critique requirement and the `planning` implementation-plan reference.

Did not use `improvement-loop` because the target is a concrete Cycle 2 implementation plan, not an open-ended artifact improvement loop.

## Promotion Ladder State

Current state:
Candidate.

Move to Experiment when:
The planned CLI/doc changes are implemented and smoke-tested without adding runtime execution.

Move to Provisional when:
At least one current-repo dry-run, configured validation target, developer-approved fixture, or real task shows the route receipt, response lint, and friction capture reduced orchestration burden or prevented a bad delegated-output claim.

Do not move to Durable until:
Multiple task shapes have been validated and tiny-task bypass remains lightweight.

## Cross-Domain Inspiration

Source domain:
Scientific experimentation and quality-control sampling.

Relevant principle:
Change one capability boundary at a time and record outcome signals before changing policy.

Why it may apply to coding-agent SDLC:
Routing, model choice, and response linting need observed route-fit data before automation is trusted.

Where the analogy breaks:
Agent work is not a stable manufacturing process; task variance and human judgment remain central.

Smallest experiment:
Generate a routing receipt, response-lint result, and friction/route-fit row for one current-repo dry-run, configured validation target, developer-approved fixture, or real task.

Success signal:
The receipt and lint result make orchestration or rejection easier than manual review alone.

Failure signal:
The artifacts add ceremony without changing decisions or catching a bad claim.

Adoption criteria:
Keep the fields only if they produce useful review or routing evidence.

Rollback criteria:
Remove or demote fields if they are not used during validation.

## Machine-Native Representation Plan

Representation:
Small JSON-compatible tier-routing receipt and response-lint output.

Hypothesis:
Machine-readable route and response fields make later runtime experiments easier to compare without making normal developer handoff unreadable.

Human-readable source:
Agent plan, generated packet, response packet, and implementation report.

Machine-oriented transformation:
`agents plan --json`, `response lint --json`, and journal fields expose candidate tier, evidence contract, escalation triggers, caps, structured claims, and route-fit.

Preserved fields:
Original task, interpreted objective, accepted scope, evidence needed, stop rules, caps, human approvals, and file/source references.

Discarded fields:
Model prose that lacks source links, unsupported confidence, and redundant packet narration.

Fixture/task:
Current-repo dry-run agent-routing scenario and local no-execution task; optional configured fixture only if present and approved.

Success signal:
The JSON outputs can be compared across runs without reading full transcripts.

Failure signal:
The representation becomes brittle, verbose, or disconnected from human-readable packets.

Human readability cost:
Low if JSON is optional and Markdown remains the default.

Agent performance result:
To be measured in Cycle 2 implementation.

Adopt / revise / discard:
Decide in the Cycle 2 implementation report.

## Experiment Before Durable Process

Cycle 2 is an Experiment candidate, not a durable routing policy.

The experiment should:
- generate no-execution packets,
- lint a good and bad response packet,
- capture one route-fit/friction row,
- exercise the mixed-scope QA mode and agent-plan-only journal fixes,
- validate using the validation-target order and record any fixture gaps without claiming runnable fixture validation.

No model scorecard, learned router, or runtime execution should be promoted from this cycle.

## Implementation Plan

### Slice 0: Backlog Fixes And Baseline Tests

Purpose:
Resolve the two known Cycle 2 candidates before adding new measurement behavior.

Changes:
- Update QA mode inference so mixed docs/source dirty-tree surfaces do not report only `docs-process`.
- Update evidence/help text to recognize `mixed-scope` if that mode is selected.
- Update `sdlc agents plan` so a normal written plan preserves `promptAnalysis` and `localFirst`, or explicitly records `journalMode: partial`.
- Prefer preserving `promptAnalysis` and `localFirst` because `agentpackets.mjs` already imports the required helpers and `agents packet` already stores them.

Files likely to modify:
- `scripts/sdlc/lib/units.mjs`
- `scripts/sdlc/lib/evidence.mjs`
- `scripts/sdlc/lib/qa.mjs`
- `scripts/sdlc/lib/agentpackets.mjs`
- `scripts/sdlc/lib/journal.mjs`
- `scripts/sdlc/lib/help.mjs`

Acceptance:
- Mixed surfaces containing `docs-process` plus a non-doc surface produce `mixed-scope` or another deliberately documented non-doc-only mode.
- `sdlc task journal-check` no longer warns about missing `promptAnalysis` or `localFirst` after a normal `sdlc agents plan` run.
- JSON/no-write inspection behavior remains non-mutating unless explicitly documented.

### Slice 1: Tier-Routing Receipt In Agent Plan And Packet

Purpose:
Make routing advice measurable without adding a learned router or runtime execution.

Changes:
- Add a small tier-routing receipt to `agents plan` and generated packets.
- Include required fields from [three-tier-routing-matrix.md](three-tier-routing-matrix.md): `task`, `workClass`, `riskSignals`, `candidateTier`, `evidenceContract`, `escalationTriggers`, `fallbackTier`, and `doNotClaim`.
- Keep recommendation advisory and human-overridable.
- Store the receipt in the run journal only as planning evidence, not proof that work executed.

Files likely to modify:
- `scripts/sdlc/lib/agentpackets.mjs`
- `scripts/sdlc/lib/routes.mjs` or existing route helpers if reusable
- `scripts/sdlc/lib/task.mjs` or journal update path if needed
- `scripts/sdlc/lib/help.mjs`

Acceptance:
- `sdlc agents plan --task "..." --json` includes a tier-routing receipt.
- Markdown plan/packet output remains readable.
- Receipts include explicit escalation triggers and forbidden claims.
- Tiny/low-risk tasks can still skip agent packets.

### Slice 2: Response Packet Lint Contract Alignment

Purpose:
Validate delegated role responses against the Cycle 1 response-packet contract before the orchestrator relies on them.

Changes:
- Extend `sdlc response lint` to optionally lint role response packets, not only final responses.
- Check for required fields from [agent-response-packet-contract.md](agent-response-packet-contract.md): `status`, `role`, `scopeHandled`, `evidenceUsed`, `structuredClaims`, `boundaryCheck`, `capsRisks`, and `recommendedNextAction`.
- Check structured-claim minimum fields when a response claims delegated work completed.
- Keep final-response overclaim heuristics in place.
- Prefer warnings for missing optional fields; block only unsafe release/deploy/Git claims or missing core fields in role-response mode.

Files likely to modify:
- `scripts/sdlc/lib/localreview.mjs`
- `scripts/sdlc/lib/help.mjs`
- response lint fixture files if a test/fixture directory exists

Acceptance:
- A complete role response passes or returns only record-level findings.
- A response missing core fields returns a warn/block result depending on mode.
- A response claiming tests passed without command evidence still warns.
- A response claiming merge/deploy/release without human boundary still blocks.

### Slice 3: Friction, Route-Fit, And Failure-Attribution Capture

Purpose:
Capture the minimum evidence needed to decide whether delegation reduced total workflow cost.

Changes:
- Align existing calibration/friction capture with [sdlc-friction-token-human-orchestration-audit.md](sdlc-friction-token-human-orchestration-audit.md).
- Ensure generated guidance points to `sdlc calibrate add` or existing feedback commands after agent-plan/response-lint workflows.
- Add optional fields for route-fit, misroute tax, retry count, human correction, model tier, and runtime when they are known.
- Do not require token counts when the runtime does not report usage.

Files likely to modify:
- `scripts/sdlc/lib/agentpackets.mjs`
- `scripts/sdlc/lib/calibration.mjs`
- `scripts/sdlc/lib/adoption.mjs`
- `scripts/sdlc/lib/help.mjs`

Acceptance:
- The post-plan or post-lint next action gives a concrete calibration/friction capture command.
- Rows can record `unknown` usage/token values without being treated as failure.
- The implementation report can cite at least one route-fit/friction row or explain why it was not captured.

### Slice 4: Scenario And Fixture Validation

Purpose:
Prove the changed behavior is reachable and proportional.

Changes:
- Add or update scenario validation for agent routing and response linting.
- Use current repository deterministic checks and dry-run packets first for routing/helper behavior.
- If a repo-local validation target is configured, use it after current-repo checks when it is appropriate for the behavior under test.
- Use a developer-approved disposable fixture, pilot repository, or workspace repo only when current-repo checks and configured local targets are insufficient.
- If no runnable fixture is available, record the cap and use a dry-run packet scenario instead.

Files likely to modify:
- `scripts/sdlc/lib/scenarios.mjs`
- `templates/scenarios/*` if needed
- `docs/process-improvement/cycle-2-implementation-report.md` after implementation

Acceptance:
- Existing scenario validation still passes.
- A generic fixture verify-only or equivalent dry-run scenario exercises the routing receipt.
- Validation packet records commands run, expected evidence, actual evidence, caps, and follow-up changes.

### Slice 5: Cycle 2 Implementation Report

Purpose:
Close the experiment with evidence, not just code changes.

Create:
```text
docs/process-improvement/cycle-2-implementation-report.md
```

Report must include:
- scope completed,
- commands run,
- route receipt examples,
- response-lint examples,
- backlog fixes result,
- fixture validation or cap,
- friction/route-fit rows captured,
- known gaps,
- promotion recommendation,
- rollback path,
- commit/push approval status.

Acceptance:
The report states what Cycle 2 proves and what it explicitly does not prove.

## Ten-Loop Review Log

| Loop | Lens | Evidence consulted | Weakness found | Revision made | Residual risk |
| --- | --- | --- | --- | --- | --- |
| 1 | Usability | Parent overview and Cycle 1 report | A direct runtime prototype would be hard to explain and review | scoped Cycle 2 to measured dry-run routing and response validation | more artifacts for Standard work |
| 2 | Capability | Cycle 1 contracts and CLI modules | response lint already exists, so a new validator would duplicate command surface | plan extends `sdlc response lint` | current lint may need careful mode handling |
| 3 | Efficiency | friction audit contract and helper command surfaces | measuring every token would be too heavy and runtime-dependent | token/usage signal stays optional/unknown unless reported | weak cost evidence in early runs |
| 4 | Evidence integrity | adapter doctor and model inventory smoke outputs | runtime/model capability remains advisory and unknown | plan forbids runtime execution and model promotion claims | cannot prove token savings |
| 5 | Safety | runtime adapter contract and approval gates | direct `codex exec` or LM Studio invocation would require approval and stronger boundaries | marked runtime execution out of scope | later cycle still needs sandbox proof |
| 6 | Composability | `agents plan`, `agents packet`, `response lint`, calibration commands | adding `sdlc route recommend` would duplicate existing agent-plan flow | tier-routing receipt is added to existing plan/packet surfaces | plan/packet output may grow |
| 7 | Fixture realism | generic fixture validation reference and scenario registry | fixture may be unavailable in this repo | plan requires recording cap and using dry-run scenario fallback | weaker validation if fixture missing |
| 8 | Maintainability | Cycle 2 backlog and code paths for QA/journal issues | new measurement work could hide known defects | backlog fixes are Slice 0 before new features | QA mode naming needs care |
| 9 | Adoption | developer adoption constraints in parent overview | normal developers should not learn maintainer internals | JSON is optional, Markdown remains default, tiny tasks can bypass packets | documentation must stay concise |
| 10 | Rollback | likely changed modules and docs | broad route fields could become noisy | implementation is split by slices; receipt/lint changes can be reverted independently | partial rollback may leave docs ahead of code |

## Acceptance Criteria

Cycle 2 is complete when:
- mixed docs/source surfaces no longer report only `docs-process`,
- a normal written `sdlc agents plan` run no longer creates a journal that looks accidentally incomplete,
- agent plans or packets include an advisory tier-routing receipt,
- `sdlc response lint` can validate role response packets against core response fields,
- at least one calibration/friction or route-fit row can be captured for the experiment,
- a current-repo scenario, configured validation target, developer-approved fixture, or dry-run validation packet exercises the changed routing/helper behavior,
- Cycle 2 implementation report records proof, caps, and promotion recommendation,
- no write-capable delegated automation, learned router, runtime execution, or local model execution has been added.

## Fixture Validation Plan

Validation target:
Current repository deterministic checks and dry-run packets first. If a repo-local validation target is configured, use it second. Use a developer-approved disposable fixture, pilot repository, or workspace repo only when current-repo validation is insufficient.

Changed SDLC behavior:
Tier-routing receipt, response-packet lint alignment, mixed-scope QA mode, and agent-plan journal completeness.

Scenario exercised:
Verification-focused task with no write-capable delegation.

Commands to run for the current-repo dry-run validation:
```bash
node scripts/sdlc/sdlc.mjs agents plan --task "approved fixture validation verify behavior" --repo . --json
node scripts/sdlc/sdlc.mjs agents packet --role verification-worker --task "approved fixture validation verify behavior" --repo . --dry-run --out /private/tmp/cycle2-verification-worker.md
node scripts/sdlc/sdlc.mjs agents lint --packet /private/tmp/cycle2-verification-worker.md --repo .
```

Expected evidence:
Routing receipt present, verification-worker recommendation preserved, packet lint passes, no execution claim appears.

Actual evidence:
To be filled during implementation.

Regression concerns:
Agent-plan output must remain readable and tiny-task bypass must remain clear.

Follow-up changes:
To be filled during implementation.

## Verification Commands

Document checks:
```bash
git diff --check
node scripts/test-skill-files.mjs
rg -n -P "[\x00-\x08\x0B\x0C\x0E-\x1F]" README.md SUMMARY.md WORKFLOW.md skills/*/SKILL.md
```

The PowerShell wrapper `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Test-SkillFiles.ps1` may be used on Windows, but the Node script is canonical.

Local CLI checks:
```bash
node scripts/sdlc/sdlc.mjs adapter doctor --runtime codex-exec --repo . --json
node scripts/sdlc/sdlc.mjs adapter doctor --runtime manual-packet --repo . --json
node scripts/sdlc/sdlc.mjs models inventory --repo . --json
node scripts/sdlc/sdlc.mjs agents plan --task "Cycle 2 routing receipt smoke" --repo . --json
node scripts/sdlc/sdlc.mjs agents packet --role verification-worker --task "Cycle 2 routing receipt smoke" --repo . --dry-run --out /private/tmp/cycle2-routing-packet.md
node scripts/sdlc/sdlc.mjs agents lint --packet /private/tmp/cycle2-routing-packet.md --repo .
node scripts/sdlc/sdlc.mjs response lint --file /private/tmp/cycle2-good-response.md --repo . --json
node scripts/sdlc/sdlc.mjs response lint --file /private/tmp/cycle2-bad-response.md --repo . --json
node scripts/sdlc/sdlc.mjs task journal-check --task "Cycle 2 routing receipt smoke" --repo . --json
```

Targeted regression checks:
```bash
node scripts/sdlc/sdlc.mjs scenario test --repo .
rg -n "mixed-scope|tier-routing|response packet|route-fit|misroute" scripts/sdlc docs/process-improvement templates
git status --short
```

If PowerShell is unavailable on the current host, record that gap and run the closest available LF/control-character check with local tools.

## Configuration / Defaults Changed

Expected:
- QA mode may add `mixed-scope`.
- Agent-plan journals may gain `promptAnalysis`, `localFirst`, and/or route receipt fields.
- Response lint may gain role-response mode or stricter field checks.
- Calibration/friction guidance may add optional route-fit fields.

Not changed:
- No model names are promoted.
- No runtime is invoked automatically.
- No MCP write path is added.
- No dependency is installed.
- No Git, deploy, release, migration, ticket, or external-service authority is changed.

## Rollback Path

- Revert the mixed-scope QA mode changes independently if they create noisy QA output.
- Revert `agents plan` journal persistence separately if it creates unwanted writes.
- Revert response-lint role-response checks without affecting existing final-response overclaim lint.
- Remove tier-routing receipt rendering from plan/packet outputs while keeping Cycle 1 packet generation intact.
- Delete generated `.ai-local` experiment artifacts if needed; they are local scratch.
- Keep this plan and the implementation report as historical process-improvement records unless they are superseded.

## Human Attention Items

Needs decision before work:

Question:
Should Cycle 2 formalize `mixed-scope` as a QA mode?

Recommendation:
Yes.

Why this fits current evidence:
The backlog describes a real mixed docs/source dirty-tree case where `docs-process` understated the QA surface.

Tradeoff or risk:
A new QA mode requires help/evidence text updates.

Default action if approved or not corrected:
Implement `mixed-scope` and document it as a temporary mode until file scoping narrows the task.

Recommended default unless corrected:

Question:
Should `sdlc agents plan` persist `promptAnalysis` and `localFirst`?

Recommendation:
Yes for normal written runs; keep JSON inspection no-write.

Why this fits current evidence:
It makes agent-plan-only journals complete enough for `journal-check` and reuses existing helpers already imported by `agentpackets.mjs`.

Tradeoff or risk:
It writes more journal state from a planning command.

Default action if approved or not corrected:
Persist the same analysis fields that `agents packet` already persists.

Recorded for later:

Question:
Should Cycle 3 invoke `codex exec` or a local LM Studio role?

Recommendation:
Do not decide in Cycle 2.

Why this fits current evidence:
Cycle 2 should first prove route receipts, response lint, and friction capture.

Tradeoff or risk:
Delays direct automation proof.

Default action if approved or not corrected:
Leave runtime execution as a separate Cycle 3 approval gate.

## Commit / Push Approval Needed

Yes. Commit and push are not approved by this plan.
