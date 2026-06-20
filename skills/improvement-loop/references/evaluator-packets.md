# Evaluator Packets

Use this reference when an improvement loop needs measurable improvement, frozen scoring, or auditable convergence.

## Experience Extraction

Use this when the user provides life/work experience, intuition, analogy, domain knowledge, failed experiments, external knowledge, or a rough pattern that may improve the target.

Retain experience only when it can be converted into a testable principle or next action. Useful experience must change evaluator design, candidate generation, viewpoint selection, or experiment design.

```text
Experience signal:
Source/domain:
Recognized pattern:
Transferable principle:
Task relevance:
Expected benefit:
Where it may not apply:
Falsifying signal:
Cheap test:
Effect on evaluator/candidate/viewpoint/experiment:
```

Ask at most 1-3 targeted questions only when the experience signal is too vague to apply. Otherwise infer a draft and let the user correct it.

## Principle Ledger

Use a compact ledger for retained experience:

```text
Principle:
Source:
Evidence runs:
Applies to:
Does not apply to:
Confidence:
Next use:
Promote / keep local / discard:
```

Do not promote a principle from one weak signal unless it is marked experimental.

## Evaluator Design Phase

Use this phase before frozen evaluator mode when the evaluator is high-impact, novel, likely to drive many runs, or easy to game.

The researcher/reviewer may inspect the target, adjacent skills, prior snapshots, failure modes, external process ideas, and expected evidence. It must not edit the target or run improvement cycles.

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

Freeze the evaluator only after this phase. Once frozen, do not change it during the loop. If the evaluator is wrong, stop and create a new evaluator version from the baseline.

## Incentive And Gaming Analysis

Use this analysis when an evaluator may shape agent behavior over many runs.

```text
Players/stakeholders:
What each optimizes for:
Desired behavior:
How the evaluator could be gamed:
Misaligned incentives:
Payoff conflicts:
Tradeoff rules:
Stable desired behavior:
Countermeasures:
```

Principles:
- The easiest way to score well should also be the way to genuinely improve the target.
- Every metric should include a "how could this be exploited?" check.
- Stakeholder payoffs should be represented in dimensions, matrix columns, hard gates, or tradeoff rules.
- Some regressions may be acceptable only when tied to larger gains by explicit tradeoff rules.
- Safety, approval gates, baseline preservation, and evaluator immutability should not be tradeable without human decision.
- A stable evaluator should make shortcuts unattractive: skipping evidence, moving the goalposts, adding vague wording, or bloating process should not help the agent win.

## Evaluator Packet

Create or load this before the loop starts:

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

The evaluator is immutable during a loop. If it is wrong, stop the loop, explain why, create a new evaluator version, and restart from the baseline.

Score the baseline before the first candidate change. Use the same evaluator, weights, scale, hard gates, allowed evidence, disallowed evidence, keep threshold, and regression limits for every score in the loop.

Before editing an artifact in place, preserve a baseline snapshot or define a separate candidate artifact/location. Final comparison must identify which baseline and candidate were scored.

## Suggested Artifact Locations

Use task-local documents when the loop needs durable comparison:

```text
evaluator.md:
baseline/:
candidate/:
ledger.md:
deferred.md:
rejected.md:
final-comparison.md:
```

Choose the storage root based on the target:
- repo-local `.ai-local/improvement-loop/<task-id>/` for repo-specific work,
- workspace archive for strategy/provenance snapshots,
- user-level `.agents` area for reusable skill-pack work when appropriate.

Do not store product-sensitive details in shared reusable skill docs.

## Default Hard Gates

Use or adapt these gates for skill/process artifacts:

```text
Preserves target purpose:
Preserves safety and approval gates:
Does not require third-party installation or setup changes:
Does not hide human control:
Does not weaken validation or evidence integrity:
Does not add process weight without justification:
```

Any failed hard gate means reject or require human decision.

## Score Dimension Library

Choose only dimensions relevant to the target:

```text
Purpose preservation:
Trigger clarity:
Task fit:
Scope control:
Novelty support:
Experiment discipline:
Coding-quality impact:
Platform/tool support:
Repo configurability:
No-install fallback:
Validation readiness:
Output usefulness:
Convergence reliability:
Anti-churn behavior:
Process weight:
Safety/approval preservation:
Adjacent-skill boundary:
Adoption/reachability:
Human readability:
Machine-native clarity:
```

Score each selected dimension on a fixed scale, usually 0-5. Define whether higher or lower is better for each dimension. For `Process weight`, lower can be better, or the score can mean "weight is justified."

For long loops, prefer weighted dimensions over simply increasing the raw scale:

```text
Dimension:
Definition:
Scale anchors:
Weight: 1-5
Critical regression limit:
Evidence confidence: low / medium / high
```

Track total score, weighted score, critical-dimension deltas, regression flags, and evidence confidence. A larger number is not inherently better than a clearer evaluator.

## Score Matrix

Use a score matrix when improvement quality depends on interactions across dimensions, phases, viewpoints, contexts, user types, or runtime conditions.

Matrix packet:

```text
Rows:
Columns:
Cell scale:
Cell weights:
Critical cells:
Linked tradeoffs:
Aggregation method:
Regression limits:
Keep threshold:
```

Example rows:
- trigger clarity,
- convergence integrity,
- evaluator discipline,
- candidate tracking,
- process weight,
- output usefulness,
- safety/approval preservation.

Example columns:
- new user,
- long-run 100-cycle use,
- frozen evaluator mode,
- maintainer/reviewer,
- tool-unavailable runtime,
- adjacent-skill interaction.

Each scored run should record:

```text
Before matrix:
After matrix:
Delta matrix:
Critical cell changes:
Tradeoff rationale:
Matrix disposition:
```

Keep a candidate only if:
- all hard gates pass,
- no critical cell regresses beyond its limit,
- weighted matrix total or selected critical cells improve enough to pass the keep threshold,
- any accepted regression is justified by a linked tradeoff rule,
- the evaluator explains why total score did not hide an important local regression.

The total score is a navigation aid, not the objective. Keep/discard decisions must consider dimension deltas, hard gates, critical cells, and interaction tradeoffs.

## Keep / Discard / Defer

Keep a candidate only if:
- all hard gates pass,
- weighted score improves by at least the keep threshold, or one critical dimension improves enough without unacceptable regression,
- no critical dimension violates a regression limit,
- the evidence allowed by the evaluator supports the score.

Discard a candidate if:
- a hard gate fails,
- score is flat and the change adds weight,
- the improvement is only stylistic,
- the evaluator cannot measure the claimed benefit,
- the change optimizes only for the current prompt and harms general use.

Defer a candidate if:
- it is promising but needs an experiment,
- the metric is inconclusive,
- the change requires human approval,
- the evidence needed is unavailable.

## Run Ledger

Record every scored run:

```text
Run:
Viewpoint:
Change tried:
Evaluator version:
Before score:
After score:
Delta:
Dimension-level rationale:
Gate result:
Disposition:
Reason:
No-improvement streak:
```

## Skill/Process Evaluator Example

For an SDLC process-improvement skill, useful dimensions may include:

```text
Trigger clarity:
Novelty support:
Experiment-before-process discipline:
Coding-quality focus:
Platform/tool support:
Repo configurability:
No-install fallback:
Fixture or dry-run validation readiness:
Promotion discipline:
Interaction with improvement-loop/run-sdlc/process-learning/review/quality:
Process weight:
```

Example keep threshold:

```text
All hard gates pass.
Total weighted score improves by at least 2 points, or one critical dimension improves by at least 2 points with no critical regression.
Process weight must be neutral/lower or explicitly justified by validation, safety, or coding-quality gain.
```
