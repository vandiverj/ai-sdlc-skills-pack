---
name: improvement-loop
description: 'Iteratively improve a target skill, plan, process, prompt, or workflow through repeated critique/revision cycles, forced viewpoint shifts, convergence checks, evolution ledgers, and stop conditions.'
user-invocable: true
---

# improvement-loop

## Purpose
Run repeated improvement cycles against a target artifact until a user-specified run budget, convergence condition, or risk gate is reached.

Use this skill to make an artifact better through disciplined iteration, not to generate a longer single-pass review.

## Use When
- The user asks to run an improvement loop.
- The user wants repeated improvement runs over a skill, plan, process, prompt, workflow, checklist, or guidance artifact.
- The user asks for many iterations, such as 10, 50, or 100 runs.
- The user wants to continue until no material improvements are found.
- The user wants forced fresh viewpoints before deciding an artifact has converged.
- `sdlc-process-improvement` or another process skill needs iterative evolution.

## Not For
- Ordinary implementation work that should use `run-sdlc`.
- Rewriting an artifact repeatedly without evidence, critique, or convergence tracking.
- Bypassing human approval for changes that alter purpose, safety, risk, repo setup, commit, push, merge, deploy, or release behavior.

## Core Rule
A no-improvement run does not count toward convergence until the agent changes viewpoint and still finds no material improvement.

Convergence requires the requested number of consecutive no-material-improvement runs from distinct viewpoints unless the user specifies a different rule.

Any material edit, accepted candidate change, or newly deferred material idea resets the no-improvement streak to 0. Convergence is measured only after the latest candidate state stabilizes.

## Reference Selection
Load references only when the task shape needs them:

| Trigger or surface | Load reference |
| --- | --- |
| Evaluator design, measurable improvement, frozen scoring, keep/discard gates, or auditable convergence | `references/evaluator-packets.md` |

## Setup
Before running loops, define:

```text
Target artifact:
Objective:
Run mode: fixed-runs / convergence / budgeted / risk-gated
Run budget:
Convergence rule:
Experience extraction phase: none / infer / ask-targeted
Evaluator design phase: none / researcher / review
Evaluator mode: judgment / frozen
Evaluator packet location:
Candidate artifact/location:
Allowed edit scope:
Validation expectation:
Human approval gates:
Ledger location:
```

If the user does not specify a stop condition, use convergence mode with 5 consecutive no-material-improvement runs from distinct viewpoints.

If the user asks for measurable improvement, objective scoring, Karpathy-loop style iteration, or strict convergence proof, use frozen evaluator mode.

Use an evaluator design phase before frozen evaluator mode when the evaluator is high-impact, novel, likely to drive many runs, or easy to game.

Track candidate state throughout the loop:

```text
Baseline:
Working candidate:
Accepted changes:
Deferred changes:
Rejected changes:
Open experiments:
Principle ledger:
Convergence evidence:
```

Each run critiques the current working candidate, not only the original artifact. Preserve the baseline so the final comparison can explain what changed.

The ledger must persist across the whole run. Do not summarize away rejected ideas, deferred ideas, material edits, or no-op qualifications before the convergence decision.

## Experience Extraction Phase
Use this phase when the user provides life/work experience, intuition, analogy, domain knowledge, failed experiments, external knowledge, or a rough pattern that may improve the target.

Retain experience only when it can be converted into a testable principle or a next action. Useful experience must change at least one of: evaluator design, candidate generation, viewpoint selection, or experiment design.

Extract:

```text
Experience signal:
Recognized pattern:
Transferable principle:
Where it may not apply:
Falsifying signal:
Cheap test:
Effect on evaluator/candidate/viewpoint/experiment:
```

Ask at most 1-3 targeted questions only when the experience signal is too vague to apply. Otherwise infer a draft and let the user correct it.

## Evaluator Design Phase
Use this phase to design the measuring stick before the loop begins. The researcher/reviewer may inspect the target, adjacent skills, prior snapshots, failure modes, external inspiration, and expected evidence. It must not edit the target or run improvement cycles.

Output:

```text
Evaluator objective:
Failure modes to measure:
Experience-derived signals:
Candidate dimensions:
Dimension definitions:
Score matrix, if interactions matter:
Incentive/gaming analysis:
Weights:
Hard gates:
Regression limits:
Evidence allowed:
Evidence disallowed:
Gaming risks:
Recommended frozen evaluator:
```

Freeze the evaluator only after this phase. Once frozen, do not change it during the loop.

## Frozen Evaluator Mode
Use frozen evaluator mode when the target needs measurable improvement rather than judgment-only critique.

Before changing the candidate, create or load an evaluator packet with:

```text
Target artifact:
Candidate artifact/location:
Objective:
Frozen evaluator version:
Hard gates:
Score dimensions:
Weights:
Keep threshold:
Regression limits:
Tie-breakers:
Measurement method:
Allowed evidence:
Disallowed evidence:
Stop condition:
Change budget:
Evaluator change rule:
```

The evaluator is immutable during the loop. If the evaluator is wrong, stop, explain why, create a new evaluator version, and restart from the baseline.

Score the baseline before the first candidate change. Use the same evaluator, weights, scale, hard gates, allowed evidence, disallowed evidence, keep threshold, and regression limits for every score in the loop.

Before editing an artifact in place, preserve a baseline snapshot or define a separate candidate artifact/location. Final comparison must identify which baseline and candidate were scored.

Scores must include dimension-level rationale, not only a total. A candidate cannot be kept on an unexplained score increase.

Keep only candidates that pass hard gates and improve the frozen metric or scorecard. Discard or defer changes that are flat, unmeasurable, regress critical dimensions, or add unjustified process weight.

When improvement quality depends on interactions across dimensions, phases, viewpoints, contexts, or user types, use a score matrix from `references/evaluator-packets.md`. Treat total score as a summary only; keep/discard decisions must consider matrix deltas, critical cells, and tradeoff rules.

## Loop Structure
Each run must produce or update a compact ledger entry:

```text
Run number:
Target version:
Viewpoint used:
Claim being tested:
Weakness found:
Improvement proposed:
Disposition: apply-now / batch-later / experiment-first / reject / human-decision / no-material-change
Change made or deferred:
Evidence:
Residual risk:
Next viewpoint:
```

In frozen evaluator mode, each material candidate and counted no-op must also record:

```text
Evaluator version:
Before score:
After score:
Delta:
Dimension-level rationale:
Gate result:
Keep threshold result:
```

Keep individual run notes concise. For large budgets, summarize in batches instead of writing 100 long reviews.

## Materiality Test
A proposed change is material only if it improves at least one of:

- target purpose clarity,
- trigger or reachability,
- loop discipline,
- convergence reliability,
- anti-churn behavior,
- validation quality,
- output usefulness,
- safety or approval handling,
- interaction with adjacent skills, plans, processes, or workflows.

Wording-only changes are non-material unless they change behavior, reduce ambiguity, or prevent likely misuse.

## Viewpoint Shifts
Use viewpoints that can reveal different failure modes. Choose based on the target:

- new user,
- senior maintainer,
- skeptical reviewer,
- tiny-task agent,
- high-risk production agent,
- legacy repo agent,
- multi-repo agent,
- QA tester,
- security reviewer,
- developer in a hurry,
- future agent with limited context,
- tool-unavailable runtime,
- cross-domain analogy,
- machine-native representation,
- process-weight critic,
- evidence-integrity critic,
- repo-configurability critic,
- adoption/reachability critic,
- experience-skeptic,
- exploratory-jump critic.

When a run finds nothing material, switch to a meaningfully different viewpoint before counting convergence progress.

When loops become incremental too early, try a bounded exploratory jump such as cross-domain analogy, extreme simplification, extreme rigor, machine-native representation, adversarial gaming test, different evaluator shape, opposite assumption, or user-experience inversion. A jump may be rejected as an artifact change but retained as experience if it reveals a testable principle.

## Disposition Rules
Classify every proposed change:

- `apply-now`: clear improvement, low risk, within edit scope.
- `batch-later`: useful but should be grouped with related changes.
- `experiment-first`: plausible but needs fixture, behavior, or comparison evidence.
- `reject`: adds weight, weakens purpose, lacks evidence, duplicates existing guidance, or is off-task.
- `human-decision`: changes purpose, policy, safety, approval gates, or major workflow shape.
- `no-material-change`: no improvement found after a fresh viewpoint was used.

Do not apply speculative changes just to avoid a no-op. A clean no-op after a fresh viewpoint is useful evidence.

## Convergence Integrity
A no-material-change run counts toward convergence only when:

- the viewpoint is distinct from recent no-op viewpoints,
- rejected and deferred ideas were checked to avoid rediscovery,
- the current working candidate was tested against the objective,
- no new change survives the materiality test,
- missing validation would not plausibly change the outcome.

Do not count shallow agreement as convergence. If the agent feels stuck, switch to an adversarial, user, runtime, or cross-domain viewpoint before claiming no material improvement.

Use this convergence ledger for every counted no-op:

```text
No-op run:
Viewpoint:
Why this viewpoint is distinct:
Prior rejected/deferred ideas checked:
Materiality test result:
Validation gaps considered:
Reason no change survives:
No-improvement streak after run:
```

A quick readback, sanity check, or “seems fine” review is not a qualifying no-op. If the run did not test the current candidate against the objective and prior ledger, it does not count.

## Edit Discipline
- Preserve the target artifact's purpose and trigger scope unless the user explicitly asks to change them.
- Prefer small, reversible changes over broad rewrites.
- Batch repeated wording refinements instead of churning the artifact every run.
- Track rejected ideas so they are not rediscovered forever.
- Stop before changes that require human approval.
- For skills, keep bodies concise and use references only when the detail is too large or conditional.
- Do not optimize the target only for the current prompt; check whether the change helps future uses with different targets, budgets, viewpoints, and stop conditions.

## Adjacent Skill Or Process Boundaries
When the target is a skill, process, or workflow, check nearby responsibilities:

```text
Adjacent skills/processes:
Potential overlap:
Potential conflict:
Handoff expectation:
Trigger boundary:
```

Improve the target without absorbing responsibilities that belong to adjacent skills or process owners.

## Run Modes

### Fixed Runs
Run exactly the requested number of cycles unless a stop rule or human approval gate blocks progress.

For large counts, use batch summaries:

```text
Runs 1-10:
Runs 11-25:
Runs 26-50:
Runs 51-100:
Net changes:
Rejected ideas:
Open experiments:
Final artifact health:
```

For 50+ runs, organize the work into phases:

```text
Exploration phase:
Consolidation phase:
Adversarial phase:
Convergence phase:
Final comparison:
```

### Convergence
Run until the requested number of consecutive no-material-improvement runs from distinct viewpoints is reached.

Default convergence: 5.

Reset the no-improvement streak to 0 after every material edit, accepted candidate change, or newly deferred material idea. Report the streak only from the latest stabilized candidate.

In frozen evaluator mode, a no-material-change run counts only if the frozen scorecard shows no qualifying improvement and no accepted/deferred candidate survives the keep threshold.

### Budgeted
Run until the time, token, change-count, or review budget is reached. Stop with a clear partial ledger and next recommended viewpoint.

### Risk-Gated
Run until the next material improvement would require human approval, external research, fixture validation, dependency/setup change, or a purpose/risk decision.

## Validation
Choose validation proportional to the target:

- For skills: check trigger clarity, body concision, required output, stop rules, and interaction with adjacent skills.
- For SDLC process changes: use `sdlc-process-improvement`, `review`, `process-learning`, `quality`, and fixture validation when relevant.
- For prompts or machine-native packets: compare against normal prose before promotion.
- For plans: review assumptions, evidence, scope, sequencing, rollback, and acceptance criteria.

Do not claim convergence if validation is missing and the missing proof could change the outcome.

Before finalizing, compare the baseline and candidate:

```text
Baseline behavior:
Candidate behavior:
Improvement:
Tradeoff:
Risk:
Keep / revise / reject:
```

## Required Output

```text
Target artifact:
Run mode:
Runs completed:
Viewpoints used:
Evaluator design phase:
Evaluator mode:
Evaluator version:
Evaluator packet location:
Candidate artifact/location:
Baseline score:
Final candidate score:
Score delta:
Baseline summary:
Candidate summary:
Material changes applied:
Ideas deferred:
Ideas rejected:
Experience signals used:
Principles extracted:
No-improvement streak:
Last material change run:
Qualifying no-op runs after last change:
Convergence status:
Baseline vs candidate:
Validation evidence:
Human approval needed:
Next recommended action:
```

## Stop Rules
- Stop if the next change would alter purpose, safety, approval gates, or risk posture without human approval.
- Stop before commit, push, merge, deploy, release, destructive operations, dependency installation, or repo setup changes unless explicitly approved.
- Stop if repeated loops are producing wording churn without new evidence or new viewpoints.
- Stop if the target artifact becomes less usable, less focused, or more ceremonial without a justified quality gain.
