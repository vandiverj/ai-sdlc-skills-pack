

## Feedback for SDLC document revision

### 1. Lock the architecture facts that are now settled

Bake these in as non-negotiable so the rest of the doc stops hedging:

- **Orchestrator is a frontier GPT-5.4–5.5 model**, accessed through the Codex Extension (interactive) and Codex CLI (sub-sessions). Codex Extension/CLI are *harnesses*, not models — say this explicitly, because the doc currently blurs tool and model.
- **Drop Pi CLI entirely.** Replace every reference with Codex CLI. Experiment 0 should be reframed as "reproduce the token-reduction signal," not "reproduce the Pi flow."
- **Context comes from the in-house MCP**, which has its own feedback/eval loop. The context-explorer role should be described as *thin reasoning over MCP retrieval*, not a free-roaming local agent. This matters for §3 below.
- **This is internal-only, full-stack web development.** Narrow domain + internal users + shared models is a real simplification and the doc should claim that benefit openly: fewer scorecards, fewer capability dimensions, one model update propagates to many agents.

### 2. The biggest reframe: verification → evaluation + failure attribution

You're right that exhaustive per-call verification is the wrong target and would erase the savings. The replacement you described — let tests and the developer be the source of truth on *whether the task was met*, then attribute *which stage caused a failure* and improve that stage — is the correct model. It turns my "verification asymmetry" concern into a learning loop instead of an inspection tax.

But the hard part is **credit assignment**, and the doc needs to design for it explicitly or the loop won't close. In an explorer → implementer → verifier chain, "the task failed" doesn't tell you *who* failed. The cheap, durable fix is to make every stage emit a small **structured claim** the orchestrator records:

- explorer: "these files are relevant, these are source-of-truth, here's what I'm unsure about"
- implementer: "I changed these lines for this reason, within this boundary"
- verifier: "these checks ran, here's pass/fail/cap"

When the outcome fails, you replay the recorded claims and find the *first false one*. That localizes the failure to a stage (or to the MCP context layer, or to the orchestrator's gap-filling) without a human re-tracing the whole run. This is the same lightweight provenance I raised earlier for accountability — except now it's motivated by *your* goal: it's literally what lets an "agent setup get better with experience." Frame it that way in the doc.

### 3. Correct the "agents improve like workers" mental model — it's load-bearing

The worker metaphor is useful but slightly wrong in a way that will mislead whoever maintains this. A stateless model does **not** learn between calls. What accumulates experience is the **scaffold**: the role packets, routing rules, the MCP's retrieval/feedback data, and the structured-claim history from §2. So "the agent gets better on the job" really means "our configuration of the agent gets better, and that improvement is a versioned artifact we own."

This is worth stating because it reframes my earlier maintenance-cost worry in your favor: the maintenance *is* the learning. You're not paying upkeep on a dead asset; you're accruing a tuned scaffold. The doc should name where that experience lives (packet templates + routing matrix + MCP feedback store + claim/outcome log) and treat those as the durable IP — separate from the swappable model behind them.

### 4. Elevate tiered frontier routing — it's your strongest, lowest-risk win

You mentioned almost in passing that agents can point to *lower-tier frontier models*, and that without orchestrated routing you pay GPT-5.5 to rename a CSS class because the developer won't swap models mid-chat. That observation deserves to be near the top of the document, not buried.

This is the most defensible part of the whole plan: it captures most of the cost savings, avoids local-hardware latency and quality risk entirely, and the routing logic is identical to the local-routing logic. I'd restructure the value proposition into three tiers with clear triggers:

- **Frontier (5.5):** orchestration, ambiguity, anything that must land on the first try and blocks a developer.
- **Cheaper frontier tier:** routine bounded edits, mechanical changes, docs, "rename the class" work. *This is where the dev-won't-swap-mid-chat money is leaking today.*
- **Local:** speculative and batchable work (see §5).

Prove tier-2 routing first. It's the fastest payback and lowest risk, and it de-risks the local work by establishing the routing machinery on a forgiving substrate.

### 5. Reframe local models as batch/speculative workers, not interactive copilots

You correctly pushed back on my latency concern. For *your* workflow — multiple concurrent cases, async work — local-model latency isn't flow-breaking, because the human context-switches anyway. So the doc should split the cost model by **interaction mode**, not just task class:

- **Interactive / blocking:** latency is expensive; prefer fast frontier tiers.
- **Async / batch / overnight:** latency is nearly free, and local is ideal.

Your overnight idea is the best application in the whole document and should be promoted to a first-class workstream: idle-machine local compute pulling recent cases, finding patterns, and proposing fixes on isolated branches. The economic logic is clean and worth stating as a principle:

> Local models monetize idle compute and tolerate a low hit rate. Frontier models are for work that must succeed on the first try. A speculative pass that would be irrational at frontier prices ("one win a week") is rational at local prices because the marginal cost per attempt is near zero.

That single principle justifies local models far better than "they're cheaper per token" and naturally sorts work to the right tier.

Two cautions to write in alongside it: the sandbox must be *genuinely* isolated because the case data flowing through it is real (see §7), and you need a quality gate on the auto-generated branches so they don't become a review-burden firehose — a low hit rate is fine only if rejecting the misses is cheap.

### 6. Persistent sub-sessions: good idea, but name the trade it introduces

Continuing the same Codex CLI chat until the task is done and returning only a summary is the right call — it cuts the reconciliation round-trips I worried about. But it introduces a *new* risk the doc should acknowledge: the sub-session accumulates its own working context that the orchestrator never sees, so a wrong assumption made early can compound silently inside the session, and only a (possibly laundered) summary crosses back. Mitigations to specify: have the sub-session return its **structured claims** (§2), not just prose; cap session length/turns before forced handback; and for anything security- or contract-relevant, reconcile against source rather than the summary.

### 7. Internal-only changes the threat model — but doesn't clear data handling

Internal-only correctly removes most *adversarial* prompt-injection concern, and the doc should say so and stop over-weighting it. But "pull the most recent 20 cases" means **customer/case data is flowing into local and sandbox models**, so data-handling is now the live privacy question, not injection. The doc should state plainly what case data may enter a local packet or sandbox branch, what must be redacted, and confirm the sandbox can't leak that data outward. Injection still matters in one narrow place: external docs the MCP fetches for API/interface changes are untrusted input even on an internal system.

### 8. On complacency — you're right, so make it a metric, not a worry

Your rebuttal lands: humans under-check trusted humans too, and the advantage of the AI pipeline is that the failure is *legible and instrumentable*. So convert the concern into the thing you're already good at — instrumentation. Track gate approval rates, and periodically sample-audit changes that were approved with no comment. The point isn't that AI complacency is worse; it's that it sets in faster (volume + polish) and, uniquely, you can *measure* it. That's an actionable safeguard a team will actually follow, which is exactly your stated bar.

### 9. Keep one discipline from before, softened

Shared models + narrow domain genuinely reduce the maintenance burden I flagged, so soften that section — but keep an explicit **kill/abandon criterion**. For a small internal team the right test is simple and honest: *if the scaffold maintenance (routing, packets, MCP feedback, scorecards) costs more developer-hours than the tokens it saves, or becomes the top source of developer confusion in the friction audit, revert that piece to direct frontier orchestration.* A design that can be killed per-piece won't accrete dead weight.

---

### Concrete changes to make to the document

1. Replace all Pi CLI references with Codex CLI; clarify Extension/CLI are harnesses, model is GPT-5.4–5.5.
2. Add a **three-tier routing** section (frontier / cheaper-frontier / local) and make tier-2 the first thing to prove.
3. Replace "exhaustive verification" language with **evaluation + structured per-stage claims + failure attribution**; define the claim format.
4. Add an **interaction-mode** axis (interactive vs async/batch) to the cost model; promote overnight/speculative local work to its own workstream with the EV principle and the isolation + review-burden cautions.
5. Reframe "agents learn like workers" as "the **scaffold** accumulates experience"; list what that scaffold is and treat it as the durable asset.
6. Add the **persistent sub-session** trade-off (context opacity) and its mitigations.
7. Rewrite the security/privacy section: down-weight adversarial injection (internal-only), up-weight **case-data handling** in local packets and sandboxes; keep external-doc fetch as untrusted.
8. Convert the complacency guardrail into **gate-approval instrumentation + spot audits**.
9. Soften the maintenance concern given shared models/narrow domain, but add an explicit **per-piece kill criterion**.
