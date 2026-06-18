# Feedback for the Codex Local-Model SDLC Orchestration Plan

Status: External review, research-grounded
Prepared for: the model authoring `codex-local-model-sdlc-overview.md`
Date: 2026-06-17

## How to use this document

This is consolidated feedback from an outside reviewer plus a research pass on the
current state of the art (model routing, multi-agent orchestration, failure
attribution, LLM-as-judge evaluation, local coding models, agent security, and the
current Codex CLI feature surface). It is meant to be read, argued with, and folded
into the plan — not accepted wholesale. Where it contradicts the draft, the draft
should win only if it can answer the objection on evidence.

The single most important finding: **a large fraction of what the plan proposes to
design already exists as native Codex CLI primitives, and the plan's stated goal
(cost reduction) is served by a different mechanism than the one most of its
architecture builds toward.** Sections 1–3 reframe the plan from first principles
around those two facts. Sections 4–8 are specific, actionable corrections. Section 9
is a change punch list. Section 10 lists sources.

---

## 1. First-principles reframe #1 — You are conflating two mechanisms with opposite cost behavior

The plan treats "delegate to cheaper/local agents" as one idea. It is two, and they
move cost in opposite directions:

- **Mechanism A — Tier routing / cascade.** Send each unit of work to the cheapest
  tier that can do it well; escalate only on difficulty, ambiguity, or risk. This is
  a cost *divider*. The published results are strong and consistent: learned routers
  retain ~95% of frontier quality while sending only ~14–26% of requests to the
  strong model, for ~45–85% cost reduction (RouteLLM, ICLR 2025; FrugalGPT reports up
  to ~98% in favorable settings). This is low-risk, well-understood, and is where
  essentially all of your cost savings live.

- **Mechanism B — Multi-agent decomposition / subagent fan-out.** Split a task across
  several agents that each run their own model and tool loop. This is a cost
  *multiplier*. Anthropic's own production data: agents use ~4× the tokens of a chat,
  and multi-agent systems ~15×. They found token usage alone explains ~80% of
  performance variance on a hard browsing benchmark. Multi-agent fan-out is justified
  by *capability* gains on parallelizable, breadth-first work — **not by cost** — and
  Anthropic explicitly notes that *most coding tasks are a poor fit* because they have
  fewer truly parallelizable subtasks and because LLM agents are still weak at
  real-time coordination and delegation.

The draft's stated objective is cost reduction, but most of its architecture — role
families, subagent budgets, packets, runners, scorecards — is Mechanism B machinery.
That is the core tension the plan should resolve explicitly.

**Reframe:** Lead with routing; ration agents. The cost win comes overwhelmingly from
a router the developer never thinks about (routine work silently downrouted to a
cheaper tier), not from spawning specialists. A subagent should have to *earn* its
place against the ~4–15× token penalty, and it can only earn it in one of two ways:

1. the work is genuinely parallelizable (rare in coding, real in research/exploration), or
2. the marginal compute cost is ~0 (your overnight / idle-local-machine workstream).

This is exactly why your async/overnight local idea is the strongest part of the
plan and tiered frontier routing is the safest first win — both sidestep the token
multiplier. It is also why the plan should *cap* interactive subagent fan-out
aggressively and treat every spawned agent as a capability decision, never a cost
decision. (Codex enforces a version of this for you; see §3.)

---

## 2. First-principles reframe #2 — The orchestrator can only be accountable for what it can cheaply *check*

"Codex remains the accountable orchestrator" is load-bearing, and the plan's earlier
versions leaned on "Codex reconciles every local finding." The economics only work if
*checking* a delegated output is cheaper than *producing* it. If Codex must re-read
everything a subagent read to trust its summary, you have added a round-trip and saved
nothing. So the governing property for "is this role worth delegating?" is
**verification asymmetry**, not "read-only-ness" or "local-model fit."

The research makes this sharper and more urgent than intuition suggests:

- **Automated failure attribution barely works.** On the Who&When benchmark, the best
  methods reach ~53.5% accuracy identifying *which* agent caused a failure and only
  ~14.2% at pinpointing *which step* — some below random, and frontier reasoning
  models do not rescue it. Your "replay the claim chain and find the first false
  claim" instinct is the right *architecture* (the follow-up work — structured causal
  replay, counterfactual fault injection — converges on exactly that), but you must
  not assume an LLM can do the attribution judgment reliably. Design claims to be
  **deterministically checkable**, and keep a human or a test at the decisive step.

- **LLM-as-judge is biased toward confident-but-wrong.** Calibrated judges hit ~80%
  agreement with humans (≈ human–human agreement), but they carry strong style/
  verbosity bias, position bias, and — critically for you — **self-preference bias**:
  models favor outputs from their own family. Frontier judges exceed 50% error on
  hard bias suites. Both human and LLM evaluators rate assertive-but-incorrect output
  ~15–20% higher than accurate-but-hedged output.

Two consequences for the trust architecture:

1. **The quality floor must be executable, not judged.** Tests, type-checks, builds,
   linters, diffs, and runtime assertions are the source of truth. An LLM judge is a
   *cheap triage filter* in front of those signals, never a substitute. Calibrate it
   against human spot-checks and recalibrate when divergence exceeds ~20–25%.
   "Codex reconciles" must mean "Codex checks the claim against executable evidence,"
   not "Codex reads the summary and agrees."

2. **"Independent" same-family review is not independent.** Self-preference bias means
   a GPT orchestrator reviewing GPT (or distilled-from-GPT local) output shares blind
   spots and over-trusts. Genuine independence requires *uncorrelated failure modes* —
   a different model lineage, or better, a deterministic check. The plan's "consensus"
   tier should be demoted accordingly: agreement between similar models is weak
   evidence.

This also corrects a risk-ordering error in the draft. Read-only roles
(`context-explorer`, `independent-reviewer`) are rated as the *safe* place to start
because they cannot damage the repo. But read-only protects the repository, not the
reasoning. A context explorer's **error of omission** (missing a relevant file,
misclassifying source-of-truth) is silent, propagates to every downstream stage, and
is the *hardest* output to verify cheaply — the worst verification asymmetry in the
set. A bounded implementation worker, by contrast, has the *strongest* proof surface
you already own (tests, types, review). Start where the executable proof surface is
strongest, not where write-damage is lowest.

---

## 3. First-principles reframe #3 — Build the policy, not the plumbing (Codex already orchestrates)

This is the highest-leverage practical finding. As of the 2026 Codex releases, the
Codex CLI already provides most of the orchestration layer the plan proposes to
design. Verify against current OpenAI docs, but at review time:

- **Native subagents** with per-agent `model`, `model_reasoning_effort`,
  `sandbox_mode`, `mcp_servers`, and `skills.config`, defined as custom agent files
  with `developer_instructions`. Your portable role definitions map almost directly
  onto these.
- **`agents.max_depth` defaults to 1** (a direct child may spawn, no deeper nesting),
  with explicit docs warnings that raising it multiplies tokens, latency, and local
  resource use. That is your "agent tree sprawl" guardrail, built in.
- **Subagents get a fresh context window** and hand results back via files or
  structured stdout; the parent re-reads what it needs. This *is* structured-claim
  passing — lean into it.
- **Local models are first-class:** `lmstudio` and `ollama` are reserved built-in
  provider IDs, and `openai_base_url` / custom `model_providers` let you point at an
  LLM proxy or router. This answers the open question "can the runner target LM Studio
  directly?" — yes, natively, via an OpenAI-compatible endpoint.
- **Codex can run as an MCP server** (`codex mcp-server`) and be orchestrated by the
  Agents SDK, and OpenAI publishes cookbooks for an "agent improvement loop with
  traces, evals, and Codex" and "iterative repair loops." That is your scaffold-
  learning and evaluation loop, with a reference implementation.
- **Hooks** (`PreToolUse`, `PostToolUse`, `SubagentStart`, `SubagentStop`,
  `SessionStart`, `Stop`, `UserPromptSubmit`, …) are exactly the instrumentation
  points for structured-claim capture, cost tracking, and gate-approval sampling.
- **Auto-review** via a reviewer subagent and the **Skills** standard (shared across
  Codex/Claude surfaces) already exist; your independent-reviewer role and skills pack
  align with native primitives.
- **A real tier ladder exists** (verify names/availability against OpenAI's current
  model list): a default frontier tier (reported as GPT-5.5), a long-horizon
  unsupervised tier (gpt-5-codex), a low-latency tier (gpt-5.3-codex-spark), plus
  GPT-5.4 and pinnable older snapshots. Your three abstract tiers should map onto
  these concretely.

**Reframe:** Do not rebuild orchestration. Map your portable roles onto Codex's
`[agents]` config, sandbox modes, hooks, and providers, and spend your design budget
*only* on the things Codex does **not** give you, which are also the durable IP:

1. the **routing policy** (when to downroute, escalate, or decline to delegate),
2. the **structured-claim schema** and the failure-attribution method,
3. the **test-anchored evaluation harness**,
4. the **friction / token-churn audit** of the existing SDLC,
5. the **case-data handling and blast-radius rules** (§5).

This both shrinks and de-risks the build, and it retires several open questions in the
draft. It also clarifies the earlier "why drop context every call?" question: Codex
**subagents** are fresh-context-per-spawn (hand off via files); persistent context is
a **session** feature (`codex resume` / `codex fork` / `codex-reply` by thread ID).
Those are two different tools. Persistent sessions reduce reconciliation round-trips
but introduce *context opacity* — a wrong assumption can compound silently inside a
long session and only a (possibly laundered) summary returns. Use sessions for
continuity, but have them emit the same structured claims, cap session length, and
reconcile against source for anything security- or contract-relevant.

---

## 4. What the external landscape says, and where the plan should adjust

| Prior art / finding | Implication for the plan |
| --- | --- |
| **RouteLLM / FrugalGPT / xRouter** — routers retain ~95% quality at ~45–85% cost; cascades escalate on a reliability score. | Make tier routing the spine and the first proven win. But the escalation signal must **not** be model self-confidence — self-reported confidence is poorly calibrated (fluent + wrong). Escalate on *executable* signals (tests failed twice, type errors, diff outside boundary) and explicit abstention, not on the model saying it's sure. |
| **Anthropic — Building Effective Agents** (5 composable patterns). | Your design is orchestrator-workers + routing + evaluator-optimizer. Name them as such; prefer simple composable patterns over a bespoke framework. The evaluator-optimizer loop is your repair loop. |
| **Anthropic — multi-agent research** (~15× tokens; coding poorly parallelizable). | See §1. Cap interactive fan-out; reserve multi-agent for the zero-marginal-cost overnight workstream and for genuinely parallel exploration. |
| **Who&When failure attribution** (~53.5% / ~14.2% accuracy). | Structured claims = right architecture; automated attribution ≠ reliable. Deterministically checkable claims + human/test at the decisive step. |
| **LLM-as-judge bias** (self-preference, style, >50% error on hard suites). | Executable evidence is the floor; LLM-judge is calibrated triage only; same-family "independence" is compromised. |
| **Local coding models 2026** (Qwen3-Coder-Next ~58.7% SWE-bench Verified on one 24GB GPU; Kimi K2.6 / DeepSeek V4 / GLM-5.1 / Devstral; frontier still leads hard tasks at ~75–77%). | Local genuinely covers ~70–80% of routine work — validates the local tier for routine/batch/overnight. But scorecards must rate **task-fit on your repos**, not leaderboard rank (benchmarks are noisy and contamination-prone). Devstral-class for agentic/tool-use; Codestral-class for inline completion. |
| **Lethal trifecta / prompt injection** (architectural, not patchable; MCP assembles it easily; ~26% of one skill ecosystem's skills had a vuln). | Rework the security section around blast-radius (§5). |

---

## 5. Security reframe — design around the lethal trifecta, not "treat content as untrusted"

The draft's "treat external content and MCP outputs as untrusted" bullet is correct
but too weak. The actionable model is Simon Willison's **lethal trifecta**, now
treated by OWASP (June 2026) as an architectural property, not a patchable bug: an
agent that simultaneously has (1) access to private data, (2) exposure to untrusted
content, and (3) an exfiltration vector is *unconditionally* vulnerable to indirect
prompt injection, regardless of model alignment or prompt hardening.

Your internal-only scope removes *adversarial users* but does **not** clear the
trifecta, because your agents naturally assemble all three legs:

1. **Private data** — source code, and especially the "pull the most recent 20 cases"
   workstream (cases likely contain customer data).
2. **Untrusted content** — external API/interface docs fetched via MCP, plus repo
   content an attacker or a careless dependency can influence (comments, test
   fixtures, dependency READMEs, error strings, log lines). Injection attempts in
   public web content rose ~32% in late 2025–early 2026.
3. **Exfiltration vector** — outbound HTTP, link/image rendering, PR/branch creation,
   or write-capable MCP tools.

**Design rules to add:**

- **Remove a leg per role — preferably exfiltration.** Any agent that ingests
  untrusted content (external-doc researcher, context explorer reading the repo) must
  *not* also hold an outbound/write capability. Split ingestion and action into
  separate agents with separate sandbox modes. Codex `sandbox_mode` (`read-only` vs
  `workspace-write`) and per-agent `mcp_servers` allowlists are the enforcement
  mechanism.
- **Injection laundering through weak summaries.** A local/cheaper model is usually
  *less* injection-robust, and if Codex reconciles its *summary* rather than the raw
  content, an injected instruction can survive. For security-relevant context,
  reconcile against source, not the subagent's prose.
- **Your MCP and skills pack are themselves attack surface.** A context MCP that
  returns attacker-influenceable text is an injection channel; review skills/adapters
  before activation, and keep credentials out of agent context (sealed-tool / proxy
  patterns).
- **Case-data handling is now a named gate, not an open question.** Specify which case
  fields may enter a local packet or a sandbox branch, redact by default, and confirm
  the "isolated branch / sandbox" is genuinely network-isolated when real case data
  flows through it.
- **Shift to runtime detection.** Because the trifecta describes nearly every useful
  agent, add behavioral signals (unexpected outbound calls, out-of-boundary edits,
  anomalous tool sequences) via Codex hooks rather than assuming prevention.

---

## 6. Evaluation and failure attribution — make the loop real and test-anchored

The plan's shift from exhaustive verification to "evaluate outcomes, attribute
failure, improve the scaffold" is the right move. To make it robust:

- **Anchor every verdict in executable evidence.** Pass/fail is decided by tests,
  build, type-check, lint, and runtime checks. The developer is the final acceptance
  authority. LLM judgment is a pre-filter only.
- **Make structured claims deterministically checkable wherever possible.** A claim
  like "I changed only these files" is checkable against the diff; "these tests
  passed" is checkable against CI output; "this is the source-of-truth doc" is not, so
  flag it as a judgment claim requiring escalation if it becomes load-bearing.
- **Treat attribution as assistive, not authoritative.** Use the claim chain to
  *narrow* the search to a likely stage, then confirm with a deterministic check or a
  human. Do not auto-improve the scaffold on an unconfirmed LLM attribution — given
  ~14% step-level accuracy, that would train the scaffold on noise.
- **Calibrate the judge.** Track LLM-judge vs human-spot-check divergence; recalibrate
  the rubric above ~20–25%. Watch specifically for verbosity/confidence bias (the
  judge rewarding the more assertive patch).
- **Capture provenance via hooks.** `SubagentStart/Stop` and `PostToolUse` hooks
  should persist the claim/outcome log (your `structured-claims.jsonl` /
  `failure-attribution.jsonl`). For write-capable agents this is mandatory: without
  it, "Codex is accountable" has no forensic trail. Provenance is also what makes the
  scaffold "learn" — so it serves accountability and improvement at once.

---

## 7. Measurement and Experiment 0 — prove the uncertain thing, and protect the hard-to-measure metrics

This folds in the counterpoint review and corrects it in one place.

The counterpoint is right that the plan is architecture-forward and should prove the
smallest economic loop first, add a "Do not build yet" list, and define real
thresholds. Adopt those. Its three most durable points — **no captured baseline**, **no
operational definition of "equal or better code quality,"** and **decision inertia from
a now-coherent design** — are the real gaps and have survived every revision.

But the counterpoint is wrong on one thing, and it matters: it optimizes for
*smallness*, when the right target is **information value**. Experiment 0 as written
("give a cheaper tier a routine task, confirm quality holds") tests something that is
*not actually in doubt* — cheaper frontier and even local models handle routine edits
fine. It will "succeed" and teach you almost nothing.

The genuinely uncertain, load-bearing questions are:

1. **Routing precision and the misroute tax** — can the orchestrator reliably decide
   *when* to downroute, and do the savings survive the cost of the times it routes
   wrong (extra repair, escalation, developer correction)? Test on a realistic
   *mixed* stream, not a pre-sorted easy task.
2. **Structured-claim overhead** — does the claim/receipt machinery eat the savings?
   Carry a *minimal fixed receipt* in Experiment 0 specifically to measure this. (The
   counterpoint's own alternative #4 gets this right; its main "defer the machinery"
   thrust contradicts it. Defer the *predictable* thing, not the *uncertain* one.)

**Goodhart guard.** Easy-to-measure metrics (top-frontier tokens, turn counts) will
dominate the verdict and crowd out hard-to-measure ones (developer flow, repair loops,
review defects, misroute tax). Add an explicit rule: **token reduction alone is never a
pass** — at least one hard-to-measure metric must be affirmatively checked each run,
even by quick human judgment. This also tests the counterpoint's good hypothesis that
adoption improves more from *removing* SDLC steps than from *compiling* them behind
commands; let the friction audit try subtraction before assuming abstraction.

**Minimum Viable Experiment 0 (ship as its own one-page artifact):**

- Baseline: N comparable runs of the current top-frontier-heavy route on a fixed task
  set, with tokens/turns, wall-clock, repair commits, and review findings recorded.
- Treatment: the same task set through a mixed-stream tier router (top vs cheaper
  frontier), minimal fixed claim receipt attached.
- Quality proxy (define before running): e.g. post-merge repair commits within N days,
  count of blocking review findings, test pass rate — not a subjective rating.
- Pass thresholds (set numbers, not directions): e.g. "≥30% top-frontier turn
  reduction AND no increase in repair commits AND routing precision ≥ X% AND no
  hard-to-measure metric regresses."
- Kill condition: if cheaper-tier routing cannot hold the quality proxy after K
  iterations, stop and revert that piece.

---

## 8. Smaller but durable points

- **"Agents learn like workers" is a useful metaphor with a wrong mechanism.** Models
  don't learn between calls; the **scaffold** does (role files, routing rules, claim/
  outcome logs, MCP retrieval feedback, skills). The draft's "Scaffold Learning Model"
  section is correct — keep insisting the durable asset is the versioned scaffold, and
  that the same provenance log powers both accountability and improvement.
- **Maintenance is softened but not free.** Shared models + narrow internal full-stack
  domain genuinely reduce the scorecard/routing burden (one update improves many
  agents). Keep the **per-piece kill criteria** concrete and in the body (with
  thresholds), not just asserted in the acceptance list.
- **Scorecards: rate fit, not fame.** Given benchmark noise and contamination, score
  local models on *your* fixture tasks and roles, not public leaderboards. Keep the
  scorecard minimal until a failure forces a new field.
- **Latency is conditional, and you were right.** For your concurrent-case workflow,
  async/overnight latency is free or beneficial — so the interaction-mode axis is the
  correct refinement. Keep "interactive vs async/batch vs overnight" as a first-class
  routing dimension; reserve local for the latter two.
- **Complacency → instrumentation (you were right here too).** Human–human trust
  erodes the same way; the AI pipeline's advantage is that the erosion is *measurable*.
  Self-preference bias makes this concrete: a polished same-family summary will be
  over-trusted. So sample-audit clean approvals via hooks and watch gate-approval
  rates, rather than treating complacency as an unfixable worry.

---

## 9. Change punch list for the document

1. Add a top-level section distinguishing **routing (cost divider)** from **fan-out
   (cost multiplier)**; state that routing is the primary cost mechanism and subagents
   are a capability decision rationed against the ~4–15× token penalty.
2. Add a **"Built on Codex primitives, not rebuilt"** section mapping each portable
   role to `[agents]` config (model, reasoning_effort, sandbox_mode, mcp_servers),
   hooks, auto-review, skills, and `lmstudio`/`ollama` providers. Move anything Codex
   already does out of "to build."
3. Rewrite the trust language: **executable evidence is the floor; LLM-judge is
   calibrated triage; same-family review is not independent.** Demote the consensus
   tier.
4. Correct the read-only risk ordering: read-only protects the repo, not the
   reasoning; rate roles by **verification asymmetry**; start where the proof surface
   is strongest.
5. Replace the security bullet with a **lethal-trifecta blast-radius** section: split
   ingestion from action, remove the exfiltration leg from untrusted-content readers,
   reconcile against source not summaries, treat the MCP/skills pack as attack surface,
   name case-data handling as a gate, add runtime detection via hooks.
6. Add the **Minimum Viable Experiment 0** one-pager: captured baseline, mixed-stream
   routing test, defined quality proxy, numeric pass/kill thresholds, minimal claim
   receipt, Goodhart rule.
7. Reframe Experiment 0 to test **routing precision + misroute tax + claim overhead**,
   not cheaper-model capability.
8. Add a **"Do not build yet"** list (full learned router, automated attribution as
   source of truth, broad role catalog, heavy scorecards, most CLI commands) and
   upgrade the passive "these are sketches" note into an active deferral.
9. Clarify **subagents (fresh context, file handoff) vs sessions (resume/fork/reply,
   persistent context)**; note the context-opacity trade and its mitigations.
10. Keep and tighten the **scaffold-learning**, **interaction-mode**, **async/overnight**,
    and **kill-criteria** sections; make kill criteria numeric and in-body.

---

## 10. Sources consulted

Model routing / cascades
- FrugalGPT (Chen et al., arXiv:2305.05176).
- RouteLLM: Learning to Route LLMs with Preference Data (arXiv:2406.18665; ICLR 2025).
- xRouter / Router-R1 (arXiv:2510.08439 and related).
- Practitioner syntheses on routing economics and the confidence-calibration problem
  (tianpan.co; burnwise.io; portkey.ai; nexos.ai).

Agent patterns / orchestration
- Anthropic, "Building Effective AI Agents" (anthropic.com/research/building-effective-agents).
- Anthropic, "How we built our multi-agent research system"
  (anthropic.com/engineering/multi-agent-research-system) — token-multiplier and
  coding-fit findings.

Failure attribution
- "Which Agent Causes Task Failures and When?" Who&When dataset (arXiv:2505.00212;
  ICML 2025) — ~53.5% agent / ~14.2% step accuracy; follow-ups A2P, AgenTracer.

LLM-as-judge / evaluation
- Bias surveys and audits (arXiv:2410.02736; JudgeBiasBench; IJCNLP 2025 position-bias
  study; NeurIPS 2024 self-preference) and practitioner calibration guidance
  (adaline.ai; galileo.ai), including SE-specific judge auditing (arXiv:2604.16790).

Local coding models (2026)
- Open-weight/local coding model roundups and benchmarks (kilo.ai; pinggy.io;
  mindstudio.ai; promptquorum.com; overchat.ai) — Qwen3-Coder-Next, Kimi K2.6,
  DeepSeek V4, GLM-5.1, Devstral, Codestral; frontier-vs-local gap.

Codex CLI (verify against current OpenAI docs)
- OpenAI Codex docs: Subagents, CLI, MCP, Advanced/Reference config, Agents SDK guide
  (developers.openai.com/codex/*) — per-agent model/sandbox/mcp, max_depth=1, fresh
  subagent context, lmstudio/ollama providers, codex mcp-server, hooks, auto-review,
  skills; plus a third-party 2026 feature guide (codegateway.dev) for the model ladder.

Security
- Simon Willison, "The lethal trifecta for AI agents" (simonwillison.net, 2025) and
  2026 follow-ons (OWASP framing, Sophos blast-radius patterns, CSO runtime signals,
  multiple production exploit disclosures).

Note: product and model facts (Codex feature surface, model names/availability, local
model rankings) change quickly; verify the Codex and model-ladder specifics against
current OpenAI documentation before committing them to the plan.