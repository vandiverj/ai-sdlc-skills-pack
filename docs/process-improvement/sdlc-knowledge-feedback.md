# Feedback: Knowledge Layer and Retrieval Optimization Loop

Status: External review — addendum, focused on the knowledge layer
Prepared for: the model authoring `codex-local-model-sdlc-overview.md`
Scope: the Knowledge Layer, Offline Insight Consolidation, MCP gateway, and a proposed
retrieval learning/validation loop. A prior feedback pass already covered routing,
orchestration, verification asymmetry, security/blast-radius, and evaluation; the plan
has largely absorbed that. This addendum does not re-litigate those areas.

## How to use this

The plan's knowledge-layer section is already good: it has a record schema with
provenance/confidence/sensitivity, the AirteraCode MCP knowledge callback, offline
consolidation with guardrails, dedicated capture/consolidation roles, the
"points to truth, does not replace it" rule, and Experiment 0C with a kill condition.
Build on that. The recommendations below add the parts that decide whether the
knowledge base becomes a durable asset or just a more elaborate version of the
manually-triggered context repository it is meant to replace.

**Core thesis:** the schema is necessary but not sufficient. A knowledge base without
(1) drift detection, (2) confidence decay, (3) retrieval-quality measurement, and
(4) different handling for self-correcting vs non-self-correcting knowledge will
reproduce the current staleness problem and add a new failure mode (model-amplified
error in consolidation). Treat 1–4 as part of the definition of the knowledge layer,
not as later enhancements.

---

## 1. The gateway should enforce the envelope, not the content

Putting standardization in the MCP gateway rather than in skills is correct, and the
reasoning should be stated in the plan: skills are distributed and conditionally
loaded, so they cannot guarantee a uniform contract — which is exactly why current
standards are inconsistent. A gateway is a single chokepoint every write passes
through, so it can guarantee one thing skills cannot: a uniform envelope.

Draw a hard line:

- **Enforce (reject on violation) at write time:** required fields, a real
  source-of-truth link, a sensitivity tag, anchors (see §3), and a confidence value.
- **Do not enforce:** content correctness or a fixed vocabulary. The gateway cannot
  judge correctness, and trying makes it rigid. Leave correctness to review and
  drift detection.
- **Version the schema itself**, so the standard can evolve without invalidating
  history.

This layering — rigid envelope, soft content, versioned schema — is what lets the
system be standardized and flexible at the same time, which is the tension the plan is
trying to resolve.

## 2. Two knowledge classes with opposite risk profiles — handle them differently

The knowledge base holds two very different things, and the plan currently runs both
through one pipeline with one confidence model:

- **Self-correcting (code-anchored) knowledge** — what files do, how workflows
  execute, test/release mechanics. Can be tied to code and re-derived from it, so
  errors are catchable.
- **Non-self-correcting (non-code) knowledge** — domain rules, regulations, rationale,
  "how things fit together," why a decision was made. This is the knowledge the plan
  most wants to capture *and* the most dangerous to trust: there is no source of truth
  to check it against and no test that fails when it is wrong. It can only decay
  silently.

The valuable knowledge and the risky knowledge are largely the same knowledge. The
plan should split handling by class and reserve the strongest review cadence,
confidence decay, and named human ownership for the non-self-correcting class.

## 3. Make "freshness" a mechanism, not a field: anchor-based drift detection

Today `Freshness/revisit trigger` is a manual field and "detect stale docs" is a vague
overnight task. Replace it with a deterministic mechanism: **bind each entry to the
artifacts it depends on** (file paths, symbols, commit/blob hashes, test IDs,
contract/migration versions, route names). Drift detection then becomes nearly free —
diff current anchors against stored anchors; when an anchor's hash changes, auto-flag
every dependent entry as "possibly stale → needs revalidation." For non-code knowledge
with no anchor, fall back to time-based confidence decay.

This is the single highest-value addition. It converts "know when knowledge needs to
change" from aspiration into a signal a cron job computes, and it keeps "points to
truth" honest over time, not just at write time.

## 4. Measure retrieval, not just capture — it is the actual goal

The stated aim is "pull the right context to a question." The plan measures whether
learnings are captured and consolidated, but not whether retrieval surfaces the right
artifact. Those are different; capture can improve while retrieval quietly degrades.

Add a **retrieval eval set**: a growing list of `question → the source-of-truth
artifacts a correct answer must surface`, scored for whether retrieval actually pulled
them. This is the only way to know the knowledge base and the nightly consolidation are
net-positive rather than slowly poisoning retrieval, and it makes "retrieval pulled the
wrong context" an attributable failure stage that feeds the existing failure-attribution
loop.

Two scoring requirements:

- **Efficiency must be in the score.** Otherwise the system returns the right file
  buried in fifty wrong ones and scores 100% recall. Score precision-at-small-k and
  context economy (tokens/size returned) under a cost budget. The right answer in a
  giant context is a failure for an agent.
- **Cover the hard queries, not just the cheap ones.** See §6.

## 5. Consolidation: prefer detection over generation

Nightly model consolidation that summarizes and merges can amplify error — merge a
correct and an incorrect entry, summarize away a load-bearing caveat, or propagate a
confident-wrong claim (style/self-preference bias makes the fluent version win). Weight
consolidation toward high-signal, low-risk **detection** — contradiction detection,
duplicate detection, anchor-drift flagging, gap detection — over low-signal, high-risk
**generation** like auto-summaries and merged entries. A surfaced contradiction is
high-value and safe; an auto-merged summary is a liability.

Two hard rules: consolidation may never *raise* an entry's confidence, and may never
strip source links.

## 6. The retrieval learning/validation loop ("autoresearch")

This extends §4 from measurement into optimization. Give it a precise, bounded shape so
it does not become an open-ended self-modifying process.

**Mechanism — champion/challenger over a frozen ruler.** A known query set with graded
answers, plus a search that changes *one knob at a time* (how knowledge is captured,
stored/indexed, consolidated, or retrieved). A proposed change is kept only if it beats
the current champion on a **held-out** slice within the efficiency budget; otherwise it
is discarded and rolled back. Run it on the async/overnight local workstream — low
marginal cost, low-hit-rate-tolerant, non-blocking.

**Non-negotiable boundary:** the loop optimizes how knowledge is *represented, indexed,
and retrieved* — never the knowledge *content* or the source of truth. It turns knobs;
it does not author facts. Every kept change is version-controlled and human-reviewable
so a regression is one revert away.

**Why the badge-silhouette example is the right Stage 1.** "Find references to
`badge-silhouette.png`" has ground truth computable for free (`rg -l badge-silhouette.png`),
so an eval set for the whole "find references to X" class can be auto-generated with no
labeling. But the example splits into two halves that must be handled differently:

- *Mechanical half — which files reference it.* Deterministic and gradeable against
  grep. Since grep already answers it for free, this is **not** the optimization
  target; it is the calibration floor — the knowledge base must never do worse than
  grep here.
- *Semantic tail — indirect/transitive references and the reasons.* Assets reached via
  a constant, a build-time rename, a dynamic path, or a CDN URL (grep misses these),
  plus *why* each reference exists (not in the code at all). This is where the
  knowledge base earns its keep and is the real optimization target.

So the loop's job is not "can it find references" — it is "does the knowledge base add
the value grep cannot, without degrading what grep already nails."

**Three traps to design against:**

1. **Overfitting the known set.** Hold out a test slice the optimizer never sees; judge
   generalization only there. Grow the eval set continuously from real queries,
   especially failed ones, so it tracks the live distribution.
2. **Goodhart on cheap queries.** If you optimize only on auto-gradeable deterministic
   queries, you tune for mechanical retrieval and starve the semantic value that
   justified the knowledge base. Hard, human-graded queries are expensive but must be
   in the set.
3. **Unattributable improvement.** "Made, stored, consolidated, found" are four
   interacting layers. Change one knob per trial, or a moving metric teaches nothing
   actionable — the same credit-assignment discipline as failure attribution, applied
   to retrieval.

**Staged path, gated on understanding (not just the number):**

- Stage 1 — build and validate the harness, scoring, and champion/challenger machinery
  on deterministic queries where grep is truth. Goal: prove the ruler and the loop on a
  case where the right answer is free. If the knowledge base cannot reproduce grep's
  answer, the harness is broken — fail fast.
- Stage 2 — add human-graded semantic queries (indirect refs, reasons, relationships).
  Now the loop optimizes the value that justifies the knowledge base.
- Stage 3 — apply the learnings (which representation/storage/retrieval choices helped)
  as defaults to new knowledge categories and other repos; expand the eval from real
  failed queries.

Do not advance a stage until its metric is stable **and** the change that moved it is
understood. Capture the learnings themselves as process/strategy knowledge records,
with provenance pointing at the eval delta, so the configuration is auditable,
reversible, and feeds the change-detection model in §7.

**Scope discipline — build the ruler before the robot.** The eval harness is worth
building early and cheaply; it is the measurement needed regardless. The *automated*
optimization loop should wait until the harness is trusted and manual tuning against it
has visibly hit diminishing returns. Tune by hand against the eval set first; let the
overnight loop take over only once the manual version is paying off and the knobs are
understood. This respects the plan's own "prove the smallest economic loop first"
stance.

This is not a new pillar. It is Experiment 0C plus a held-out retrieval harness, run as
champion/challenger on the async-local workstream, attributed with the same per-stage
discipline as failure attribution, feeding the change-detection triggers. Slot it in as
an extension of 0C, not a separate program.

## 7. Unify the scattered change-signals into one adaptivity model

The plan has the ingredients of "know when to change" spread across Per-Piece Kill
Criteria, reclassification triggers, freshness triggers, routing-failure scoring, the
friction audit, and gate-approval instrumentation. Consolidate them into one section
that names three signal types, each with a cheap detector, a threshold, and a defined
response:

- **Drift signals** (a dependency changed): code anchors changed → knowledge stale;
  model/runtime version changed → scorecard stale; new tier available → routing matrix
  stale. Response: revalidate / re-eval.
- **Performance signals** (something underperforms): routing precision falling,
  repair-loop rate rising, retrieval precision dropping, gate approvals trending toward
  rubber-stamp, consolidation acceptance rate falling. Response: investigate / retune /
  kill.
- **Boundary signals** (the world moved): new regulation, new framework major version,
  a new language in the stack, scope creeping past internal full-stack web. Response:
  escalate to human review of the SDLC itself.

The existing kill criteria are the *removal* response; this generalizes them to the
full set (revalidate / re-eval / retune / kill / escalate). Pair it with a default
**staleness budget**: anything model-curated decays in confidence absent fresh
confirmation, so the system fails safe toward "re-verify" rather than "trust forever."
That decay is what keeps the knowledge base self-cleaning instead of accumulating cruft.

---

## Proposed drop-in artifacts (adapt as needed)

### A. Upgraded knowledge-record schema

```text
Kind: system / domain / regulation / testing / architecture / pattern / process / tool / agent
Class: self-correcting | non-self-correcting        # drives review cadence and decay
Claim:
Source artifacts:                                   # required; rejected if missing
Anchors:                                            # files/symbols/commit-or-blob hashes/test IDs/contract versions/routes
Task/run evidence:
Applies to:
Confidence: confirmed / likely / tentative
Confidence-last-confirmed: <date>                   # decays over time if not refreshed
Decay policy: <half-life or revisit interval>
Drift status: current | anchor-changed | time-expired   # set by the nightly drift check
Sensitivity: public / internal / restricted          # required
Owner artifact:
Schema-version: <n>
Suggested action: link / update docs / create issue / review later / discard
```

### B. Retrieval query record + scoring

```text
Query:
Expected source-of-truth artifacts:                 # ground truth (deterministic where possible, else human-graded)
Grading mode: deterministic (tool-generated) | human-graded
Difficulty: mechanical | semantic-tail
Holdout: train | test                               # optimizer never sees test
Score = f(hit@k, precision@small-k, context-economy) subject to cost-budget
```

### C. Champion/challenger protocol (overnight, local)

```text
1. Pick ONE knob to vary (capture form | index/store | consolidation pass | retrieval strategy).
2. Run full eval set; record per-query score and total efficiency cost.
3. Compare challenger vs champion on the HELD-OUT slice only.
4. Keep challenger iff it beats champion on quality AND stays within efficiency budget.
5. Record the change + eval delta as a process-knowledge record (provenance, reversible).
6. Never edit knowledge content or source of truth; config changes only; version-controlled.
```

### D. Change-detection signal table

```text
Signal type   | Detector (cheap)                       | Threshold        | Response
------------- | -------------------------------------- | ---------------- | --------------------
Drift         | anchor hash diff / model-version diff   | any change       | revalidate / re-eval
Performance   | routing precision, repair rate,         | rolling window   | investigate / retune / kill
              | retrieval precision, approval rate      | vs baseline      |
Boundary      | new regulation/framework/language/scope | human-noticed    | escalate SDLC review
```

---

## Where this slots into the existing document

- **Knowledge Layer** — adopt the upgraded record schema (Class, Anchors,
  Confidence-last-confirmed, Decay policy, Drift status, Schema-version); state the
  envelope-vs-content enforcement rule; add the two-class distinction.
- **Offline Insight Consolidation** — reweight toward detection over generation; add the
  two hard rules (no confidence raise, no link stripping).
- **MCP Context And Tool Gateway** — name the gateway as the write-time envelope
  enforcer; note schema versioning.
- **Experiment 0C** — extend into the staged retrieval loop: deterministic floor first
  (badge-silhouette class, tool-generated ground truth), then semantic-tail with
  held-out grading; add the efficiency-in-score and one-knob-per-trial rules; keep the
  kill condition.
- **New section: Change Detection / Adaptivity** — the three signal types, the staleness
  budget, and the generalized response set; fold in kill criteria as the removal case.
- **Open Questions** — these are now answerable and can be retired or reframed:
  "What confidence/freshness model keeps records useful without overtrust?" →
  anchors + decay + drift status. "Should AirteraCode MCP own capture/retrieval/both?" →
  gateway owns envelope enforcement and retrieval feedback; promotion stays gated.

## Honest cautions to keep in the plan

- Without anchors, decay, and retrieval measurement, this knowledge base reproduces the
  current staleness problem and adds model-amplified consolidation error. The schema
  alone does not fix anything.
- The non-self-correcting knowledge is the most valuable and the least safe; be most
  skeptical there, and never let it outrank code/tests/contracts.
- Cheaper retrieval tempts agents to trust the knowledge base over re-reading code —
  exactly when a stale entry bites. For high-risk work, require reconciling a retrieved
  claim against its anchored source, the same rule already applied to structured claims.
- Build the eval harness before the optimization loop. Automating the tuning of a
  knowledge base whose value is not yet established inverts the plan's own discipline.

## Punch list

1. Replace the knowledge-record schema with artifact A.
2. Add the envelope-vs-content gateway rule and schema versioning.
3. Add the self-correcting vs non-self-correcting class and class-specific handling.
4. Add anchor-based drift detection as a deterministic nightly check.
5. Add a retrieval eval set (artifact B) with efficiency in the score.
6. Reweight consolidation to detection-over-generation + the two hard rules.
7. Extend Experiment 0C into the staged retrieval loop (artifact C); deterministic floor
   first, held-out test slice, one knob per trial, build-ruler-before-robot.
8. Add a Change Detection / Adaptivity section (artifact D) + staleness budget; fold in
   kill criteria.
9. Add migration-as-validated-seed-corpus guidance (run the existing repo through the
   gateway; flag, don't silently import; parallel-run until new retrieval beats old).
10. Retire/reframe the now-answerable knowledge open questions.