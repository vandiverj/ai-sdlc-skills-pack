# Provider-Independent SDLC Research Review

Status: Research summary and recommendation draft
Date: 2026-06-18
Related plan: `docs/process-improvement/codex-local-model-sdlc-overview.md`

## Source Filter

This review intentionally avoids using research, product guidance, benchmarks, blog posts, or claims from frontier subscription vendors and adjacent platform providers with a strong incentive to promote heavier frontier-model usage. Excluded as evidence: OpenAI, Anthropic, Google/DeepMind, Microsoft/GitHub, Amazon/AWS, Meta, xAI, Mistral, and similar model/platform vendors.

Sources used are primarily academic papers, NIST, OWASP, and independent evaluation or human-factors work. Some papers evaluate proprietary models or commercial coding tools, but the cited claim comes from a non-provider research source rather than from the provider promoting the tool.

## Executive Summary

The current plan is directionally sound on its most important corrections: routing before fan-out, executable evidence before model judgment, portable runtime adapters, local models for async/batch work, and structured claims as the scaffold learning substrate.

The provider-independent review makes the plan more skeptical in one important way: before proving multi-agent orchestration, the SDLC should prove that a simpler non-agent or mostly deterministic route cannot capture the same value. Independent software-engineering agent research shows that simple localization/repair/validation pipelines can compete with more complex agent systems on SWE-bench Lite, while productivity studies show AI tooling can slow experienced developers when review, waiting, and cleanup costs are counted.

Recommendation: modify the plan, do not replace it. Add an `Experiment -1` that compares the current SDLC against a simplified non-agent baseline before Experiment 0. Keep tier routing as the first automation target, but require it to beat the simplified baseline, not only the current frontier-heavy workflow. Treat local models and subagents as candidates that must prove net value after review burden, misroute repair, infrastructure cost, and maintenance load are counted.

## Key Findings

### 1. Simpler baselines can beat agent complexity

`Agentless` directly challenges the assumption that autonomous coding agents are always needed. It uses a three-phase localization, repair, and patch-validation approach without letting the model freely operate tools or plan future actions, and reports strong SWE-bench Lite results with low cost compared with open-source agents. The paper's broader implication is more important than the exact benchmark score: complex agent loops need to beat a simple, interpretable baseline before they deserve permanent process weight.

Application to our plan:

- Add a non-agent simplification baseline before multi-agent experiments.
- Treat "agent role" as one possible implementation of a phase, not the default phase shape.
- Make localization, repair, and validation explicit phases in the SDLC packet model.

Plan update recommended:

```text
Experiment -1: Simplified SDLC baseline
Compare current SDLC route vs deterministic/helper-driven localization, repair, and validation with no delegated subagents.
Only proceed to broader delegation if routing/delegation beats this baseline on quality, total cost, and developer friction.
```

Source: [Agentless: Demystifying LLM-based Software Engineering Agents](https://arxiv.org/abs/2407.01489)

### 2. Agent-computer interface design matters more than agent count

`SWE-agent` argues that language-model agents are end users of software tools and need a tailored interface. Its relevant lesson for the SDLC is not "use this specific agent"; it is that command surfaces, file-edit primitives, navigation, and test feedback shape performance. A weak interface can make a strong model inefficient, and a clear interface can reduce context waste.

Application to our plan:

- Prioritize better SDLC helper outputs, packet schemas, and command surfaces before adding more roles.
- Design the runtime adapter contract around the interface the agent receives: allowed actions, file context, command affordances, feedback shape, and stop conditions.
- Evaluate adapter quality separately from model quality.

Plan update recommended:

- Add `agent-interface quality` to the runtime capability matrix.
- Add an adapter test: can a delegated role find files, edit only its boundary, run approved checks, and report evidence without extra human prompting?

Source: [SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering](https://arxiv.org/abs/2405.15793)

### 3. Routing and cascades are supported, but must be tested against real misroute cost

Independent routing work supports the plan's "routing first" stance. `FrugalGPT` describes prompt adaptation, approximation, and cascades as cost-reduction strategies, and `RouteLLM` shows that model routers can reduce cost while preserving quality in some settings.

The caution is that benchmark routing is easier than SDLC routing. Coding work has hidden costs: failed routes create repair loops, context reloads, review burden, and human interruption. The plan already added misroute tax; this review recommends making misroute tax a hard go/no-go criterion.

Application to our plan:

- Keep tier routing as the first automation target.
- Do not call routing successful unless it beats both the current baseline and the simplified non-agent baseline.
- Route on observable signals, not model confidence.

Plan update recommended:

- Experiment 0 should include three arms: current route, simplified non-agent route, tier-routed route.
- A route only passes if it reduces top-frontier use and does not increase total repair/review burden.

Sources: [FrugalGPT](https://arxiv.org/abs/2305.05176), [RouteLLM](https://arxiv.org/abs/2406.18665)

### 4. Agentic coding cost is stochastic and dominated by input/context tokens

A 2026 token-consumption study on agentic coding tasks found agentic work can consume far more tokens than code chat/reasoning, with input tokens driving cost, large run-to-run variance, and no guarantee that higher token usage improves accuracy. It also found models underestimate their own token costs.

Application to our plan:

- Local models reduce cloud spend, but they do not remove coordination cost, wall-clock cost, review cost, or context-management cost.
- Cost prediction should come from measured run ledgers, not model or human estimates.
- "The model thinks this is simple" should not be used as a budget forecast.

Plan update recommended:

- Add a `run cost ledger` to Experiment -1 and Experiment 0:

```text
model calls:
input/output tokens where available:
context packet size:
agent turns:
tool calls:
wall-clock:
human interruptions:
repair loops:
review findings:
accepted/rejected agent claims:
local hardware/runtime constraints:
```

Source: [How Do AI Agents Spend Your Money?](https://arxiv.org/abs/2604.22750)

### 5. Long context is not a substitute for context engineering

`Lost in the Middle` shows that long-context models may fail to use relevant information robustly depending on where it appears in the context. Repository-level work makes this worse because relevant facts are scattered across files, tests, configs, docs, generated artifacts, and prior decisions.

Application to our plan:

- The plan is right to use compiled context packets instead of whole-repo dumps.
- Context packets should be retrieval-backed, ordered by relevance, and split by claim type.
- Subagents should not receive broad context just because the context window permits it.

Plan update recommended:

- Add packet ordering rules:

```text
1. Original human request.
2. Scope and stop rules.
3. Source-of-truth files.
4. Directly relevant code excerpts.
5. Test/evidence commands.
6. Uncertainty and excluded context.
```

Source: [Lost in the Middle](https://arxiv.org/abs/2307.03172)

### 6. Public benchmarks are useful, but project-local evals matter more

SWE-bench demonstrates that real issue resolution requires multi-file coordination, execution environments, long-context reasoning, and repository understanding. LiveCodeBench highlights contamination and overfitting risks in code benchmarks. The implication is that public leaderboards should not decide local routing policy.

Application to our plan:

- Keep the model capability profile, but make it fixture-first and repo-first.
- Treat public benchmarks as weak priors only.
- Build small internal evaluation sets from sanitized tasks, seeded defects, known fixes, and approved fixture or dry-run cases.

Plan update recommended:

- Add `local eval provenance` to the model profile:

```text
Fixture:
Repo/task family:
Known acceptance criteria:
Proof surface:
Model/runtime/scaffold version:
Pass/fail:
Repair effort:
Reviewer findings:
Human acceptance:
```

Sources: [SWE-bench](https://arxiv.org/abs/2310.06770), [LiveCodeBench](https://arxiv.org/abs/2403.07974)

### 7. AI coding productivity gains are not automatic and may hide maintenance burden

METR's randomized controlled trial found experienced open-source developers were slower with early-2025 AI tools despite expecting and later perceiving speedups. Another open-source analysis found AI-assisted productivity gains can shift review/rework burden onto experienced maintainers, with more review load and reduced original-code productivity among core developers.

Application to our plan:

- Developer perception is not enough. The plan needs measured friction and review burden.
- "Small business token savings" can be defeated if the business owner becomes the cleanup bottleneck.
- The SDLC should count experienced-developer review time as a first-class cost.

Plan update recommended:

- Add maintenance burden to pass/fail thresholds:

```text
No route passes if it reduces frontier tokens but increases senior review/rework load.
```

- Add a lightweight post-run question:

```text
Did this route make the work easier to finish, or only feel easier while shifting cleanup later?
```

Sources: [METR productivity RCT](https://arxiv.org/abs/2507.09089), [AI-assisted programming and maintenance burden](https://arxiv.org/abs/2510.10165)

### 8. Automated failure attribution is not yet reliable enough to govern process changes

Who&When found automated failure attribution in multi-agent systems difficult: the best method identified responsible agents much more reliably than exact failing steps, and step-level attribution remained poor. Later work tries to improve attribution with hypothesis verification and counterfactual replay, but the safe practical conclusion remains: attribution should propose where to inspect, not automatically rewrite routing policy.

Application to our plan:

- The plan is correct to make structured claims and failure attribution assistive.
- Scaffold changes should require deterministic or human confirmation.
- Failure logs should support multiple plausible attributions when evidence is ambiguous.

Plan update recommended:

- Add an attribution confidence category:

```text
confirmed by deterministic check
confirmed by human review
plausible but unconfirmed
ambiguous/multiple plausible stages
```

Sources: [Who&When failure attribution](https://arxiv.org/abs/2505.00212), [VerifyMAS](https://arxiv.org/abs/2605.17467)

### 9. LLM-as-judge is useful triage, not a quality oracle

Independent LLM-as-judge studies document position bias, self-preference bias, and broader reliability concerns. This supports the current plan's rule that model review is not proof.

Application to our plan:

- Keep deterministic checks as the quality floor.
- Avoid same-family "independent review" claims.
- If model review is used, randomize order, hide implementer confidence, and sample against human review.

Plan update recommended:

- Add an `LLM review hygiene` checklist:

```text
candidate order randomized when comparing outputs:
reviewer does not see implementer confidence:
reviewer cites file/line or command evidence:
judge outcome sampled against human review:
judge cannot close a gate without deterministic or human evidence:
```

Sources: [Position Bias in LLM-as-a-Judge](https://arxiv.org/abs/2406.07791), [Self-Preference Bias in LLM-as-a-Judge](https://arxiv.org/abs/2410.21819), [A Survey on LLM-as-a-Judge](https://arxiv.org/abs/2411.15594)

### 10. Security guidance supports least privilege, supply-chain review, and bounded agency

OWASP's LLM Top 10 includes prompt injection, sensitive information disclosure, supply chain, improper output handling, excessive agency, vector/embedding weaknesses, misinformation, and unbounded consumption. NIST SSDF recommends integrating secure development practices into the SDLC rather than bolting them on afterward. NIST AI RMF emphasizes mapping, measuring, managing, and governing AI risks across the lifecycle.

Application to our plan:

- The plan's blast-radius rule is correct.
- Generated skills, runtime adapters, MCP servers, local model packages, and prompt templates are supply-chain surfaces.
- "Local model" does not mean "safe"; local transcripts, model downloads, plugins, and tool permissions still need controls.

Plan update recommended:

- Add an `AI SDLC supply-chain checklist`:

```text
source of model/runtime/tool:
license and update channel:
network behavior:
local logging behavior:
permissions requested:
MCP/tool list:
prompt/template provenance:
adapter review status:
rollback path:
```

Sources: [OWASP LLM Top 10 2025](https://genai.owasp.org/llm-top-10/), [OWASP State of Agentic AI Security and Governance 2.01](https://genai.owasp.org/resource/state-of-agentic-ai-security-and-governance/), [NIST SSDF SP 800-218](https://csrc.nist.gov/pubs/sp/800/218/final), [NIST AI RMF](https://airc.nist.gov/airmf-resources/airmf/)

### 11. Human oversight needs reviewability, not just approval prompts

Human-factors and algorithmic-accountability work warns that automation can create overreliance, under-practiced intervention skills, and poor accountability if the record does not support later review. Parasuraman and Riley's automation taxonomy is useful here: automation can be used, misused through overreliance, disused when unreliable, or abused when designers automate without adequate regard for human performance. Reviewability is broader than explanations: the system needs decision records, context, evidence, and process state that can be audited later.

Application to our plan:

- Gate approval instrumentation is good, but it should measure whether approvals are meaningful.
- Structured claims should be designed for later review by a human who did not participate in the run.
- The normal developer path must remain teachable; otherwise, people will approve without understanding.

Plan update recommended:

- Add `reviewability` as an acceptance criterion:

```text
A future developer can reconstruct why a route was chosen, what evidence was used, what was delegated, what was rejected, and who approved the gate.
```

Sources: [Reviewable Automated Decision-Making](https://arxiv.org/abs/2102.04201), [Humans and Automation: Use, Misuse, Disuse, Abuse](https://doi.org/10.1518/001872097778543886)

## Bias-Aware Counterpoint

Current favored position:
Codex/frontier-orchestrated SDLC routing with bounded cheaper/local agents can reduce cost and preserve quality.

Strongest opposing argument:
The plan may still be too architecture-forward. A simpler SDLC with better deterministic helpers, smaller context packets, and a localization/repair/validation loop may capture most of the value without the coordination cost of delegated agents or runtime adapters.

Assumptions challenged:

- That local agents are the best route to token reduction.
- That routing should be compared only against the current frontier-heavy route.
- That developer-perceived flow improvement predicts actual productivity.
- That model capability is the main bottleneck, rather than interface design, context quality, review burden, and maintenance cost.

Recommendation:
Modify the plan. Keep portable routing and local-model experimentation, but add the simplified non-agent baseline and require every agent/runtime addition to beat it.

## Recommended Updates To The Plan

1. Add `Experiment -1: Simplified SDLC baseline`.
   Compare current SDLC, simplified non-agent SDLC, and later routed/delegated SDLC.

2. Change Experiment 0 from two arms to three arms:
   current route, simplified route, tier-routed route.

3. Add a hard pass rule:
   no route passes on token reduction alone, and no route passes if senior review/rework burden increases.

4. Add `reviewability` as a named quality attribute.
   The artifact should support later reconstruction of route, evidence, delegation, rejection, and approval.

5. Add `agent-interface quality` to the runtime capability matrix.
   Measure whether the runtime lets the agent act with precise file, command, diff, and evidence boundaries.

6. Add local eval provenance to model scorecards.
   Public benchmark rank should never be enough to route local work.

7. Add an AI SDLC supply-chain checklist.
   Treat models, local runtimes, adapters, MCP servers, skills, and prompt templates as review surfaces.

8. Add an attribution confidence category.
   Scaffold changes require deterministic or human confirmation.

9. Add LLM review hygiene.
   Randomize candidate order when possible, hide implementer confidence, require citations, and sample model-review output against human review.

10. Add a "no runtime lock-in beyond MCP" escape hatch.
    MCP is useful, but the minimum portable contract should still work as plain files plus command invocation plus structured JSON/Markdown output.

## Suggested Text For The Main Plan

```text
Experiment -1: Simplified SDLC baseline

Before proving multi-agent orchestration, prove that the same gains cannot be captured by a simpler SDLC route.

Baseline A:
Current frontier-heavy SDLC path.

Baseline B:
Simplified localization -> repair -> validation path with deterministic helper output, smaller context packets, and no delegated subagents.

Treatment:
Tier-routed or delegated route.

Pass condition:
The treatment must beat both baselines on total workflow cost, deterministic evidence quality, blocking review findings, developer friction, and senior review/rework burden. Token reduction alone is not sufficient.
```

## Plan Verdict

The main plan should continue, but its first proof should become more skeptical:

```text
First prove the SDLC can get simpler.
Then prove tier routing beats that simpler route.
Then prove local/delegated agents beat tier routing for specific roles.
```

That ordering best protects against provider bias, user enthusiasm bias, and architecture inertia.
