# Cycle 4 Implementation Plan: Measurement Pilot And Read-Only Counterpoint

Status: Approved and implemented for control-plane measurement helper
Promotion state: Experiment
Parent plan: [codex-local-model-sdlc-overview.md](codex-local-model-sdlc-overview.md)
Prior cycle: [cycle-3-implementation-report.md](cycle-3-implementation-report.md)
Last updated: 2026-06-19

## Purpose

Cycle 4 turns the Cycle 2 routing/response measurement and Cycle 3 retrieval/adaptivity helpers into a small human-orchestration measurement pilot.

The goal is to prove whether the SDLC reduces developer coordination burden, repair loops, or context-selection effort before adding write-capable delegation, learned routing, automatic knowledge promotion, or model promotion.

Cycle 4 should answer:

```text
active SDLC repository set
-> repo-local baseline current-route runs
-> repo-local helper-compiled treatment runs
-> optional read-only plan-counterpoint packet
-> optional human-graded semantic-tail retrieval questions
-> friction, route-fit, repair-loop, evidence, and accepted-finding rows
-> recommendation: narrow, repeat, promote, or defer automation
```

It should not answer by trusting token savings alone, delegating writes, promoting model capability from one run, or counting saved model effort while ignoring extra human coordination.

## Planning Scope

Work class:
Standard SDLC process improvement.

References selected:
- [codex-local-model-sdlc-overview.md](codex-local-model-sdlc-overview.md)
- [cycle-2-measured-routing-response-validation.md](cycle-2-measured-routing-response-validation.md)
- [cycle-2-implementation-report.md](cycle-2-implementation-report.md)
- [cycle-3-knowledge-retrieval-adaptivity.md](cycle-3-knowledge-retrieval-adaptivity.md)
- [cycle-3-implementation-report.md](cycle-3-implementation-report.md)
- [sdlc-friction-token-human-orchestration-audit.md](sdlc-friction-token-human-orchestration-audit.md)
- [retrieval-eval-contract.md](retrieval-eval-contract.md)
- [model-capability-drift-revalidation.md](model-capability-drift-revalidation.md)
- [three-tier-routing-matrix.md](three-tier-routing-matrix.md)
- [agent-response-packet-contract.md](agent-response-packet-contract.md)

Artifacts to read/update during implementation:
- `scripts/sdlc/lib/calibration.mjs`
- `scripts/sdlc/lib/agentpackets.mjs`
- `scripts/sdlc/lib/localreview.mjs`
- `scripts/sdlc/lib/scenarios.mjs`
- `scripts/sdlc/lib/cli.mjs`
- `scripts/sdlc/README.md`
- [sdlc-friction-token-human-orchestration-audit.md](sdlc-friction-token-human-orchestration-audit.md)
- [retrieval-eval-contract.md](retrieval-eval-contract.md), if semantic-tail case guidance needs clarification
- this plan and the eventual Cycle 4 implementation report

Decisions needed:
- Which repositories make up the first active SDLC measurement set.
- Which comparable task shape should be measured in each selected repository.
- Whether any selected repository needs a configured fixture or disposable workspace because its real tasks are too sensitive, too risky, or too hard to compare.
- Whether the treatment should include read-only plan-counterpoint in addition to the required helper-compiled single-agent route.
- Whether the first read-only plan-counterpoint packet uses the seed Gemma profile, a different-family frontier model, or a manual packet fallback.
- Whether any measured repository task exposes three to five semantic-tail retrieval questions worth human grading.

Recommended defaults:
- Use `.agents` only as the control-plane smoke target for helper behavior and scenario regressions, not as the only success measure.
- Measure across the repositories where the SDLC is actually used. Start with a small representative set of at least two non-`.agents` repositories when available, covering different work shapes such as docs/process, API/service, UI, legacy/no-test, or multi-repo integration.
- Prefer real low-risk tasks in those repositories. Use configured fixtures or disposable workspaces when real tasks would expose sensitive data, require unsafe authority, or prevent comparable baseline/treatment evidence.
- Treat helper-compiled single-agent output as the mandatory treatment; treat read-only counterpoint as optional and capped.
- Use manual packet fallback for the first counterpoint packet unless an approved local/different-family runtime is already available and role-specific smoke evidence exists.
- Add semantic-tail retrieval rows only when a measured repository task naturally exposes reusable rationale, ownership, dependency, or "why this exists" questions.

Approval gate:
Human approval is needed before implementation starts, again before invoking any local model or different-family model, and again before commit or push. No write-capable delegated automation, dependency install, MCP write, hosted retrieval, ticket write, database access, deploy, migration, merge, release, or destructive Git command is approved by this plan.

Next phase:
Run the pilot across the selected active SDLC repositories, then compare baseline/treatment evidence with `sdlc calibrate pilot-report`.

Stop condition:
Stop if implementation requires write-capable delegation, learned routing, automatic model recommendation, automatic knowledge promotion, broad retrieval infrastructure, sensitive data indexing, or runtime-specific behavior with no manual fallback.

## Implementation Hypothesis

Hypothesis:
If Cycle 4 records baseline and helper-compiled treatment runs across a representative set of active SDLC repositories with comparable friction, route-fit, repair-loop, verification, retrieval, and optional counterpoint data, then the SDLC can decide whether to keep improving helper-compiled workflows, repeat the pilot, or safely design a later delegated-execution experiment.

Failure mode it addresses:
Cycles 1-3 proved contracts, routing receipts, response lint, retrieval eval, and drift checks, but they did not prove that the process reduces human orchestration burden on a task that resembles real work.

Expected agent behavior change:
Agents should measure coordination burden explicitly, avoid claiming savings from dry-run artifacts alone, and tie any counterpoint or retrieval improvement to accepted findings and downstream repair-loop changes.

Expected developer experience change:
The developer should see a compact comparison of baseline vs treatment: what manual steps were reduced, what evidence improved, what friction increased, and whether the next process change is justified.

Expected code-quality change:
Implementation and review quality should stay equal or improve because the treatment cannot pass unless deterministic checks, response evidence, and review findings are preserved.

How we will know it worked:
The pilot produces comparable baseline and treatment records across selected repositories, at least one route-fit/friction row per measured task, verification evidence, and a recommendation that is supported by measured deltas rather than model confidence.

How it could make things worse:
It could add measurement paperwork, make the developer grade vague process notes, or introduce noisy counterpoint output that increases planning latency without accepted downstream value.

## Failure Mode Classification

- over-process: measurement can become ceremony if it does not affect the next routing decision.
- poor handoff: baseline/treatment comparison can be hard to interpret if records are scattered.
- hidden assumption: token or turn reductions can hide added human coordination.
- stale evidence: seed model profiles remain untrusted until role-specific smoke evidence exists.
- wrong context: semantic-tail retrieval can look useful while returning vague or unverifiable context.
- tool/runtime mismatch: local or different-family model support may be unavailable and must fall back to manual packets.

## Evidence Summary

Local evidence consulted:
- The parent overview now defines Cycle 4 as a measurement pilot before narrow automation expansion.
- User correction clarified that Cycle 4 measurements should be taken against the repositories where the SDLC is actually used, not only the `.agents` control-plane repository.
- Cycle 2 implemented tier-routing receipts, response lint, calibration fields, mixed-scope QA, and verify-only scenario coverage.
- Cycle 3 implemented deterministic retrieval eval, retrieval negative tests, candidate drift checks, local anchor hashes for new candidates, and model revalidation prompts.
- The friction audit contract defines required measurement fields and warns against claiming token savings while ignoring human coordination.
- Retrieval evals currently pass deterministic artifact matching but still cap on context-byte budget for two broad cases, so context economy remains a live measurement concern.
- Model revalidation still marks the seed Gemma profile `needs-revalidation`, so it cannot be trusted for default routing.

No external research was added for this plan. Current model, runtime, and provider claims remain limited to local SDLC artifacts and helper outputs.

## Affected Surfaces

- Calibration and friction capture.
- Agent planning and packet generation.
- Optional read-only plan-counterpoint packet shape.
- Retrieval eval cases for human-graded semantic-tail questions.
- Scenario tests that prove measurement and counterpoint surfaces stay read-only.
- Process docs and implementation report.

## Candidate Approaches Considered

### Candidate A: Documentation-Only Measurement Checklist

New capability or behavior:
Add a checklist describing how to compare baseline and treatment manually across the active SDLC repositories.

Coding-quality impact:
Low. It clarifies expectations but does not make evidence easier to capture or compare.

Platform/tool support impact:
No runtime or dependency risk.

Repo configurability impact:
Good, but every repo would have to invent its own records.

No-install fallback:
Excellent.

Evidence and validation path:
Markdown review, `.agents` control-plane checks, and repo-local measurement rows.

Experiment-before-process path:
Weak; it does not prove the measurement path is usable.

Cost/risk:
Low cost, low payoff.

Why reject as the only approach:
Cycle 4 needs comparable evidence, not only instructions.

### Candidate B: Minimal Measurement Helper And Report

New capability or behavior:
Add or extend a narrow helper that records baseline/treatment audit rows across multiple repositories and summarizes deltas for manual review.

Coding-quality impact:
Moderate. Better handoff and evidence comparison reduce the risk of promoting process changes from anecdotes.

Platform/tool support impact:
Uses local files and existing CLI patterns. No model/runtime dependency.

Repo configurability impact:
Good. Rows can stay under each repository's ignored `.ai-local` paths and can point to repo-local evidence. A summary can aggregate sanitized metadata without copying sensitive repo facts into `.agents`.

No-install fallback:
Markdown or JSONL rows can be written manually when the helper is unavailable.

Evidence and validation path:
CLI smoke checks, scenario test, and at least two non-`.agents` repo pilot reports when available.

Experiment-before-process path:
Strong. The helper itself remains experimental until the first pilot report shows useful deltas.

Cost/risk:
Moderate. Adds a measurement surface, but it directly addresses the roadmap's biggest unproven claim.

Why choose:
It is the smallest implementation that can make Cycle 4 measurable without crossing automation boundaries.

### Candidate C: Read-Only Counterpoint Packet Only

New capability or behavior:
Generate a read-only counterpoint packet and score accepted findings.

Coding-quality impact:
Potentially useful for Standard+ planning quality, but not enough to measure human orchestration by itself.

Platform/tool support impact:
Manual packet fallback is safe; local/different-family runtime invocation needs explicit approval.

Repo configurability impact:
Good if the packet remains portable and role-scoped.

No-install fallback:
Manual packet review.

Evidence and validation path:
Packet lint, response lint, accepted/rejected finding report.

Experiment-before-process path:
Useful as an optional treatment layer after baseline/treatment measurement exists.

Cost/risk:
Medium. Counterpoint can become noisy planning ceremony.

Why not choose alone:
It tests one model/role idea but does not prove the broader SDLC burden-reduction hypothesis.

### Candidate D: Fixture Bounded-Write Delegation

New capability or behavior:
Allow a bounded worker to edit a fixture or disposable worktree.

Coding-quality impact:
Potentially high later, but premature before measurement proves delegated execution would reduce burden.

Platform/tool support impact:
Requires stricter sandboxing, file boundaries, command boundaries, and rollback handling.

Repo configurability impact:
Requires a configured fixture or disposable repo.

No-install fallback:
Weak for the core behavior.

Evidence and validation path:
Needs Cycle 4 measurement first to justify the added authority.

Cost/risk:
High relative to current evidence.

Why reject for Cycle 4:
It crosses the explicit stop line. Revisit only after measurable orchestration or repair-loop savings are shown.

## Selected Approach And Rationale

Choose Candidate B as the mandatory Cycle 4 implementation, with Candidate C as an optional capped slice.

This keeps Cycle 4 focused on evidence: compare the current route to a helper-compiled treatment across active SDLC repositories, capture human-orchestration and repair-loop deltas, and optionally test whether a read-only counterpoint packet produces accepted findings that reduce downstream work.

## Repo Capability Contract Impact

Cycle 4 should not require new repo setup. Each measured repo may optionally provide:

```text
Repository id:
Measurement task:
Task class:
Baseline command or route:
Treatment command or route:
Evidence paths:
Known verification commands:
Human-only checks:
Sensitive paths or data to exclude:
Optional runtime for read-only counterpoint:
Fallback when optional runtime is unavailable:
```

Shared `.agents` guidance should define the shape only. Product facts, credentials, tickets, database output, customer data, and private runtime paths stay in repo-local ignored evidence or approved external context, not reusable docs.

## Quality Oracle Ladder

Best proof:
A completed baseline/treatment pilot across the active SDLC repository set, with comparable audit rows, verification evidence, route-fit/friction rows, and accepted/rejected findings for each measured task.

Good proof:
`.agents` control-plane smoke run plus at least two non-`.agents` repository pilot reports from real low-risk tasks, configured fixtures, or developer-approved disposable workspaces.

Fallback proof:
Manual Markdown audit rows from one non-`.agents` repository following the friction contract plus deterministic helper checks in `.agents`.

Unavailable proof:
Exact token-cost savings if runtime usage data is unavailable or inconsistent across repositories.

Human-only proof:
Developer judgment on whether a manual step was genuinely reduced or merely moved.

Do not claim:
Do not claim token savings, model promotion, delegated-agent readiness, or broad retrieval improvement from one pilot.

## Process Weight Budget

New commands:
`sdlc calibrate pilot-report` and `sdlc calibrate pilot-test`. Existing `sdlc calibrate add` accepts Cycle 4 pilot fields.

New concepts:
Baseline/treatment comparison, accepted counterpoint finding, human-graded semantic-tail question.

New files/artifacts:
Cycle 4 plan, Cycle 4 implementation report, optional repo-local `.ai-local` measurement JSONL/Markdown output, and an optional sanitized aggregate summary.

New decisions required:
Repository set, task shape per repository, treatment shape, optional counterpoint runtime, semantic-tail question inclusion.

New context loaded:
Cycle 2/3 reports, friction audit contract, retrieval eval contract, model drift contract.

New human approvals:
Implementation approval, optional runtime/model invocation approval, commit/push approval.

Removed complexity:
Defers bounded-write delegation and automatic model/retrieval promotion until measurable benefit exists.

Net process weight:
Neutral to heavier for the pilot because multiple repositories are measured; lighter long-term if it prevents premature automation that only works in `.agents`.

Why the weight is worth it:
Human orchestration burden is the central unproven roadmap claim. Measuring it across the repositories that actually use the SDLC is cheaper than building delegated automation that only proves itself in the control-plane repo.

## Comparative Evaluation

Before:
Agent confusion:
The SDLC can produce routing and retrieval evidence, but the next process move still depends on qualitative judgment.

Commands needed:
Separate routing, retrieval, candidate, scenario, and model checks.

Context needed:
Several cycle reports and contracts must be read to infer whether automation is justified.

Evidence quality:
Good for helper correctness, weak for developer-burden reduction.

Code-quality risk:
Low direct code risk, but high process risk if automation expands from unmeasured assumptions.

Developer effort:
Developer must coordinate baseline/treatment interpretation manually.

After:
Agent confusion reduced:
A cross-repo pilot report states where the treatment reduced coordination burden and where it did not.

Commands reduced or clarified:
One aggregate report can summarize repo-local rows, caps, and next action.

Context reduced:
Future agents can read the Cycle 4 report rather than reconstructing deltas from scattered repo-local notes.

Evidence improved:
Process promotion is tied to comparable measurements and verification evidence.

Code-quality risk reduced:
Automation remains blocked until quality and review evidence are preserved.

Developer effort reduced:
Only if the report is compact and the row format stays small; otherwise the pilot should be narrowed.

Remaining tradeoff:
One cross-repo pilot cannot prove durable savings across all task classes, but it is enough to reject `.agents`-only optimism.

## Adoption Test

Reachability:
The plan is reachable from `sdlc-process-improvement`, `planning`, and the parent overview's Cycle 4 candidate.

Would the right skill trigger?
Yes. Process-improvement and planning both match measurement-pilot implementation planning.

Would the agent know the next action?
Yes. Choose repository set and task shapes, implement/report minimal measurement helper, run baseline/treatment in each selected repo, capture evidence.

Could a new repo configure this?
Yes, through a small repo-local measurement task description or manual `.ai-local` rows.

Could a tiny task bypass it?
Yes. Cycle 4 is a process-improvement pilot, not a default gate for Micro/Tiny work.

Could a high-risk task be forced through it?
No. High-risk work still needs its normal SDLC route; this pilot should not weaken gates.

Could unavailable optional tools be skipped cleanly?
Yes. Counterpoint runtime is optional; manual packet fallback is allowed.

Would the final output tell the developer what changed and what was proven?
Yes, if the implementation report includes baseline/treatment deltas, caps, and next recommendation.

## Implementation Plan

### Slice 1: Measurement Contract Clarification

Update the friction audit contract only if needed to clarify baseline/treatment row pairing, accepted counterpoint findings, and semantic-tail retrieval references.

Acceptance:
- Existing record shape remains valid.
- New fields are optional or clearly scoped to Cycle 4.
- No ordinary task is required to fill the pilot rows.

Implementation status:
Implemented in [sdlc-friction-token-human-orchestration-audit.md](sdlc-friction-token-human-orchestration-audit.md).

### Slice 2: Pilot Report Helper

Implement the smallest helper surface that can read baseline/treatment rows and produce a compact comparison.

Expected behavior:
- Accept a repo path and optional input file.
- Group rows by task, route, and treatment label.
- Report manual action count, estimated minutes, retry count, misroute tax, human correction, evidence gaps, and helper-reducible friction.
- Preserve caps when data is missing rather than fabricating deltas.
- Emit Markdown and JSON when useful.

Acceptance:
- Synthetic good rows produce a clear baseline/treatment delta.
- Missing treatment or missing baseline returns capped status, not success.
- The helper does not claim token savings without token/turn evidence.

Implementation status:
Implemented as `sdlc calibrate pilot-report`.

### Slice 3: Optional Read-Only Counterpoint Packet

If approved, add a packet/report shape for read-only plan counterpoint.

Expected behavior:
- Receives original request, draft plan, selected context, challenge questions, and forbidden authority.
- Cannot edit files or choose final route.
- Response lint expects findings, evidence, caps, accepted/rejected status, and downstream impact.
- Manual packet fallback is the default when no approved runtime exists.

Acceptance:
- Generated packet is read-only and portable.
- Response lint can reject missing evidence or overclaiming.
- Accepted findings can be tied to the pilot report without treating model consensus as proof.

Implementation status:
Deferred. Cycle 4 can capture accepted/rejected counterpoint finding counts, but no runtime/model invocation or new packet authority was added.

### Slice 4: Semantic-Tail Retrieval Pilot Rows

Add three to five human-graded retrieval cases only if one or more measured repository tasks expose reusable indirect/rationale questions.

Expected behavior:
- Cases use `gradingMode: human-graded`.
- Cases stay capped until reviewed.
- Reports distinguish semantic usefulness from deterministic retrieval success.

Acceptance:
- Semantic-tail cases cannot pass automatically.
- Human grading links back to source artifacts.
- No sensitive data is indexed or copied into reusable docs.

Implementation status:
Deferred until measured repository tasks expose natural semantic-tail questions.

### Slice 5: Scenario And Regression Checks

Add scenario or helper regression coverage for the new measurement surface.

Acceptance:
- Good pilot rows pass.
- Missing baseline/treatment caps.
- Optional counterpoint remains read-only.
- Existing Cycle 2 and Cycle 3 checks continue to pass.

Implementation status:
Implemented as `sdlc calibrate pilot-test`.

### Slice 6: Implementation Report

Create `cycle-4-implementation-report.md` after implementation and validation.

Required report content:
- Implemented slices.
- Repository set and task shapes used, or reason a repository was excluded.
- Pilot task used in each repository or reason only synthetic/control-plane smoke was possible.
- Baseline/treatment evidence by repository.
- Counterpoint findings, if any.
- Semantic-tail retrieval cases, if any.
- Caps and unresolved evidence gaps.
- Recommendation: narrow, repeat, promote, or defer.

Implementation status:
Implemented in [cycle-4-implementation-report.md](cycle-4-implementation-report.md).

## Ten-Loop Review Log

Loop 1:
Research question:
Does Cycle 4 solve the right next problem?
Evidence consulted:
Parent overview Cycle 4 section, user correction about measuring active SDLC repositories, and Cycle 2/3 implementation reports.
Plan weakness found:
It could drift into building counterpoint before measuring burden, or overfit to `.agents` because it is the control-plane repo.
Revision made:
Made cross-repo measurement mandatory, `.agents` a smoke target, measurement helper mandatory, and counterpoint optional.
Residual risk:
The first repository set may still be too small or too homogeneous.
Next loop focus:
Usability.

Loop 2:
Research question:
Can a future agent run this without ceremony?
Evidence consulted:
Friction audit contract and prior cycle plan structures.
Plan weakness found:
Baseline/treatment pairing was implicit.
Revision made:
Added Slice 1 and Slice 2 behavior for paired rows and capped missing data.
Residual risk:
Row format may need implementation-time adjustment.
Next loop focus:
Evidence integrity.

Loop 3:
Research question:
Could the pilot claim savings without proof?
Evidence consulted:
Friction audit forbidden claims.
Plan weakness found:
Token savings could be overclaimed from turn reduction.
Revision made:
Added "Do not claim" rules and helper cap behavior.
Residual risk:
Human time estimates are still subjective.
Next loop focus:
Safety.

Loop 4:
Research question:
Does the plan preserve consent gates?
Evidence consulted:
Cycle 2/3 approval gates and parent overview stop lines.
Plan weakness found:
Optional local/different-family runtime could be treated as preapproved.
Revision made:
Added explicit approval gate for runtime/model invocation.
Residual risk:
Manual packet fallback may reduce experimental fidelity.
Next loop focus:
Composability.

Loop 5:
Research question:
Does this duplicate existing calibration helpers?
Evidence consulted:
Cycle 2 calibration fields and friction audit shape.
Plan weakness found:
A new measurement namespace may be unnecessary.
Revision made:
Allowed either `calibrate pilot-report` or `measure pilot-report`, with implementation choosing the smaller fit.
Residual risk:
Command naming still needs implementation review.
Next loop focus:
Retrieval fit.

Loop 6:
Research question:
Should semantic-tail retrieval be part of Cycle 4?
Evidence consulted:
Retrieval eval contract and Cycle 3 report caps.
Plan weakness found:
Semantic-tail work could distract from burden measurement.
Revision made:
Made semantic-tail rows conditional on the pilot task exposing natural reusable questions.
Residual risk:
No semantic-tail cases may be produced in the first pilot.
Next loop focus:
Model strategy.

Loop 7:
Research question:
Should Gemma be used for the first counterpoint?
Evidence consulted:
Cycle 3 model revalidation evidence.
Plan weakness found:
The seed profile is still `needs-revalidation`.
Revision made:
Defaulted to manual packet fallback unless runtime/model evidence is approved.
Residual risk:
Manual review may not test local model behavior.
Next loop focus:
Validation realism.

Loop 8:
Research question:
Can current-repo validation expose failures?
Evidence consulted:
Cycle 2/3 scenario tests, `.agents` control-plane helper surfaces, and active-repository validation needs.
Plan weakness found:
Synthetic rows may prove only formatting, not usefulness.
Revision made:
Required active-repository pilots for best proof and kept `.agents` synthetic/control-plane rows as good/fallback proof only.
Residual risk:
The first repository tasks may not be comparable enough.
Next loop focus:
Maintainability.

Loop 9:
Research question:
Is the implementation reversible?
Evidence consulted:
Existing helper CLI patterns and docs-only contracts.
Plan weakness found:
New command surface could become permanent too quickly.
Revision made:
Kept promotion state Candidate and required implementation report recommendation before promotion.
Residual risk:
Command churn if naming is wrong.
Next loop focus:
Adoption.

Loop 10:
Research question:
Will this lead to a clear next decision?
Evidence consulted:
Parent overview later-cycle automation list.
Plan weakness found:
The plan needed an explicit recommendation shape.
Revision made:
Added report recommendation values: narrow, repeat, promote, or defer.
Residual risk:
One pilot cannot justify Durable promotion.
Next loop focus:
Implementation review.

## Acceptance Criteria

- The implementation can produce baseline/treatment pilot reports for the selected active SDLC repositories without invoking write-capable delegation.
- `.agents` is used for control-plane smoke validation, not as the sole acceptance target.
- Missing or weak measurement data is capped, not treated as success.
- Optional counterpoint remains read-only, scoped, and manually reconcilable.
- Optional semantic-tail retrieval cases remain human-graded and source-linked.
- Existing Cycle 2 routing/response and Cycle 3 retrieval/drift checks continue to pass.
- The implementation report gives a concrete recommendation: narrow, repeat, promote, or defer.

## Validation Target Plan

1. `.agents` deterministic checks and synthetic/control-plane pilot rows.
2. Active SDLC repository set selected by the developer or inferred from recently used SDLC repositories.
3. Repo-local real low-risk task in each selected repository when safe and comparable.
4. Repo-local configured fixture or developer-approved disposable workspace when real tasks are too sensitive, too risky, or too hard to compare.
5. If fewer than two non-`.agents` repositories can be measured, record the evidence cap and do not claim cross-repo acceptance.

If no non-`.agents` real or fixture pilot is available during implementation, record that as an evidence gap and do not claim Cycle 4 acceptance beyond control-plane helper smoke validation.

## Verification Commands

Expected verification after implementation:

```bash
git diff --check
node scripts/test-skill-files.mjs
rg -n -P "[\x00-\x08\x0B\x0C\x0E-\x1F]" README.md SUMMARY.md WORKFLOW.md skills/*/SKILL.md
node --check scripts/sdlc/lib/calibration.mjs
node --check scripts/sdlc/lib/agentpackets.mjs
node --check scripts/sdlc/lib/localreview.mjs
node --check scripts/sdlc/lib/scenarios.mjs
node --check scripts/sdlc/lib/cli.mjs
node scripts/sdlc/sdlc.mjs scenario test --repo .
node scripts/sdlc/sdlc.mjs calibrate pilot-test --repo . --json
node scripts/sdlc/sdlc.mjs eval retrieval-test --repo . --json
node scripts/sdlc/sdlc.mjs learn candidate-test --repo . --json
```

## Configuration And Defaults Changed

None in the planning phase.

Implementation may add local ignored output paths under `.ai-local` but must not require repo setup, dependencies, external services, or optional runtimes.

## Rollback Path

- Remove the new helper surface and scenario cases.
- Keep this plan as historical context or mark it superseded.
- Leave Cycle 1-3 behavior unchanged.
- Do not remove existing routing, response lint, retrieval eval, or drift helpers.

## Human Approval Needed

Yes.

Approval is needed before implementation, before optional runtime/model invocation, before committing, and before pushing.
