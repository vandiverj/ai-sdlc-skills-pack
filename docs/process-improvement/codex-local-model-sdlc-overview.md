# Codex Local-Model SDLC Orchestration Overview

Status: Final planning overview
Promotion state: Candidate
Branch: CodexSdlc
Last updated: 2026-06-18

## Purpose

This document sketches a new AI SDLC orchestration direction for using the Codex Extension and Codex CLI as the first reference harnesses around a frontier GPT-5.4-5.5 orchestrator while routing bounded work to deterministic tools, cheaper frontier tiers, and local LM Studio models.

This is the final overview plan, not a direct implementation specification. It defines the target operating model, durable principles, experiment sequence, and acceptance gates. Concrete implementation should happen through the follow-on artifacts named later in this document, with each feature promoted only after evidence from the relevant experiment.

The goal is not to assume the current SDLC is perfect and bolt local models onto it. The goal is to use local-model orchestration as a forcing function to reduce SDLC friction, lower token churn, and improve the workflow while preserving the things the SDLC already protects: scope control, context quality, safe edit boundaries, deterministic verification, reviewable evidence, and human approval gates.

The business pressure is practical: a small business cannot treat top-tier frontier-model tokens as an unlimited default for every task. The workflow should reserve the strongest frontier model for orchestration, hard judgment, unresolved ambiguity, and high-risk decisions, while using cheaper frontier tiers, deterministic tools, or local agents for simpler work when they can produce the same quality of result.

The human-orchestration pressure is equally practical. The current daily workflow already approximates the "simple baseline": deterministic commands, hand-managed context, manual planning, manual review, and ad hoc model delegation coordinated by the developer. That proves the pieces can work, but it does not release the human from maintaining the process. The target is not to preserve that baseline; it is to measure it, compile repeated mechanics into the SDLC control plane, and delegate bounded work only where it reduces total human orchestration burden without weakening quality.

The adoption pressure is just as important. This should become understandable enough that other developers can use it without needing to learn every internal SDLC skill, packet, and agent boundary on day one. Some learning curve is acceptable; hidden complexity and fragile ritual are not.

The portability pressure is now explicit. Codex is the pilot and reference implementation because it is the current primary developer surface, but the SDLC policy must not become trapped inside Codex-specific configuration. The durable source of truth should be portable role definitions, prompt packets, routing rules, evidence contracts, and runtime-adapter contracts that can be translated to Claude Code, Pi, future Codex surfaces, or another coding runtime with minimal rework.

The initial target domain is internal-only full-stack web development. That narrower domain matters: it reduces adversarial exposure, narrows the agent capability matrix, lets shared model/routing updates improve many agents at once, and allows one in-house MCP/context layer to become the primary retrieval substrate.

## Starting Point

Settled architecture facts for the current pilot:

- The primary orchestrator is a frontier GPT-5.4-5.5 model.
- Codex Extension and Codex CLI are harnesses for invoking and supervising work; they are not the model.
- Codex Extension is the interactive developer surface.
- Codex CLI is the first reference sub-session runner to prove the workflow.
- The in-house MCP is the primary context source and has its own feedback/evaluation loop.
- Context exploration should be thin reasoning over MCP retrieval and local repo facts, not free-roaming local-agent discovery.
- The first domain is internal-only full-stack web development, not arbitrary public/open-domain software work.

Settled portability facts:

- Codex-specific config is a runtime adapter, not the SDLC source of truth.
- The same portable packet and structured-claim contract should work through Codex CLI, Claude Code, Pi, or another runtime if that runtime can receive a task packet, apply bounded tools, and return a reviewable response packet.
- Runtime adapters may map model names, tool names, sandbox permissions, hooks, MCP config, and file formats, but they must not silently change role authority, evidence requirements, Git authority, or stop conditions.
- If a future runtime has better native primitives, the SDLC should map to those primitives rather than preserve a Codex-shaped implementation for its own sake.

The current skills pack is a useful baseline, not a sacred design. It already has most of the conceptual pieces:

- `run-sdlc` is the top-level router.
- `classify-work` decides work class, risk, context depth, dirty surfaces, gates, and reclassification triggers.
- The helper CLI acts as a local-first control plane for task state, tool inventory, evidence, scope, verification, QA, finish, and role packets.
- `agents` owns portable agent roles, model tiers, delegation patterns, runtime adapters, and review boundaries.
- `agents/*.md` defines current portable roles: implementation worker, verification worker, independent reviewer, release handoff worker, and process learning reviewer.
- `templates/docs/agents/*` already describes downstream project agent strategy, catalog, model-tier policy, delegation patterns, runtime adapters, and runtime practical guidance.
- `templates/adapters/codex/agent.toml` already gives a thin Codex runtime-adapter shape.
- AI/agent security guidance already treats generated agents, MCPs, adapters, tool calls, local context, and automation authority as review surfaces.

The missing piece is a concrete multi-tier routing and runtime-adapter layer: how the SDLC decides when to use the top frontier model, a cheaper frontier tier, deterministic tooling, or a local model role; how the selected runtime invokes that role; what context it receives; which tools it may touch; how results are reconciled; and how cost/quality tradeoffs are measured.

The existing SDLC may also need to change because local agents alter the workflow shape. If orchestration exposes repeated friction, redundant context loading, oversized prompts, unclear gates, too many artifacts, or hard-to-explain steps, that is evidence for improving the SDLC itself.

Known early signal:
A manual experiment where Codex was instructed to run delegated agent work appeared to reduce coding-system token usage. Treat this as a useful signal, not proof. The next step is to reproduce the signal with a captured baseline and measure whether the reduction holds after accounting for misroutes, retries, repair loops, evaluation, review, final code quality, and developer friction.

## Working Glossary

Use these terms consistently until a dedicated glossary replaces this section.

| Term | Meaning |
| --- | --- |
| Orchestrator | The accountable top-level agent/session that preserves human intent, routes work, reconciles evidence, and stops at human gates. Codex is the pilot orchestrator surface. |
| Runtime | The tool environment that executes an agent or session, such as Codex CLI, Codex Extension, Claude Code, Pi, or another coding harness. |
| Runtime adapter | A thin translation layer from portable SDLC roles/packets into runtime-specific files, commands, model names, permissions, and caps. Use `runtime-adapter` as the compound adjective and use `adapter` only as shorthand when the surrounding section already names runtime adapters. |
| Prompt packet | A model-facing instruction packet derived from portable policy, selected context, constraints, and required output shape. |
| Model tier | Abstract capability/cost class such as deterministic, fast, standard, deep, local-fast, local-standard, or consensus. Avoid hard-coding model names in portable policy. |
| Model capability profile | A versioned evidence record for how a specific model/runtime/scaffold combination performs for specific roles, task shapes, tools, and output contracts. |
| Model capability drift | A change in model behavior, runtime behavior, scaffold behavior, tooling, or observed task performance that makes an existing model capability profile stale. |
| Local agent | A bounded role agent backed by a local model/runtime, usually for async, batch, review, context, or low-risk bounded work. |
| Delegated agent | Any bounded role agent or sub-session invoked by the orchestrator. It may run on a local model, cheaper frontier tier, top frontier tier, or runtime-native subagent. |
| Role packet | The task-specific input packet for a delegated role: scope, context, tools, evidence, stop rules, and output expectations. |
| Context packet | A compact, phase-specific input bundle of selected request, source artifacts, excerpts, constraints, uncertainty, and stop rules. |
| Evidence packet | A bundle of verification artifacts such as commands, outputs, logs, screenshots, source references, caps, and evidence gaps. |
| Response packet | The structured output from a delegated role: status, findings, evidence, uncertainty, boundary check, and next action. |
| Structured claim | A specific claim with kind, evidence/source, uncertainty, boundary status, and escalation/cap information. Use `structured-claim` as the compound adjective. |
| Evidence contract | The proof required for a role or phase to count as complete. It should name deterministic checks where available and human/model judgment where unavoidable. |
| Done contract | The role-specific completion definition: required output, required evidence, stop conditions, and what must be escalated instead of guessed. |
| Intent trace | A record that preserves the original developer request, interpreted objective, acceptance checklist, plan mapping, adjustments, and final outcome mapping. |
| Control plane | The deterministic SDLC helper layer that tracks task state, assembles packets, records evidence, manages tool/runtime inventory, and reduces repeated model reasoning. |
| Human orchestration burden | Work the developer must manually coordinate: prompts, handoffs, context selection, check selection, reconciliation, repair, and finish decisions. |
| Knowledge layer | A searchable, provenance-aware learning and retrieval layer that points agents to authoritative artifacts and captures reusable task/system/process knowledge without becoming the source of truth. |
| Knowledge envelope | The required metadata around a knowledge candidate: schema version, class, claim, source artifacts, anchors, confidence, sensitivity, owner, and review status. The gateway enforces the envelope, not content correctness. |
| Anchor | A deterministic dependency reference for a knowledge record, such as a file path, symbol, blob/commit hash, test ID, contract version, migration version, route name, or external version marker. |
| Drift signal | A cheap signal that a dependency changed and related knowledge, model scorecards, or routing rules need revalidation. |
| Retrieval eval set | A curated set of questions and expected source-of-truth artifacts used to measure whether retrieval surfaces the right context within a small context budget. |
| Champion/challenger | A controlled optimization protocol where one retrieval/configuration knob changes at a time and only replaces the current champion if it beats a held-out eval slice within the efficiency budget. |
| Staleness budget | The maximum time or change distance a model-curated record may remain trusted without fresh confirmation. Past the budget, the system should re-verify rather than trust forever. |
| Source of truth | Code, tests, contracts, PRDs, ADRs, application model, feature context, AGENTS.md, and approved durable docs. Retrieval output points to truth; it does not replace it. Use `source-of-truth` as the adjective form. |
| Insight consolidation | An offline/local process that deduplicates, classifies, links, and summarizes captured learnings so future retrieval improves. It does not silently change source-of-truth artifacts. |

## Working Hypothesis

Hypothesis:
Codex can stay accountable for SDLC routing, human-facing decisions, and final synthesis while routing bounded work to the right execution tier: deterministic tools, cheaper frontier models, or local LM Studio models. At the same time, the SDLC can become easier to use by compiling the complexity of agent routing, context selection, evaluation, and evidence gates into simple developer-facing commands and packets.

Failure mode it addresses:
The top frontier model is doing too much work that could be handled by cheaper frontier tiers, deterministic tools, or local models, while current delegated-agent use lacks enough SDLC structure to be trusted for multi-step software work. The current SDLC also risks becoming too expensive in tokens and too hard to explain if every phase is mediated by the strongest model.

Expected agent behavior change:
Codex routes work through explicit role packets, sends smaller context bundles to cheaper model tiers or local models, records structured claims from each stage, reconciles outputs instead of accepting summaries directly, and escalates to stronger models only when evidence or risk requires it.

Expected developer experience change:
The developer starts from VS Code/Codex as usual, but the heavy lifting can be shifted to local role agents where practical. The visible workflow remains one orchestrated SDLC run rather than a pile of disconnected model chats. The developer should be able to understand the route, agent roles, evidence, caps, and next decision without reading the entire skills pack.

Expected code-quality change:
Delegated agents contribute only inside bounded roles. Deterministic checks, structured claims, outcome evaluation, independent review when needed, and human approvals remain the quality floor.

How we will know it worked:
On fixture and real tasks, top-frontier usage drops or becomes more targeted while final diffs, evaluation evidence, QA handoffs, and review findings remain equal or better than the baseline. Developer-visible friction should also drop: fewer repeated prompts, fewer unclear packets, fewer unexplained gates, and fewer times the human has to understand internal process mechanics to continue.

How it could make things worse:
Too many local agents could add noise, produce shallow reviews, hide accountability, leak context, duplicate work, or create false confidence from model agreement.

## Research-Backed Reframes

### 0. The Simple Baseline Is Already The Human-Orchestrated Pain Point

Provider-independent research correctly warns that a simpler localization, repair, and validation loop can outperform unnecessary agent complexity. In this plan, however, the simple baseline is not hypothetical. It is close to the current daily workflow: the human manually coordinates context, tools, prompts, checks, reviews, and handoffs.

That baseline should be measured before it is automated, but it should not become the long-term target. The improvement target is:

```text
same or better localization -> repair -> validation quality
+ less human orchestration and repeated prompt/process maintenance
+ clearer route/evidence records
+ lower top-frontier token churn
```

Operating rule:

```text
Do not replace frontier token burden with human orchestration burden.
```

### 1. Routing Is The Cost Divider; Fan-Out Is Usually A Cost Multiplier

The plan should not treat "delegate to a cheaper/local agent" as one mechanism.

Tier routing is the primary cost-control mechanism. It sends each unit of work to the cheapest tier that can satisfy the evidence requirement, then escalates on risk, failed checks, ambiguity, or boundary drift.

Subagent fan-out is mostly a capability mechanism. It can help when work is genuinely parallel, when it protects the main context from noisy intermediate output, or when local idle compute makes failed speculative attempts cheap. It should not be sold as an automatic cost win. Each subagent starts its own model/tool loop and adds coordination, context, review, and reconciliation cost.

Operating rule:

```text
Lead with routing. Ration agents.
```

### 2. Verification Asymmetry Decides Whether Delegation Is Worth It

Delegation only pays when checking the delegated output is cheaper than producing the output directly with the orchestrator.

Good delegation targets have strong proof surfaces:

- deterministic command output,
- tests,
- type checks,
- lint/build results,
- small diffs inside an approved boundary,
- explicit file references,
- schema-validated structured output.

Weak delegation targets require caution even when they are read-only:

- broad context exploration,
- "source of truth" selection,
- hidden dependency discovery,
- security/privacy judgment,
- public contract interpretation,
- claims that are only supported by another model's prose.

Read-only protects the repository from direct damage. It does not protect the SDLC from silent reasoning errors. A context explorer that misses the important file can poison every later stage, so context roles must be MCP-backed, source-linked, uncertainty-aware, and cheaply spot-checkable.

### 3. Build Policy And Packets, Not Runtime Plumbing

Modern coding runtimes already provide many of the primitives this plan needs: custom agents/subagents, model selection, sandbox modes, MCP, hooks, noninteractive execution, JSON or schema-shaped output, and resumable sessions. The durable SDLC work is not to rebuild those primitives. The durable work is to define:

- routing policy,
- portable role definitions,
- runtime-adapter contract,
- context packet and evidence packet shape,
- structured-claim schema,
- executable evaluation harness,
- security/privacy blast-radius rules,
- friction and token-churn audit.

When a runtime already has a native primitive, use it through a thin runtime adapter. When a runtime lacks a primitive, fall back to the portable packet contract and a manual or CLI-driven handoff.

### 4. Portability Is A First-Class Quality Attribute

The next 1-2 years of coding-agent environments will probably keep changing quickly. The SDLC should assume that today's best harness may not be the best harness next year.

The anti-lock-in target is:

```text
new runtime adapter + existing portable roles/packets/claims
-> usable SDLC route with minimal policy rewrite
```

The plan should therefore prefer runtime-neutral artifacts, abstract model tiers, OpenAI-compatible or MCP-compatible interfaces, and explicit capability matrices over hardcoded one-tool workflows.

## Core Operating Model

The portable operating model is:

```text
human in VS Code or another coding surface
-> selected runtime adapter
-> SDLC router and helper CLI
-> context packet and evidence contract
-> runtime-native subagent/session or manual packet handoff
-> cheaper frontier or LM Studio role agent
-> response packet with structured claims
-> orchestrator reconciliation
-> outcome evaluation and failure attribution
-> human finish gate
```

The Codex pilot flow is a concrete instance of this model:

```text
human in VS Code
-> Codex Extension
-> Codex CLI / codex exec / Codex subagent
-> cheaper frontier or LM Studio role agent
-> response packet
-> Codex orchestrator reconciliation
```

The orchestrator remains accountable. Local agents are workers, reviewers, explorers, or verifiers. They do not own final judgment, Git publication, product direction, architecture approval, or evidence claims.

## Design Principles

1. Treat the current SDLC as a baseline to test and improve, not as perfect.
2. Keep the current SDLC source-of-truth hierarchy unless evidence shows it should change.
3. Use right-sized tools: deterministic commands first, cheaper frontier tiers for routine bounded work, local models for batch/speculative work, top frontier models for orchestration and hard judgment.
4. Treat tier routing as the main cost reducer and subagent fan-out as a capability or idle-compute choice.
5. Keep the developer-facing workflow simple enough to explain and repeat.
6. Count every subagent as process cost until it proves value.
7. Use deterministic tools before model judgment whenever deterministic evidence exists.
8. Keep runtime adapters thin. Do not bury durable process policy in Codex CLI, LM Studio, or model-specific config.
9. Keep portable agent definitions model-neutral.
10. Treat local model output as a proposal or finding until the orchestrator reconciles it with source artifacts and evidence.
11. Give local agents small context packets, not whole repo dumps.
12. Do not give write/tool authority to a local agent until the safe-edit boundary and allowed commands are explicit.
13. Measure cost by total workflow cost, not just cloud tokens.
14. Token reduction alone is never a pass; quality, repair loops, developer friction, and evidence integrity must hold.
15. Treat stage claims and outcome logs as the learning substrate; models do not learn between calls, but the scaffold can improve.
16. Prefer native runtime primitives through thin runtime adapters over rebuilding orchestration in the SDLC.
17. Keep the ability to move runtimes by preserving portable roles, packets, claims, and evidence contracts outside runtime-specific files.
18. Treat model consensus as weak evidence unless the models have genuinely different failure modes or a deterministic check supports the result.
19. Count human orchestration as a first-class cost; a route that saves model tokens by making the developer coordinate more work has failed.
20. Treat context structure and response structure as separate design surfaces; agents need both a good input packet and a useful output packet.
21. Use alternate-perspective planning only when the likely savings from catching a weak plan outweigh the upfront cost.
22. Keep terms stable; terminology drift creates routing, documentation, and teaching friction.
23. Prefer deterministic tools and repo-specific helper checks over model judgment whenever they can answer the question.
24. Define each role by its done contract as much as by its task label.
25. Preserve the developer's original intent and map plan changes back to it before claiming completion.
26. Treat durable knowledge as source-linked retrieval guidance, not hidden memory or a competing source of truth.

## SDLC Improvement Stance

Local-model orchestration should pressure-test the SDLC itself.

Questions to ask during each experiment:

- Which SDLC steps were valuable?
- Which steps were only there because the frontier model had to remember too much?
- Which packets or docs made the workflow easier for a local model?
- Which packets or docs were too heavy for the value they produced?
- Which gates should remain human-visible?
- Which mechanics should be hidden behind helper CLI commands?
- Which agent roles should merge, split, or disappear?
- Which current skills are hard for another developer to understand?
- Where did local agents expose unclear ownership in the current SDLC?
- Where did the orchestrator spend frontier tokens doing clerical work?
- Where did inconsistent terms create confusion?
- Where could deterministic tooling replace model judgment?
- Where did a role need clearer done criteria?
- Where did the original developer intent risk drifting during planning or delegation?
- What reusable knowledge should have been captured for future agents?

The outcome may be new local-agent adapters, but it may also be a simpler SDLC.

## Developer Adoption Constraints

This system needs two layers:

1. A simple operator surface for normal developers.
2. A deeper maintainer surface for improving skills, agents, runtime adapters, and evaluation.

The normal developer should mostly see:

```text
Use SDLC for this task.
Here is the route.
Here are the delegated agents the orchestrator will use, if any.
Here is what they can and cannot touch.
Here is the evidence.
Here is what needs your approval.
```

The maintainer may see:

```text
model tier mapping
local model scorecards
role packet templates
runtime-adapter details
process-learning events
fixture validation reports
```

If the workflow requires every developer to manually reason about all of those maintainer details for ordinary tasks, the design is too heavy.

## Right-Sized Tool Rule

Do not use a vastly oversized model when a simpler tool can produce the same quality result with the same or better evidence.

Default order of preference:

1. Deterministic command, parser, test, typechecker, linter, or local script.
2. Cheaper frontier model for routine bounded edits, mechanical changes, docs, and low-risk implementation.
3. Local small/fast model for summarization, simple review, context organization, batch work, and speculative work.
4. Local coding/reasoning model for bounded implementation or bounded review when latency is acceptable.
5. Top frontier model for orchestration, ambiguity, high-risk judgment, conflict resolution, public contracts, security, privacy, data, and final synthesis.
6. Consensus only for decisions where the cost is justified by risk.

The rule is quality-constrained. A cheaper or smaller model is not acceptable if it causes weaker code, weaker evidence, more repair loops, or more developer confusion.

## Deterministic Tool Expansion

The best token savings may come from not asking a model at all. The SDLC should actively look for deterministic tools that improve quality, reduce review ambiguity, or make role outputs cheaper to verify.

Good deterministic candidates:

- tests, type checks, lint, format, build, and package-manager scripts,
- AST parsers, codemods, symbol search, dependency graphs, and import-boundary checks,
- schema validators for JSON, OpenAPI, database migrations, generated config, and structured agent output,
- SQL parsers, migration dry runs, query-plan checks, and data-shape validators,
- accessibility, link, spelling, prose, markdown, and documentation consistency checks,
- security/dependency/license scanners when already approved for the repo,
- diff-size, changed-surface, generated-file, and forbidden-path checks,
- repo-specific helper commands that encode known invariants or common failure modes.

Tooling rule:

```text
If a deterministic tool can answer the question with acceptable trust, prefer it over a model.
If a model proposes a fact that a deterministic tool can check, run or schedule the tool before treating the claim as evidence.
```

The SDLC control plane should maintain a tool inventory per repo and expose the likely best proof for each task surface. This is separate from model routing: routing decides which model or agent to use when judgment is needed; deterministic tooling decides when no model judgment is needed.

## Three-Tier Model Routing

The first routing win should be tiered frontier usage, not local automation.

Routing should be measured as a cascade:

```text
try the cheapest tier that should satisfy the evidence contract
-> escalate on failed checks, risk, ambiguity, boundary drift, or explicit cap
-> record the misroute tax when the first tier was wrong
```

Escalation should not rely on model self-confidence. Use executable signals and observable workflow signals: failed tests, failed type checks, unexpected diff size, missing source references, repeated repair, unclear requirements, security/privacy/data risk, or human correction.

| Tier | Use for | Avoid for |
| --- | --- | --- |
| Top frontier, GPT-5.4-5.5 | orchestration, ambiguous planning, high-risk decisions, source-of-truth reconciliation, final synthesis, anything that must land correctly on the first try | routine bounded edits, mechanical refactors, simple docs, low-risk repeated work |
| Cheaper frontier tier | routine bounded edits, docs, mechanical changes, low-risk implementation, fast review, developer-blocking work where latency matters | security/privacy/data/public-contract decisions, hard architecture, unresolved evidence conflicts |
| Local model | async/batch/speculative work, overnight analysis, read-only review, MCP retrieval synthesis, low-cost attempts with low marginal cost | interactive blocking work, high-risk judgment, tasks where failed attempts create review burden |

The tier-2 routing path should be proven first. It captures the "developer will not swap models mid-chat" savings while avoiding most local-hardware latency and quality risk. Once routing works on cheaper frontier tiers, the same machinery can be extended to local models with less risk.

Do not promote a learned or automatic router yet. Start with explicit routing rules, structured receipts, and post-run attribution. The smallest useful router is one the developer can understand and override.

## Initial Planning Counterpoint

A local or different-family model can be useful before implementation when it receives the frontier orchestrator's draft plan and a narrow research/context packet. The goal is not to outperform the frontier model. The goal is to expose blind spots, missing evidence, weaker assumptions, better simplifications, or likely rework before those weaknesses become expensive implementation loops.

This pass is most valuable when:

- the task is Standard+ or exploratory,
- the initial plan will drive multiple downstream agents or edits,
- the plan depends on current external information,
- the plan makes architecture, runtime, security, data, or process tradeoffs,
- the cost of a bad plan is likely higher than the cost of a short critique.

The counterpoint agent should receive:

```text
original human request:
frontier draft plan:
scope and stop rules:
known source-of-truth files:
questions to challenge:
approved research tools or MCPs:
forbidden tools/data:
required response packet:
```

Expected output:

```text
Status:
Strongest counterpoint:
Assumptions challenged:
Missing context or research:
Likely downstream cost/rework risks:
Alternative or modification:
Evidence/source links:
Confidence and uncertainty:
Recommendation: keep / modify / pause / replace
```

The orchestrator must reconcile this output. It should not accept the counterpoint just because it is different, and it should not discard it just because the frontier plan came first.

Counterpoint pass condition:

```text
Use when expected downstream savings exceed upfront critique cost.
Keep when it measurably reduces repair loops, missing context, unclear plans, or human corrections.
Remove or narrow when it mostly adds noise, generic objections, or another review burden.
```

## Evaluation And Failure Attribution

Do not attempt exhaustive per-call verification. That would erase the savings. Also do not pretend that automated failure attribution is reliable enough to be the final authority.

The quality floor is executable evidence:

- tests,
- type checks,
- lint/build output,
- runtime assertions,
- diff inspection,
- source-linked claims,
- human acceptance when product judgment is required.

LLM review can triage, summarize, and suggest likely causes. It should not overrule deterministic evidence. Same-family model agreement is not strong independence; it can share style, reasoning, and self-preference biases. Consensus only matters when it adds a materially different failure mode or points to a deterministic check.

Instead, let tests, deterministic checks, and the developer decide whether the task was met, then use structured claims to narrow the likely failure stage. The goal is not to inspect every model thought; it is to make failures traceable enough that the scaffold improves without training itself on unconfirmed model guesses.

Every delegated stage should emit a small structured claim:

```text
Role:
Input packet:
Claim kind: deterministic / source-linked / judgment / assumption
Claim:
Evidence or source:
Uncertainty:
Boundary respected:
Caps:
Requested escalation:
```

Role-specific claim examples:

- Explorer: "these files are relevant, these artifacts are source-of-truth, this context is uncertain."
- Implementer: "I changed these lines for this reason, inside this boundary."
- Verifier: "these checks ran, these passed/failed/capped, this is the strongest available evidence."
- Reviewer: "these findings are blocking/non-blocking, tied to these files or claims."

When the outcome fails, replay the claim chain and look for the first false or unsupported claim:

```text
MCP retrieval wrong -> context layer failure
Explorer selected wrong source -> exploration failure
Orchestrator filled a gap incorrectly -> orchestration failure
Implementer changed the wrong behavior -> implementation failure
Verifier accepted weak proof -> evaluation failure
Reviewer missed a blocking issue -> review failure
```

This is the learning loop. The point is not "the agent learns like a person." The point is that the scaffold records enough provenance to improve routing, packets, MCP retrieval, model choice, and evaluation.

Attribution rule:

```text
LLM attribution can propose the likely stage.
Tests, diffs, logs, source references, or human review must confirm it before the scaffold changes.
```

Judge calibration rule:

```text
If model review or LLM-judge output is used repeatedly, sample it against human review.
If divergence exceeds roughly 20-25% on sampled decisions, treat the judge as a noisy triage tool and revise the rubric or route.
```

## Scaffold Learning Model

Models are swappable and mostly stateless between calls. The durable learning asset is the scaffold around them.

Experience should accumulate in:

- role packet templates,
- routing rules,
- model-tier mappings,
- MCP retrieval feedback,
- structured claim/outcome logs,
- failure-attribution notes,
- scorecards where they are genuinely useful,
- friction and token-churn audits.

"The agent got better" should mean:

```text
The versioned scaffold improved, and future calls using the same role/model/context path now perform better.
```

This matters for maintenance economics. Scaffold maintenance is not dead upkeep when it reduces repeated failure, token waste, or developer confusion. It is the system's durable IP. It should still be killable per piece when it stops paying for itself.

## Knowledge Layer

The SDLC needs a reliable knowledge layer that agents can query from different runtimes without relying on chat history or inconsistent Markdown updates. This should be treated as a retrieval and learning layer, not as a second source of truth.

The knowledge layer should answer:

- what the system is for,
- how major workflows operate,
- where authoritative artifacts live,
- which rules, regulations, contracts, or domain constraints matter,
- how the system is tested and released,
- what common failure modes and overlooked areas have been observed,
- which implementation patterns are mature, experimental, or deprecated,
- which agent/process lessons should improve future tasks.

Source-of-truth rule:

```text
Knowledge-layer entries point to authoritative artifacts.
They do not outrank code, tests, contracts, PRDs, ADRs, application models, feature context, or approved docs.
```

Capture rule:

```text
At task close or phase close, capture reusable learning only when the task exposed durable system, product, testing, process, tool, or agent-strategy knowledge.
Do not capture every transcript or temporary observation as durable knowledge.
```

Knowledge class rule:

```text
self-correcting knowledge:
  Code-anchored knowledge such as file behavior, workflow execution, test/release mechanics, and tool wiring.
  It must include anchors so drift can be detected cheaply.

non-self-correcting knowledge:
  Domain rules, regulations, rationale, business purpose, "how things fit together," and why decisions were made.
  It needs stronger review cadence, confidence decay, named ownership, and more skepticism because no test fails when it goes stale.
```

The valuable knowledge and risky knowledge overlap. Non-self-correcting records are often the highest-value context for agents, but they should decay toward revalidation unless refreshed by a source-of-truth artifact, human review, or approved external-source check.

Gateway envelope rule:

```text
The AirteraCode MCP knowledge gateway should reject records that lack the required envelope.
It should not judge content correctness or force a fixed vocabulary.
Correctness is handled by anchors, source-of-truth reconciliation, review, drift detection, retrieval evals, and promotion gates.
```

The gateway owns envelope enforcement because skills and runtime prompts are distributed, conditional, and easy to bypass. A single write chokepoint can guarantee schema version, source links, sensitivity, confidence, and anchors in a way that individual agents cannot.

Required envelope:

- schema version,
- knowledge class,
- claim,
- source-of-truth artifacts,
- anchors where available,
- task/run evidence,
- confidence,
- confidence-last-confirmed date,
- decay policy or revisit interval,
- drift status,
- sensitivity,
- owner artifact,
- suggested action.

Upgraded knowledge record:

```text
Kind: system / domain / regulation / testing / architecture / pattern / process / tool / agent
Class: self-correcting / non-self-correcting
Claim:
Source artifacts:
Anchors: files / symbols / blob hashes / test IDs / contract versions / route names / external version markers
Task/run evidence:
Applies to:
Confidence: confirmed / likely / tentative
Confidence-last-confirmed:
Decay policy:
Drift status: current / anchor-changed / time-expired
Sensitivity: public / internal / restricted
Owner artifact:
Schema-version:
Suggested action: link / update docs / create issue / review later / discard
```

AirteraCode MCP could become the first durable gateway for this by adding a knowledge callback alongside feedback:

```text
task finished
-> agent submits structured learning candidates
-> orchestrator filters sensitive/noisy items
-> MCP stores candidates with provenance and confidence
-> periodic consolidation links, deduplicates, and promotes reviewed knowledge
-> future context retrieval can find the improved knowledge path
```

The callback should accept candidate learnings, not silently rewrite source artifacts. Promotion into docs, patterns, skills, agent definitions, or repo configuration should remain reviewable and gated by the owning workflow.

Anchor-based drift detection is part of the knowledge layer definition, not a later enhancement. When an anchor changes, every dependent record should be flagged as `anchor-changed` and treated as possibly stale until revalidated. For records without deterministic anchors, use the staleness budget and confidence decay.

Retrieval measurement is also part of the definition. Capturing records is not success unless future retrieval surfaces the right source-of-truth artifacts with small enough context. The knowledge layer needs a retrieval eval set:

```text
Query:
Expected source-of-truth artifacts:
Grading mode: deterministic / human-graded
Difficulty: mechanical / semantic-tail
Holdout: train / test
Score: hit@k + precision@small-k + context economy within a cost budget
```

Mechanical queries should use deterministic tools as the calibration floor. If `rg` can answer "which files reference X," the knowledge layer must not do worse. The knowledge layer earns its keep on the semantic tail: indirect references, transitive relationships, reasons, ownership, constraints, and context that deterministic search cannot fully explain.

## Offline Insight Consolidation

Async local models can be useful for overnight consolidation of captured learning. The useful work is not mystical model memory; it is classification, deduplication, linking, contradiction detection, drift detection, retrieval evaluation, and retrieval improvement over structured records.

Prefer detection over generation. A surfaced contradiction, duplicate, stale anchor, missing source link, or retrieval miss is high-signal and relatively safe. An auto-merged summary can silently remove a caveat, amplify a confident-wrong claim, or make stale context look polished.

Good overnight consolidation tasks:

- cluster similar task learnings,
- find repeated missing-context or weak-verification patterns,
- flag anchor drift and time-expired records,
- detect stale or contradictory docs,
- identify retrieval misses and low precision-at-small-k queries,
- propose context-index updates,
- propose glossary additions,
- propose deterministic helper checks,
- identify recurring areas where agents needed human correction,
- summarize candidates for human/process-learning review.

Guardrails:

- run over approved, sanitized local records only,
- do not ingest secrets, raw customer data, or unnecessary private context,
- produce candidate updates rather than auto-editing source-of-truth artifacts,
- cite the records and artifacts behind each recommendation,
- cap output volume so consolidation does not create a review firehose,
- never raise a record's confidence,
- never strip source links or anchors,
- change one representation/index/retrieval knob per evaluation trial,
- require human or deterministic confirmation before promoting guidance.

The metaphor is useful: the software is the library product, and the knowledge layer stores how that library is organized, used, tested, regulated, and improved. The library catalog should help agents find and use truth; it should not become the truth itself.

## Interaction Mode Axis

Route by interaction mode as well as task class.

| Mode | Preferred tier | Reason |
| --- | --- | --- |
| Interactive / blocking | top frontier or cheaper frontier | latency and first-try success matter because the developer is waiting |
| Async / batch | cheaper frontier or local | latency matters less; structured claims and cheap rejection matter more |
| Overnight / idle-machine | local first | marginal compute cost is low, so low-hit-rate speculation can be rational |

Principle:

```text
Local models monetize idle compute and tolerate a low hit rate. Frontier models are for work that must succeed on the first try.
```

A speculative pass that would be irrational at frontier prices can be rational at local prices if rejecting misses is cheap and sandbox isolation is real.

## Async Local Workstream

Promote async local work to its own workstream rather than treating local models only as interactive copilots.

Good candidates:

- overnight knowledge-layer consolidation,
- overnight review of recent internal cases,
- repeated error-pattern discovery,
- MCP context gap detection,
- low-priority cleanup proposal generation,
- isolated branch experiments,
- candidate regression-test suggestions,
- process-learning summaries from structured claims.

Guardrails:

- run in genuinely isolated worktrees or branches,
- prevent external data leakage from case packets,
- cap output volume so misses do not become a review-burden firehose,
- require structured claims and cheap reject/accept summaries,
- never merge, push, deploy, or update tickets automatically.

## Proposed Layers

### 1. Human Operator

The developer works from VS Code with the Codex Extension. The human provides intent, corrections, approvals, acceptance judgment, and finish decisions.

The human should not need to manually decide every agent role. The SDLC should recommend a strategy and show where approval is needed in plain language.

For other developers, the key mental model should be:

```text
The frontier GPT-5.4-5.5 orchestrator is the accountable lead.
Codex Extension and Codex CLI are harnesses.
Cheaper frontier and local agents are bounded assistants.
Commands and tests provide proof.
The human controls approval and finish.
```

### 2. Codex Reference Orchestrator

The frontier orchestrator running through Codex owns:

- interpreting the original prompt,
- preserving the original human intent,
- classifying the work,
- choosing the SDLC route,
- choosing whether delegation is useful,
- choosing not to delegate when it would add friction,
- generating delegated-agent work packets,
- choosing cheaper frontier vs local vs top-frontier execution,
- reconciling delegated-agent structured claims,
- deciding when to escalate model tier,
- deciding what evidence is still missing,
- attributing failures to the first false or unsupported stage claim,
- final user-facing summaries,
- commit/push/PR/deploy stop gates.

The orchestrator may also act as a direct implementation worker for small work where delegation would add overhead.

For the pilot, this orchestrator is Codex in VS Code/CLI. For the portable design, "orchestrator" means the top-level runtime session that preserves user intent, owns routing, reconciles evidence, and stops at human gates.

### 3. SDLC Control Plane

The existing `sdlc` CLI remains the deterministic support layer.

Likely responsibilities:

- task journal and current state,
- preserved original request and intent checklist,
- context packet assembly,
- tool inventory and capability negotiation,
- role packet generation,
- role done-contract generation,
- structured claim/outcome log,
- failure attribution notes,
- evidence requirements,
- evaluation command recommendations,
- local activity/cap capture,
- QA script generation,
- finish and Git action packets.

Future local-model work should prefer expanding the control plane over adding giant prompts.

The control plane should absorb process mechanics that would otherwise burn frontier-model tokens:

- route explanation,
- context packet projection,
- role packet generation,
- model recommendation,
- evidence matrix generation,
- structured claim capture,
- done-contract capture,
- intent trace capture,
- failure attribution capture,
- knowledge-capture callback,
- cap detection,
- task state recovery,
- finish readiness.

If a repeated SDLC step can be made deterministic and understandable, it should move toward the control plane instead of staying as repeated model reasoning.

### 4. Built On Runtime Primitives, Not Rebuilt

The SDLC should map to runtime-native primitives when they exist.

Codex currently provides useful reference primitives for the pilot:

- shared CLI and IDE configuration,
- `AGENTS.md` instruction layering,
- model/provider configuration,
- `lmstudio` and `ollama` local/OSS provider support,
- custom agents with model, reasoning effort, sandbox, MCP, and skill config,
- subagent depth/thread controls,
- noninteractive `codex exec` with JSONL events and JSON-schema final output,
- hooks for tool use, permission requests, session starts/stops, and subagent starts/stops,
- MCP configuration shared by CLI and IDE,
- Codex-as-MCP for programmatic orchestration.

Claude Code provides a useful portability check because it also has subagents, MCP, hooks, permissions, settings, and runtime-specific agent files. That does not mean the SDLC should become Claude-shaped. It means the portable contract should be narrow enough that the same role can be translated into either Codex TOML or Claude Markdown/frontmatter without rewriting the policy.

MCP is the preferred cross-runtime tool/context layer because it is an open protocol for exposing resources, prompts, and tools to AI hosts. The in-house MCP should therefore be treated as a durable context/tool gateway, while each runtime adapter decides how to connect to it.

Runtime-specific code should only handle:

- invocation syntax,
- model/provider names,
- sandbox and approval mapping,
- MCP server mapping,
- hook/event mapping,
- output capture,
- known runtime caps.

Runtime-specific code should not own:

- role purpose,
- work class routing,
- human consent gates,
- evidence requirements,
- Git authority,
- case-data policy,
- final acceptance.

### 5. Runtime Adapter Layer

Runtime adapters translate portable roles into the current environment.

Needed adapters may include:

- Codex extension usage guidance,
- Codex CLI sub-session invocation,
- Codex `codex exec` noninteractive invocation,
- Codex custom agent file generation,
- Claude Code subagent file generation,
- Pi or other CLI prompt packet invocation,
- cheaper frontier model invocation,
- LM Studio endpoint/model mapping,
- local model capability inventory,
- allowed tool/MCP boundaries,
- known runtime caps.

Adapters must not change role purpose, write access, stop conditions, Git authority, or evidence requirements without updating the portable source first.

Adapter contract:

```text
Runtime:
Portable role implemented:
Source role file:
Source prompt template:
Invocation method:
Model tier mapping:
Model/provider name:
Context packet path:
Response packet path:
Tool/config profile:
Tool permissions:
MCP servers:
Sandbox / permission mode:
Write scope:
Forbidden actions:
Expected structured output:
Evidence expected:
Hook / event capture:
Token or usage capture:
Known runtime caps:
Fallback if unsupported:
Agent-interface quality notes:
Owner:
Last reviewed:
```

Capability matrix fields:

```text
supports project instructions:
supports custom roles:
supports subagents:
supports noninteractive run:
supports structured output schema:
supports resumable sessions:
supports local provider / OpenAI-compatible endpoint:
supports MCP:
supports hooks:
supports per-agent sandbox:
supports per-agent tool/config profile:
supports token/usage events:
supports file diff capture:
supports approval prompts:
supports response schema enforcement:
supports source-linked output:
supports explicit uncertainty/cap reporting:
```

Agent-interface quality fields:

```text
Can the role receive only the tools it needs?
Can the role receive only the MCPs it needs?
Can the role receive runtime configuration without copying durable policy?
Can the role return a schema-shaped result?
Can the role cite files, commands, sources, and uncertainty?
Can the orchestrator distinguish complete, capped, failed, and escalation-needed output?
Can the developer inspect the boundary without reading runtime internals?
```

Fallback rule:

```text
If a runtime cannot enforce a boundary, the adapter must state the cap and the route must either narrow the work, move the work to another runtime, or ask the human for approval.
```

### 6. Model Pool

The model pool contains the top frontier orchestrator, cheaper frontier tiers, and LM Studio local models mapped to abstract model tiers and role capabilities.

The SDLC should avoid hard-coding model names in portable skills. Concrete mappings belong in local or downstream project config, such as:

- `docs/agents/runtime-adapters.md`,
- `.ai-local/sdlc-profile.md`,
- a future `.ai-local/local-models.md`,
- a future machine-readable local model inventory.

Example abstract mapping:

```text
deterministic: local commands, tests, linters, typecheckers, scripts
frontier-top: GPT-5.4-5.5 orchestrator and hard-judgment model
frontier-cheaper: routine bounded work where latency and reliability matter
local-fast: small local model for summaries, search synthesis, docs, mechanical checks
local-standard: local coding model for bounded implementation and normal review
local-deep: strongest local model for ambiguous local reasoning, if available
consensus: independent second pass using a different model/role when the decision is critical
```

### 7. MCP Context And Tool Gateway

The in-house MCP is the primary context source. It should own retrieval feedback and evaluation signals for context quality. Context explorer roles should reason over MCP retrieval and local repo facts instead of free-roaming through every possible source.

The MCP layer may also become the durable knowledge gateway. If AirteraCode MCP is extended beyond feedback, the added layer should store structured learning candidates with provenance, confidence, sensitivity, anchors, schema version, and owning-artifact links. It should not store unreviewed summaries as authoritative truth.

Gateway responsibilities:

- reject knowledge writes that miss required envelope fields,
- enforce schema versioning,
- require source-of-truth links and sensitivity tags,
- require anchors for self-correcting knowledge when anchors exist,
- accept retrieval feedback and eval results,
- flag records affected by anchor drift or confidence decay,
- avoid judging content correctness directly.

Tool use should remain orchestrator-controlled unless an explicit role has been granted tool access.

Default stance:

- Read-only local agents can inspect assigned context packets and return findings.
- Evaluation workers can run only approved local commands.
- Implementation workers can edit only assigned files or areas.
- Local agents do not get broad MCP, shell, database, ticket, Git, or external-service access by default.
- Sensitive MCPs, ticket systems, database evidence, production logs, and external services remain approval-gated and redaction-aware.

For early experiments, local agents should probably be invoked as no-tool or read-only agents first.

Blast-radius rule:

```text
Do not give one delegated role all three at once:
private data + untrusted content + exfiltration/write capability.
```

Practical defaults:

- An external-doc researcher may read approved external docs, but should not have write, shell, ticket, database, or outbound posting authority.
- A plan-counterpoint reviewer may use approved research MCPs or web/document tools when the task requires current information, but should not have write, shell, ticket, database, or broad private-data access.
- A case-data analyst may receive redacted case packets, but should not also fetch arbitrary external content or push results to external systems.
- A write-capable implementation worker should receive a bounded source packet and approved local commands, not raw customer cases or broad external-doc streams.
- A security/privacy reviewer may inspect claims and source references, but should not auto-apply fixes or widen its own tool permissions.
- Any role that reads untrusted content should produce source-linked claims so the orchestrator can reconcile against the source, not only a summary.
- Any role that submits knowledge candidates should include source artifacts, confidence, sensitivity, and the proposed owner artifact.

MCP servers and generated skills/adapters are part of the attack surface. Review their tool lists, auth scope, output limits, and instructions before adding them to a delegated-agent route.

## Agent Role Families

The current portable roles should remain the first set:

| Role | Local-model fit | Verification fit | Notes |
| --- | --- | --- |
| `implementation-worker` | Medium | High when tests/diff are strong | Good for bounded slices after a plan exists. Needs strict safe-edit boundaries. |
| `verification-worker` | Medium | High when it classifies deterministic output | Better understood as an evaluation worker: it interprets command output, caps, and structured claims. Deterministic commands still do the proof. |
| `independent-reviewer` | Medium to high | Medium | Useful as triage and second perspective, but model review is not proof and same-family review is weak independence. |
| `release-handoff-worker` | Low to medium | Medium | Can draft finish packets, but Git authority must remain gated and evidence references must be checkable. |
| `process-learning-reviewer` | High | Medium | Good for read-only synthesis of process friction and reusable lessons. Durable SDLC changes still require review and validation. |

Likely new or downstream/project-local roles to explore:

| Role | Purpose | Default access |
| --- | --- | --- |
| `plan-counterpoint-reviewer` | Challenge an initial frontier-orchestrator plan from a different model family or local model perspective. Looks for hidden assumptions, missing research, weak evidence, simpler alternatives, and likely downstream token/rework traps. | Read-only, approved web/research MCP if configured, no write |
| `context-explorer` | Thin reasoning over in-house MCP retrieval and local repo facts: relevant files, source-of-truth artifacts, contradictions, and uncertainty. High value but high omission risk. | Read-only, source-linked |
| `repo-mapper` | Summarize deployable units, command surfaces, frameworks, and test surfaces. | Read-only |
| `test-engineer` | Propose tests, edge cases, regression paths, and evaluation strategy. | Read-only or bounded tests |
| `language-worker-typescript` | Implement bounded TypeScript/JavaScript changes. | Bounded write |
| `language-worker-dotnet` | Implement bounded C#/.NET changes. | Bounded write |
| `language-worker-python` | Implement bounded Python changes. | Bounded write |
| `data-sql-reviewer` | Review SQL/data-shape risk, migrations, query safety, EF/provider issues. | Read-only |
| `ui-reviewer` | Review UI state, accessibility, layout, and rendered-evidence gaps. | Read-only |
| `docs-sync-reviewer` | Check whether code, docs, AGENTS.md, context, and patterns agree. | Read-only |
| `ai-tool-security-reviewer` | Review MCP/tool/agent/runtime-adapter risks. | Read-only |
| `external-doc-researcher` | Gather current docs only through approved retrieval tools; external docs remain untrusted input. | Read-only |
| `error-context-researcher` | Query approved error-code/log/MCP context and summarize likely causes. | Read-only |
| `knowledge-capture-worker` | Convert task observations into structured learning candidates with provenance, confidence, sensitivity, and owning-artifact links. | Read-only, candidate output only |
| `knowledge-consolidation-worker` | Offline/overnight grouping, deduplication, contradiction detection, and context-index improvement proposals from approved learning records. | Read-only, sanitized records only |

Specialist roles should be added only when a repeated failure mode proves they reduce risk or cost. A deterministic helper or checklist is better when no model judgment is required.

Role-selection rule:

```text
Prefer roles whose outputs are cheap to verify.
Defer roles whose errors are silent unless they are MCP-backed, source-linked, and easy to spot-check.
```

Planning counterpoint rule:

```text
Use a local or different-family plan-counterpoint pass for Standard+ planning when a weak initial plan would likely create more downstream token churn, repair loops, or human orchestration than the upfront review costs.
Do not use it for Micro/Tiny work unless the task is deceptively risky.
The counterpoint agent critiques and researches; the orchestrator decides.
```

## Subagent Complexity Budget

Adding agents can reduce top-frontier work, but it can also increase total token usage, context passing, coordination cost, and review burden. The SDLC should treat subagent count as a budgeted design choice.

Default subagent budget:

| Work class | Default local agents | Maximum without explicit reason | Notes |
| --- | --- | --- | --- |
| Micro | 0 | 0 | Direct Codex or deterministic tool path. |
| Tiny | 0 | 1 | Use only for cheap read-only help or review. |
| Standard interactive | 0-1 | 2 | Common choices: bounded implementation worker or evaluator where proof is strong. |
| Standard async/batch | 1 | 3 | Common choices: MCP-backed context explorer, implementation worker, reviewer/evaluator. |
| High-risk | 0-1 read-only | 2 | Frontier model owns critical judgment; local agents assist, not decide. |
| Exploratory | 1 | 3 | Useful for option generation and repo mapping; findings only. |
| Review-only | 1 | 2 | Good local fit when packets are clear and findings are source-linked. |
| Release/handoff | 0-1 | 2 | Drafting is fine; Git/release authority remains human-gated. |

Every additional agent should answer:

```text
What work does this agent remove from the frontier model?
What evidence or quality does it improve?
What context does it need?
What can it not touch?
What happens if it is wrong?
How will the orchestrator reconcile or reject its output?
```

If those answers are weak, do not add the agent.

Interactive fan-out should default to the smallest route that preserves quality. Broader parallelism belongs in async/batch/overnight work unless the developer explicitly needs parallel breadth and accepts the coordination cost.

A plan-counterpoint reviewer counts against the subagent budget. It should displace some later review, repair, or human orchestration cost; otherwise it is just another planning layer.

## Work Class Routing

### Micro

Default:
Single orchestrator path. No local agent.

Reason:
Delegation would likely cost more time and context than it saves.

### Tiny

Default:
Single orchestrator path, optional local read-only review when the work is docs-heavy, search-heavy, or easy to parallelize.

### Standard

Default:
Orchestrator plus the smallest useful delegated role when it improves routing, evidence, or cost without adding review burden.

Common patterns:

- local or different-family plan-counterpoint review when the initial plan is ambiguous, research-sensitive, or likely to drive many downstream actions,
- cheaper-frontier bounded implementation after plan approval,
- evaluation/verification worker after edits when command output is clear,
- MCP-backed context explorer only when missing context is the actual blocker,
- independent reviewer before closeout when findings can be reconciled cheaply.

### High-risk

Default:
Codex/cloud deep model owns orchestration and critical judgment. Local models may do bounded, source-linked supporting work, but should not own architecture, security, data, migration, release, or public-contract decisions.

### Exploratory

Default:
Local models can be useful for option generation, repo mapping, and comparison, but the output should be treated as findings, not implementation truth.

Exploratory and architecture-adjacent work is the best early fit for a local alternate-perspective pass, especially when the frontier orchestrator has already produced a draft plan that can be challenged cheaply.

### Review-only

Default:
Good candidate for local models when the review packet is bounded, source-linked, and easy for the orchestrator to reconcile. Read-only access reduces repo damage risk, but review findings are still triage until checked against source and evidence.

### Release/handoff

Default:
Local models may draft summaries and QA scripts, but commit, push, PR, merge, deploy, and release remain explicit human gates.

## Cost And Pricing Model

This draft does not hard-code current provider pricing. Current cloud pricing changes and should be verified from official sources before any durable cost calculator is created.

For now, the SDLC should track cost as a workflow budget, not just token price. The reason is that a cheap local pass can still be expensive if it causes extra repair, verification churn, or developer confusion.

Agentic coding work has a communication tax. Repeatedly passing the same repo context, logs, diffs, review notes, and evidence between agents can dominate cost even when each individual call is cheaper. The route must therefore track input context size, number of delegated loops, and review/repair iterations, not only output tokens or model price.

```text
top frontier calls:
top frontier input/output tokens:
cheaper frontier calls:
cheaper frontier input/output tokens:
local model calls:
local prompt/output tokens:
planning counterpoint calls:
upfront planning critique time:
wall-clock time:
GPU/CPU memory pressure:
human orchestration steps:
developer interruptions:
tool calls:
deterministic checks available/used:
evaluation reruns:
failed-agent retries:
review repair loops:
quality regressions:
human clarification loops:
failure-attribution effort:
misroute repair effort:
structured-claim overhead:
knowledge-capture overhead:
context packet size:
```

The useful question is not "was a local model cheaper for this one prompt?" The useful question is:

```text
Did local delegation reduce total cost or latency while preserving or improving evidence quality and final code quality?
```

Cost-routing defaults:

- Use deterministic commands whenever possible.
- Prove cheaper-frontier routing before heavy local automation.
- Use cheaper frontier tiers for routine bounded implementation, docs, and mechanical changes when the developer is waiting.
- Use local-fast for summaries, simple docs, MCP retrieval synthesis, async review, and context organization.
- Use local-standard for bounded implementation and ordinary review only when latency is acceptable and the scaffold has shown competence.
- Use a local or different-family counterpoint pass for Standard+ plans when the upfront critique is likely to prevent downstream rework.
- Use the top frontier orchestrator for orchestration, reconciliation, and final synthesis.
- Use the top frontier tier for high-risk judgment, architecture, security, privacy, data, public contracts, and unresolved conflicts.
- Use consensus only when the cost is justified by risk.

Cost success requires all of these:

- lower top-frontier token usage,
- no material increase in total wall-clock time for normal tasks,
- no material increase in failed evaluation,
- no material increase in human orchestration steps,
- no material increase in human clarification burden,
- equal or better final code review outcome,
- equal or better structured-claim and evidence quality,
- no material increase in repair loops caused by misrouting.

If token usage drops but quality or developer effort gets worse, the route failed.

Goodhart guard:

```text
Token reduction alone is never a pass.
Every experiment must check at least one harder-to-measure quality or developer-flow metric.
```

## Quality And Evaluation Rule

Cheaper frontier tiers and local models are allowed to replace top-frontier labor only when the output is still checked by the appropriate proof surface or outcome evaluation path.

Examples:

- A local context explorer can reduce frontier context loading, but source files and docs still decide truth.
- A local implementation worker can draft or edit a bounded slice, but tests/build/review still decide readiness.
- A local reviewer can find issues, but model consensus does not prove correctness.
- A local evaluation worker can classify command output, but the command output remains the evidence.
- A local process-learning reviewer can suggest SDLC changes, but durable workflow changes still need review and fixture validation.

Do not trade quality for cost. The target is less frontier-model waste, not weaker development.

## Role Done Contracts

Agent responsibilities should be split by both task and verification criteria. A role is not just "planner," "researcher," or "implementer." It is a bounded responsibility plus a done contract that says what evidence makes the output usable.

Done contract fields:

```text
Role:
Assigned task:
Non-goals:
Required sections:
Required deterministic checks:
Required source links:
Required uncertainty/caps:
Escalation triggers:
Completion evidence:
What does not count as done:
```

Example completion criteria:

| Role | Done means | Best proof |
| --- | --- | --- |
| Implementer | Changed only approved files, satisfied acceptance criteria, and produced fresh evidence. | tests, typecheck, build, lint, diff review, runtime proof |
| Planner | Preserved original intent, mapped requirements to actions, named assumptions, compared options, and defined verification. | intent trace, source links, acceptance mapping, reviewer/counterpoint check |
| Researcher | Answered the question with current/allowed sources, citations, contradictions, freshness notes, and what was excluded. | source links, date/version checks, reproducible search path, uncertainty list |
| Context explorer | Identified likely source-of-truth files/resources, missing context, contradictions, and confidence. | file/resource references, MCP retrieval IDs, spot-checkable claims |
| Reviewer | Reported blocking/non-blocking findings with file/line or evidence links and avoided generic advice. | cited diff/evidence packet, reproducible command or source reference |
| Verifier | Classified command/tool evidence correctly and named caps or missing proof. | command output, logs, screenshots, artifact paths |
| Knowledge capture worker | Captured reusable learning with provenance, category, confidence, and owning artifact links. | source task/run references, linked code/docs/tests, review status |

Guaranteed sections help by forcing consideration, but they do not guarantee correctness. Their value is that a missing assumption, source, contradiction, or verification path becomes visible before the orchestrator builds on the output.

Verification rule:

```text
Every role packet must define what done means for that role before the work starts.
Every response packet must show whether that done contract was satisfied, capped, or escalated.
```

## Gate Approval Instrumentation

Complacency is a measurable workflow risk. Humans can under-check trusted humans too; the advantage of the AI SDLC is that approval behavior can be instrumented.

Track:

- gate approval rate,
- approval-without-comment rate,
- repeated approval by route/model tier,
- post-approval defect rate,
- sampled no-comment approvals,
- whether structured claims were inspected before approval.

Use periodic spot audits rather than adding an inspection tax to every call. The signal to watch is not "AI made humans complacent" in the abstract; it is whether approval behavior becomes too automatic for the observed defect rate.

## Per-Piece Kill Criteria

Every scaffold component should be killable independently.

Remove or revert a routing rule, packet, local role, scorecard, or helper command when:

- maintaining it costs more developer-hours than the tokens or review effort it saves,
- it becomes a top source of developer confusion in the friction audit,
- it causes repeated false confidence or weak structured claims,
- it creates review-burden noise in async/batch work,
- a cheaper frontier tier does the same job with less complexity,
- deterministic tooling can replace it.

A design that can be killed per piece is less likely to accrete dead process weight.

## Change Detection And Adaptivity

The plan needs one model for knowing when to change. Today the signals appear as kill criteria, reclassification triggers, freshness triggers, routing failures, retrieval failures, friction audits, and approval audits. Treat those as one adaptivity system with three signal types.

| Signal type | Cheap detector | Default threshold | Response |
| --- | --- | --- | --- |
| Drift | anchor hash diff, file/symbol change, contract version change, model/runtime/scaffold/tool-profile change, context-window or structured-output behavior change, new model tier available | any relevant dependency change or observed capability regression | revalidate knowledge, rerun eval, refresh or expire capability profile, downgrade route, or mark stale |
| Performance | routing precision drops, repair loops rise, retrieval precision-at-small-k drops, context economy worsens, gate approvals trend toward rubber-stamp, consolidation acceptance falls | rolling window against baseline | investigate, retune, narrow, or kill |
| Boundary | new regulation, framework major version, new language/platform, new data sensitivity, scope expands beyond internal full-stack web | human-noticed or tool-detected boundary change | escalate SDLC review before continuing as normal |

Staleness budget:

```text
Anything model-curated decays in confidence without fresh confirmation.
When confidence expires or anchors drift, the safe default is re-verify before reuse.
```

Per-piece kill criteria are the removal case of this model. Most signals should first trigger revalidation, re-evaluation, retuning, narrowing, or human review before removal.

## Context Packet Design

Local models should receive compiled context packets, not ad hoc dumps.

A role packet for a local agent should include:

- original human request,
- intent trace / acceptance checklist,
- assigned role,
- work class and risk,
- repository boundary,
- allowed context,
- forbidden context,
- allowed case-data fields,
- redaction requirements,
- safe-edit boundary if write access is granted,
- files or excerpts to inspect,
- current assumptions,
- structured claim schema for the role,
- required output shape,
- allowed tools/commands,
- evidence required,
- stop conditions,
- escalation triggers.

The packet should link to artifacts when possible and include only the minimum necessary excerpts. Large logs, raw tickets, production rows, secrets, private URLs, broad proprietary dumps, and unnecessary case/customer details should not be included.

Default context ordering:

```text
1. Original human request.
2. Assigned role, scope, and stop rules.
3. Source-of-truth files or MCP resources.
4. Directly relevant code/doc excerpts.
5. Approved tools, commands, and evidence expectations.
6. Known uncertainty, excluded context, and escalation triggers.
```

## Intent Traceability

The developer's statement is the authoritative starting point. The SDLC must preserve it, derive a working intent checklist from it, and keep later plan changes traceable back to that checklist.

Intent trace fields:

```text
Original developer request:
Interpreted objective:
Explicit constraints:
Implicit assumptions:
Acceptance checklist:
Out-of-scope items:
Open questions:
Plan actions mapped to checklist items:
Adjustments made after new evidence:
Human-approved scope changes:
Final outcome mapped to checklist items:
```

Rules:

- Preserve the original request verbatim in the task journal or packet.
- For Standard+ work, produce a short acceptance checklist before implementation or delegation.
- Map each plan action to the checklist or mark it as support work.
- If new evidence changes the plan, record the adjustment and whether human approval is needed.
- Do not let a subagent redefine the user's objective. Subagents may flag ambiguity or request escalation.
- Final handoff should say which checklist items were satisfied, capped, deferred, or changed.

This is not meant to create a heavyweight PRD for every task. The point is to prevent intent drift before it becomes wasted implementation or hidden rework.

## Response Packet Design

Agent responses are part of context engineering. A useful response packet should reduce orchestration work for the frontier model and the human. It should not force the orchestrator to reread a long narrative to find the decision, evidence, uncertainty, and next action.

Default response ordering:

```text
1. Status: complete / capped / failed / escalation-needed.
2. Done-contract result: satisfied / partially satisfied / not satisfied.
3. Decision-relevant findings or changed files.
4. Evidence: commands, file references, source links, or MCP resources.
5. Uncertainty and assumptions.
6. Boundary check: what was touched, not touched, and refused.
7. Recommended next action.
8. Full notes only when needed.
```

Response rules:

- Put the highest-value reconciliation facts before narrative.
- Cite source artifacts for every important claim.
- Separate deterministic evidence from judgment and assumptions.
- Report caps and missing context directly instead of smoothing them into prose.
- Keep speculative alternatives separate from blocking findings.
- Prefer compact tables or structured fields when another agent or helper command will consume the response.
- Do not bury tool failures, skipped checks, or scope uncertainty below a success summary.

## Orchestration Flow

Initial target flow:

1. Human gives a task in VS Code Codex.
2. Codex preserves the original prompt, derives an intent/acceptance checklist when warranted, and classifies work.
3. Codex runs or simulates local-first SDLC planning commands.
4. Codex chooses an agent strategy.
5. Codex defines done contracts for delegated roles.
6. For Standard+ or ambiguous work, Codex may request a local/different-family counterpoint review of the initial plan.
7. Codex reconciles the counterpoint output and modifies, pauses, or keeps the plan.
8. Codex creates bounded role packets.
9. Codex invokes delegated agents through Codex CLI sub-sessions, cheaper frontier tiers, or LM Studio adapters.
10. Local agents return response packets.
11. Codex reconciles outputs against source files, tests, docs, intent checklist, and SDLC gates.
12. Codex performs or routes implementation under safe edit boundaries.
13. Deterministic evaluation runs.
14. Local or cloud independent review runs when useful.
15. Codex updates evidence, context, and docs when dirty surfaces require it.
16. Codex captures durable learnings when the task exposed reusable system/process knowledge.
17. Codex stops at human finish approval before commit/push/PR/deploy.

## Persistent Sub-Session Tradeoff

Fresh subagents and persistent sessions solve different problems.

Fresh subagents protect the main orchestrator context from noisy search, logs, and intermediate reasoning. They return a summary or structured output and then the orchestrator decides what to keep.

Persistent sessions preserve continuity across multiple turns. They can reduce orchestration round trips and token churn when a bounded role needs to continue work, but they create a context-opacity risk: the sub-session can accumulate assumptions the orchestrator does not see, then return a polished summary that hides the faulty path.

Mitigations:

- require structured claims, not only prose summaries,
- cap sub-session turns or elapsed time before forced handback,
- require the sub-session to report uncertainty and caps,
- reconcile security-, data-, and contract-relevant claims against source artifacts,
- record enough claim provenance to replay failure attribution later.
- prefer fresh subagents for noisy one-off exploration and persistent sessions only when continuity is worth the opacity risk.

## Candidate Implementation Approaches

### Candidate A: Documentation-first runtime-adapter guidance

New capability or behavior:
Document how Codex should use LM Studio/local models through existing prompt packets and runtime-adapter guidance.

Coding-quality impact:
Low direct impact, but clarifies boundaries before tooling exists.

Platform/tool support impact:
No new dependencies.

Repo configurability impact:
Can use existing `docs/agents/runtime-adapters.md` and `.ai-local/sdlc-profile.md`.

No-install fallback:
Manual prompt packets and normal Codex orchestration.

Evidence and validation path:
Use a fixture task and compare a top-frontier-only workflow against manual delegated-agent role-packet workflow.

Cost/risk:
Low cost, low automation, may be too manual.

Why choose or reject:
Choose as the first step because it prevents tool work from outrunning the process design.

### Candidate B: CLI-generated role packets plus manual LM Studio invocation

New capability or behavior:
Extend `sdlc agents packet` and runtime-adapter docs so Codex can produce model-specific role packets that a human or CLI can paste/send to LM Studio.

Coding-quality impact:
Improves repeatability of local model experiments.

Platform/tool support impact:
No hard dependency on automated Codex CLI sub-session invocation yet.

Repo configurability impact:
Adds local model capability mapping.

No-install fallback:
Use generic packets with any local model chat UI.

Evidence and validation path:
Run read-only reviewer/context-explorer experiments on fixture and real repos.

Cost/risk:
Moderate process weight, low tool risk.

Why choose or reject:
Likely best second step.

### Candidate C: Codex CLI sub-session runner

New capability or behavior:
The orchestrator invokes Codex CLI sub-sessions with role-specific packets. Those sub-sessions may target cheaper frontier models or LM Studio/OpenAI-compatible local endpoints depending on route and interaction mode.

Coding-quality impact:
Potentially high, because local agents become repeatable and easier to use.

Platform/tool support impact:
Uses confirmed Codex primitives such as `codex exec`, custom agents, profiles/provider config, hooks, MCP, and LM Studio/OpenAI-compatible provider support. The remaining work is runtime-adapter policy and local configuration, not proving the primitives exist.

Repo configurability impact:
Needs explicit local model inventory, runtime-adapter mapping, permission model, and evidence capture.

No-install fallback:
Manual packet workflow.

Evidence and validation path:
Start read-only, then bounded write in a fixture repo, then compare to a top-frontier-only baseline.

Cost/risk:
Higher risk: tool authority, local endpoint reliability, model weakness, prompt injection, confusing logs.

Why choose or reject:
Choose after Candidate A/B/F and tier-2 frontier routing prove the workflow shape.

### Candidate D: Full local model router and evaluator

New capability or behavior:
The SDLC maintains model scorecards by role/language/task and automatically chooses top-frontier vs cheaper-frontier vs local model tiers.

Coding-quality impact:
Potentially high if backed by evidence.

Platform/tool support impact:
Requires significant CLI support, evaluation fixtures, and ongoing maintenance.

Repo configurability impact:
Needs model inventory, eval history, task taxonomy, and fallback policy.

No-install fallback:
Manual model-tier selection.

Evidence and validation path:
Repeated fixture runs, model capability scorecards, failure analysis.

Cost/risk:
High. Easy to overfit to one model or create false confidence.

Why choose or reject:
Reject for now as premature. Keep as long-term direction.

### Candidate E: SDLC friction and token-churn audit

New capability or behavior:
Audit the existing SDLC routes, packets, helper commands, agent prompts, and human handoffs for steps that create unnecessary frontier-model token use, developer confusion, or manual orchestration burden.

Coding-quality impact:
Potentially high if it removes noise without weakening gates.

Platform/tool support impact:
No new runtime dependency.

Repo configurability impact:
Can improve setup guidance, route defaults, and context packet shaping for every downstream repo.

No-install fallback:
Manual review of current workflow docs and fixture runs.

Evidence and validation path:
Compare the current human-orchestrated route against a helper-compiled route and a delegated-agent-aware route on the same fixture task. Measure frontier turns, total tokens if available, packets created, commands run, manual orchestration steps, evaluation quality, review quality, and developer-facing clarity.

Cost/risk:
Moderate. Risk is deleting useful safeguards because they feel heavy. Any simplification must preserve the quality floor.

Why choose or reject:
Choose alongside Candidate A because local agents should improve the SDLC, not merely add another layer to it.

### Candidate F: Portable runtime-adapter contract

New capability or behavior:
Define a runtime-neutral runtime-adapter contract and capability matrix before generating Codex, Claude Code, Pi, or other runtime-specific files.

Coding-quality impact:
Indirect but important: keeps evidence, scope, and stop rules portable instead of letting each runtime develop hidden policy.

Platform/tool support impact:
Supports Codex first while preserving a path to Claude Code, Pi, or another CLI/IDE runtime.

Repo configurability impact:
Adds a clear place for repo-local runtime capability mapping without putting product facts into shared skills.

No-install fallback:
Manual packet handoff using the same role, context, and structured-claim schema.

Evidence and validation path:
Run the same read-only review or bounded implementation packet through at least two runtimes or through one real runtime plus a manual packet fallback. Compare output shape, evidence quality, caps, and rework needed.

Cost/risk:
Low to moderate. The risk is creating adapter bureaucracy before it is used.

Why choose or reject:
Choose now, but keep it as a short contract rather than a full framework. This directly protects against vendor/runtime lock-in.

### Candidate G: Local alternate-perspective planning pass

New capability or behavior:
Use a local or different-family read-only counterpoint agent after the frontier orchestrator drafts an initial Standard+ plan and before the plan drives implementation or multiple delegated agents.

Coding-quality impact:
Potentially high when it catches a weak plan, missing source, bad assumption, or cheaper route before implementation. Low or negative if it produces generic objections that the orchestrator has to clean up.

Platform/tool support impact:
Can run through Codex CLI, LM Studio, another local runtime, or a research MCP when available. No-install fallback is manual counterpoint using the same packet and response schema.

Repo configurability impact:
Needs project rules for approved research tools, forbidden data, and when the role is worth the upfront cost.

No-install fallback:
Use the existing `counterpoint` skill or a manual packet without a local model.

Evidence and validation path:
Compare frontier-only plans against frontier-draft-plus-counterpoint plans. Track downstream repair loops, human corrections, plan changes accepted, and whether total workflow cost drops after implementation/review.

Cost/risk:
Moderate. It adds upfront work and can become review noise if overused.

Why choose or reject:
Choose as an experiment for Standard+ planning because it directly targets expensive bad-plan cascades while preserving orchestrator accountability.

### Candidate H: Knowledge layer and offline consolidation

New capability or behavior:
Add a structured knowledge-capture path, likely through AirteraCode MCP, that records reusable task/system/process learnings with provenance and lets approved local models consolidate them offline.

Coding-quality impact:
Potentially high if agents can reliably retrieve how the system works, how it is tested, which rules matter, and where past tasks exposed weak spots. Negative if stale or unreviewed summaries become trusted over code/docs/tests.

Platform/tool support impact:
Requires an MCP or local retrieval/index layer only after the data model and source-of-truth boundaries are clear. No-install fallback is disciplined Markdown/context updates plus targeted `rg`.

Repo configurability impact:
Needs repo-local knowledge categories, allowed sources, sensitivity rules, freshness rules, and owner artifacts.

No-install fallback:
Use Memory Bank/context docs, feature context, context-state, and direct search with a consistent knowledge-candidate schema.

Evidence and validation path:
Capture learning candidates from real tasks, run an offline consolidation pass, then test whether future agents find better context faster without trusting unsupported claims.

Cost/risk:
Moderate to high. Retrieval layers can create hidden memory, privacy risk, stale summaries, and review burden.

Why choose or reject:
Choose as an experiment because the current Markdown-only knowledge updates are inconsistent and not reliably triggered. Keep strict provenance and source-of-truth boundaries.

## Selected Initial Direction

Use Candidate A and Candidate F immediately, run Candidate E to measure current human-orchestrated burden, add Candidate G as a bounded planning experiment, add Candidate H as a knowledge-layer experiment, prove tier-2 cheaper-frontier routing first, and shape Candidate B next.

Do not jump straight to automated local-model execution until tier-2 frontier routing, role packets, local model capability mapping, runtime-adapter contracts, and evidence comparison are clear.

Initial deliverables should be:

1. This overview document.
2. A working glossary / term contract.
3. A three-tier routing matrix.
4. A structured-claim and failure-attribution format.
5. A role done-contract format.
6. A deterministic tooling inventory format.
7. A portable runtime-adapter contract and capability matrix.
8. A Codex CLI/Codex subagent runtime-adapter note derived from that contract.
9. A Claude Code/Pi portability sketch to prove the contract is not Codex-shaped.
10. A local model capability/profile template.
11. A model capability drift and revalidation contract.
12. A mixed-stream routing experiment plan.
13. A fixture validation plan.
14. A friction/token-churn/human-orchestration audit of the current SDLC route and packet surfaces.
15. A local alternate-perspective planning experiment.
16. A knowledge-layer capture and consolidation experiment.
17. A retrieval eval contract and Stage 1 deterministic query set.
18. A change-detection/adaptivity model.

Do not build yet:

- full learned router,
- automatic local-model execution for write-capable roles,
- broad language-specific role catalog,
- heavy local-model scorecard bureaucracy,
- automated failure attribution as source of truth,
- automatic case-data scanning with real customer fields,
- automatic promotion of knowledge candidates into source-of-truth artifacts,
- automatic model profile promotion after an unreviewed benchmark or one-off success,
- large new CLI command set,
- runtime-specific role policy that duplicates portable skills.

## Resolved Planning Decisions

These decisions turn the overview from an open plan into an implementation-sequence candidate. They are still subject to fixture evidence and may be revised if experiments show the route is too heavy, unsafe, or ineffective.

| # | Decision | Resolved direction |
| --- | --- | --- |
| 1 | First Codex reference path | Use `codex exec` first, with manual packet handoff as the fallback and Codex custom subagents as a later UX target. |
| 2 | Second runtime or fallback for portability | Use Claude Code as the second runtime target, with manual packet handoff as the no-tool portability baseline. |
| 3 | First implementation scope | Build docs/contracts plus very small dry-run CLI helpers; do not build write-capable automation yet. |
| 4 | Initial LM Studio model inventory | Start with `google/gemma-4-26b-a4b-qat` as the only currently available local model; research and add more models later by role gap. |
| 5 | Early bounded-write worker | Allow fixture-only bounded-write workers in Cycle 2 after dry-run routing, packets, model inventory, and response reconciliation are proven. |
| 6 | Exact cost modeling | Defer exact dollar modeling; Cycle 1 captures relative usage, wall-clock time, repair loops, verification, and human orchestration burden. |
| 7 | Developer-facing teaching path | Teach normal SDLC lifecycle commands first; agent/model/runtime commands are advanced or diagnostic. |
| 8 | First plan-counterpoint model/research setup | Test Gemma as a read-only plan-counterpoint model; research is mediated by the orchestrator rather than broad direct local-model web access. |
| 9 | Model capability profile ownership | The SDLC maintainer/orchestrator operator owns profiles initially; stale or drifted profiles fall back to safer tiers until role-specific smoke evals refresh them. |
| 10 | First human-orchestration burden measures | Measure repeated intent restatement, context selection, routing, verification translation, and reconciliation work first. |
| 11 | First deterministic tool inventory | Inventory build/test, typecheck/lint/format, search/symbol discovery, schema/contract validation, Git/diff checks, and docs/prose checks first. |
| 12 | First AirteraCode MCP knowledge slice | Use AirteraCode MCP as the intended knowledge gateway; first MCP slice is candidate submission with envelope validation, implemented in a separate coding session. |
| 13 | First knowledge categories/sensitivity | Cycle 1 knowledge capture allows public/internal process, tool, testing, architecture, agent, and pattern knowledge only. |
| 14 | Minimum intent trace | Standard+ work requires a compact intent trace before implementation; Micro/Tiny work may use a compressed or skipped trace when low risk. |
| 15 | Stage 1 retrieval eval | Start with deterministic "find references to X" queries graded against `rg -l`; require hit@5 100%, precision@5 at least 80%, and small context returns. |
| 16 | Non-self-correcting knowledge review/decay | The human owner or SDLC maintainer reviews it initially; default decay is 90/30/14 days for confirmed/likely/tentative, with critical knowledge requiring fresh confirmation before reuse. |

## Implementation Cycles

The plan is too broad for one implementation step. Implementation should proceed in cycles, and each cycle should produce actionable slices that can be validated independently.

### Cycle 1: Contracts And Dry-Run Control Plane

Goal:
Prove the portable contracts and developer-facing shape without giving delegated agents write authority.

Primary outputs:

1. Three-tier routing matrix.
2. Working glossary / term contract.
3. Role done-contract format.
4. Intent traceability contract.
5. Agent response packet contract.
6. Structured-claim and failure-attribution format.
7. Runtime-adapter contract and runtime capability matrix.
8. Codex `codex exec` reference adapter note.
9. Claude Code/manual packet portability smoke.
10. Local model inventory with `google/gemma-4-26b-a4b-qat` as the seed model.
11. Model capability drift/revalidation contract.
12. Deterministic tool inventory contract.
13. Friction/token/human-orchestration audit shape.
14. Knowledge candidate contract and no-MCP fallback behavior.

Allowed helper prototype scope:

```text
sdlc agents packet --role <role> --task "<task>" --dry-run
sdlc agents plan --task "<task>"
sdlc agents lint --packet <path>
sdlc task preflight --task "<task>"
sdlc task journal-check --task "<task>" --task-id <id>
sdlc task refresh-route --task "<task>" --task-id <id>
sdlc dry-run validate --task "<task>" --task-id <id>
sdlc adapter doctor --runtime <runtime>
sdlc models inventory
```

Cycle 1 stop line:

```text
No write-capable local automation.
No learned router.
No broad CLI command set.
No AirteraCode MCP implementation in this coding session.
```

Cycle 1 acceptance:
Another developer can understand the default `sdlc start` / `sdlc next` / `sdlc prove` / `sdlc finish-ready` teaching path, inspect a generated dry-run role packet, see why a model/runtime was recommended or rejected, and understand what evidence would be required before implementation.

Cycle 1 implementation status:
Cycle 1 is implemented as an Experiment and validated enough to proceed to Cycle 2 planning. The implementation report is [cycle-1-implementation-report.md](cycle-1-implementation-report.md). Dry runs validated clean/scoped docs tasks, dirty-unrelated source changes broadening a docs task from `tiny-docs` to `standard`, route freshness warnings and refresh, structured journal packet links, prompt/local-first preservation, docs-only local-first evidence, and post-commit wording that does not trigger release-handoff noise. Deferred polish candidates are tracked in [cycle-2-backlog.md](cycle-2-backlog.md).

### Cycle 1B: Separate AirteraCode MCP Knowledge Gateway Stream

Goal:
Implement MCP-side knowledge gateway support outside the main SDLC implementation session.

SDLC-session responsibilities:

- define the knowledge candidate contract,
- define envelope validation requirements,
- define fallback behavior when MCP support is unavailable,
- provide example candidate records,
- define how the SDLC submits or exports candidates.

Separate AirteraCode MCP session responsibilities:

- add candidate submission,
- validate required envelope fields,
- persist candidates with provenance,
- return validation errors in a structured shape,
- later add retrieval feedback,
- later add anchor/drift checks.

Cycle 1B boundary:
The SDLC implementation must not block on MCP internals. If MCP work is not ready, Cycle 1 uses Markdown/JSONL candidate files as the fallback.

### Cycle 2: Measured Routing And Response Validation

Goal:
Prove that the Cycle 1 dry-run control plane can recommend tiers, generate bounded packets, validate response shape, and capture route-fit/friction evidence before any delegated execution or write-capable automation.

Primary outputs:

1. Tier-routing receipt emitted by `sdlc agents plan` and generated role packets.
2. Role response packet lint aligned to the response contract.
3. Route-fit, misroute tax, retry, runtime, model-tier, and human-correction calibration fields.
4. Mixed-scope QA mode for docs/process tasks with non-doc dirty or verification surfaces.
5. Agent-plan-only journal handling that records prompt analysis, local-first signals, and routing evidence.
6. Verify-only fixture scenario proving deterministic-tool-first routing.

Allowed automation:

- dry-run packet generation,
- deterministic lint and scenario checks,
- calibration row capture,
- current-repo validation packets,
- no commit, push, deploy, migration, dependency, or production authority.

Cycle 2 acceptance:
The route either proves that routing and response contracts are inspectable enough to support later delegated experiments, or it produces enough failure evidence to narrow, defer, or kill delegated execution.

Cycle 2 implementation status:
Cycle 2 is implemented as an Experiment. The plan is [cycle-2-measured-routing-response-validation.md](cycle-2-measured-routing-response-validation.md), and the implementation report is [cycle-2-implementation-report.md](cycle-2-implementation-report.md). The fixture delegation and bounded-write scope was intentionally deferred until routing receipts, response lint, mixed-scope QA, and calibration capture were validated.

Cycle 2 planning inputs:

- [cycle-1-implementation-report.md](cycle-1-implementation-report.md)
- [cycle-2-backlog.md](cycle-2-backlog.md)
- Cycle 1 dry-run validation artifacts from `DacService`, including docs clean/scoped, dirty-unrelated, small-code, integration-surface, and post-commit wording runs.

### Cycle 3: Knowledge Retrieval And Adaptivity

Goal:
Prove that the knowledge layer improves future context retrieval without becoming a competing source of truth.

Primary outputs:

1. Knowledge-layer capture and consolidation experiment.
2. Retrieval eval contract.
3. Stage 1 deterministic `find references to X` query set.
4. Stage 2 semantic-tail query candidates.
5. Change-detection/adaptivity model.
6. Model capability drift reports tied to routing decisions.

Acceptance:
Retrieval must match the deterministic floor on mechanical queries and show useful precision/context-economy behavior before any automated tuning is trusted.

Cycle 3 implementation status:
Cycle 3 is implemented as an Experiment. The plan is [cycle-3-knowledge-retrieval-adaptivity.md](cycle-3-knowledge-retrieval-adaptivity.md), and the implementation report is [cycle-3-implementation-report.md](cycle-3-implementation-report.md). The implemented slice proves deterministic retrieval eval, retrieval regression caps, candidate validation/drift checks, local anchor hashes for new candidates, and model revalidation prompts. It does not yet prove broad knowledge consolidation, human-graded semantic-tail usefulness, or local-model automation.

### Cycle 4 Candidate: Measurement Pilot And Read-Only Counterpoint

Goal:
Measure whether the SDLC actually reduces human orchestration or frontier-token burden across the repositories where it is used before expanding automation authority.

Primary outputs:

1. Human-orchestration baselines from representative active SDLC repositories using the current route.
2. Helper-compiled treatment runs on the same or comparable tasks in those repositories.
3. Optional read-only plan-counterpoint packet for a Standard+ planning task.
4. A small human-graded semantic-tail retrieval set, if the task reveals reusable knowledge questions.
5. Calibration rows that connect routing decisions, friction, repair loops, verification evidence, and accepted/rejected counterpoint findings.

Cycle 4 stop line:

```text
No write-capable local automation.
No learned routing.
No automatic knowledge promotion.
No model promotion from stale or one-off profile evidence.
```

Cycle 4 acceptance:
The pilot must show lower human orchestration burden, fewer repair loops, clearer evidence, or better context selection in the active SDLC repository set without weakening deterministic checks or review quality. `.agents` can validate the control-plane helper behavior, but it is not sufficient by itself to prove Cycle 4 acceptance. If the pilot does not show useful cross-repo signal, narrow the trigger or continue improving helper-compiled single-agent workflows before delegated execution.

Cycle 4 planning status:
Cycle 4 has an implemented control-plane measurement helper plan at [cycle-4-measurement-pilot-read-only-counterpoint.md](cycle-4-measurement-pilot-read-only-counterpoint.md), with implementation evidence in [cycle-4-implementation-report.md](cycle-4-implementation-report.md). It remains an Experiment until the measured repository set, task shapes, treatment shape, optional counterpoint runtime, and semantic-tail inclusion produce non-`.agents` pilot evidence.

### Cycle 4A Candidate: Passive SDLC Feedback Through AirteraCode MCP

Goal:
Replace manual measurement operation with passive, agent-owned process feedback from normal SDLC work.

Primary outputs:

1. A dedicated AirteraCode MCP tool named `sdlc_feedback`.
2. A sanitized `airtera.sdlc.feedback.v1` envelope.
3. Local `.ai-local` JSONL fallback when MCP is unavailable.
4. Agent guidance for when to emit feedback without burdening the developer.
5. Periodic process-learning review that turns repeated feedback into candidate SDLC improvements.

Cycle 4A stop line:

```text
No raw source, raw ticket text, customer data, database output, secrets, full prompts, or full chat transcripts in v1 feedback.
No automatic process-rule mutation.
No lower/local model promotion from feedback capture alone.
```

Cycle 4A implementation status:
Cycle 4A has a plan at [cycle-4a-passive-sdlc-feedback-airteracode-mcp.md](cycle-4a-passive-sdlc-feedback-airteracode-mcp.md), a portable contract at [sdlc-feedback-contract.md](sdlc-feedback-contract.md), a local fallback helper through `sdlc feedback add|validate|export|test`, and AirteraCode MCP `sdlc_feedback` validation/persistence. It uses the same AirteraCode MCP service as the knowledge gateway, but a separate `sdlc_feedback` tool and logical collection because SDLC process feedback has different schema, review, and retention needs than MCP parser-improvement feedback.

### Cycle 5 Candidate: Read-Only Code Scout Subagent Pilot

Goal:
Introduce the first bounded subagent execution path without granting write authority.

Cycle 5 uses a generic `read-only-code-scout` role with `languageProfile` and `taskType` parameters. It does not create one permanent agent per small task such as `duplicate-code-finder`; duplication scanning is only an initial pilot task type.

Primary outputs:

1. A `read-only-code-scout` request/findings packet contract.
2. Language profiles for at least `generic`, with optional Classic ASP, C#/.NET, TypeScript/React, SQL, Node, and Python profiles.
3. Task types such as `duplication-scan`, `abandoned-code-scan`, `test-gap-scan`, and `context-summary`.
4. A local packet generator and findings validator.
5. A manual or capability-gated runtime pilot using a lower-tier/frontier or LM Studio-compatible local model only when approved.
6. `sdlc_feedback` capture for accepted findings, rejected findings, friction, and model/runtime caps.

Cycle 5 stop line:

```text
Read-only only.
No edits, commits, pushes, database writes, ticket writes, deploys, or releases.
No local/lower-tier model promotion from one run.
No finding may drive implementation without orchestrator source verification.
```

Cycle 5 implementation status:
Cycle 5 has a plan at [cycle-5-read-only-code-scout-subagent-pilot.md](cycle-5-read-only-code-scout-subagent-pilot.md) and implementation evidence at [cycle-5-implementation-report.md](cycle-5-implementation-report.md). It implemented the first bounded subagent packet path through `sdlc agents scout-packet` and `sdlc agents scout-validate`, while preserving the orchestrator as the final authority. Runtime invocation and local model calls remain gated follow-up work.

### Later Cycles: Narrow Automation Expansion

Only after Cycles 1-5 produce evidence should the plan consider:

- Codex custom subagent UX,
- additional local model roles,
- broader language-specific worker profiles,
- automatic model recommendations,
- richer AirteraCode MCP retrieval feedback and anchor/drift checks,
- cost modeling in exact dollars,
- write-capable local automation outside fixture scope.

## Process Weight Budget

New concepts:

- routing vs fan-out,
- verification asymmetry,
- runtime-adapter contract,
- working glossary,
- deterministic tool expansion,
- role done contracts,
- intent traceability,
- response packet contract,
- structured claim receipt,
- misroute tax,
- portability smoke test,
- human orchestration burden,
- local alternate-perspective planning,
- knowledge-layer capture and consolidation,
- model capability drift and profile revalidation.

New files/artifacts proposed:

- runtime-adapter contract,
- runtime capability matrix,
- mixed-stream routing experiment,
- local alternate-perspective planning experiment,
- knowledge-layer experiment,
- glossary / term contract,
- role done-contract template,
- deterministic tool inventory,
- structured-claim/failure-attribution format,
- local model profile template,
- model capability drift/revalidation contract,
- friction/token-churn/human-orchestration audit.

Resolved decisions now captured:

- first Codex reference path,
- second runtime or fallback for portability test,
- first implementation scope,
- initial local model inventory,
- fixture bounded-write timing,
- cost-modeling timing,
- developer-facing teaching path,
- first plan-counterpoint model and research boundary,
- model capability profile ownership and revalidation triggers,
- first human-orchestration burden measures,
- first deterministic tool inventory,
- first AirteraCode MCP knowledge slice and separate implementation stream,
- first knowledge categories and sensitivity levels,
- minimum intent trace,
- Stage 1 retrieval eval class and budget,
- non-self-correcting knowledge reviewer and staleness budget.

Decisions still refined per implementation cycle:

- exact role packet fields,
- exact response packet schema,
- exact helper command output formats,
- fixture task selection,
- accepted smoke eval tasks for each model role,
- AirteraCode MCP endpoint/tool shape in its separate session.

Removed or deferred complexity:

- no full learned router yet,
- no broad local-agent catalog yet,
- no automated attribution authority,
- no automatic model promotion from stale or one-off profile evidence,
- no large CLI command buildout,
- no runtime-specific policy fork,
- no write-capable local automation until cheaper-tier routing and runtime-adapter portability prove useful.

Net process weight:
Neutral to lighter if the runtime-adapter contract stays short and repeated routing/context/evidence/knowledge mechanics move into helper output. Heavier if every ordinary task requires developers to understand model scorecards, runtime caps, claim ledgers, knowledge ledgers, or counterpoint passes.

Why the weight is worth it:
The new concepts directly protect quality, cost, portability, developer attention, and retrievable system knowledge. Anything that does not survive Experiment -1, Experiment 0, Experiment 0A, Experiment 0B, Experiment 0C, or the friction audit should stay experimental or be removed.

## First Experiments

### Experiment -1: Human-orchestrated baseline and simplification target

Task shape:
Use real or fixture tasks that resemble the current daily workflow: context discovery, planning, implementation, validation, review, and handoff coordinated mostly by the human and top-frontier orchestrator.

Purpose:
Measure the current "simple baseline" as it exists today. This is not the ideal target. It is the burden this plan should reduce.

Baseline:
Run the current human-orchestrated SDLC path and record the work the developer has to coordinate directly: prompts, context gathering, tool choices, manual packet assembly, model handoffs, check selection, review reconciliation, and finish decisions.

Treatment A:
Run a helper-compiled route that keeps the workflow mostly single-agent but moves repeated mechanics into deterministic SDLC helper output, clearer packets, and response contracts.

Treatment B:
Run a delegated-agent-aware route only where delegation is expected to reduce human orchestration or frontier-token burden without lowering evidence quality.

Success signal:
Pass only if the treatment reduces manual orchestration burden while preserving or improving deterministic evidence, review findings, code quality, and developer clarity.

Failure signal:
The route looks cheaper only because the human coordinates more work, reads more noisy output, or repairs more weak model claims.

Kill condition:
Any "simplification" that preserves token savings by making the developer carry more hidden process work is rejected or pushed back into helper automation.

### Experiment 0: Mixed-stream routing precision

Task shape:
Use a mixed set of comparable tasks, not only pre-sorted easy tasks. Include docs edits, mechanical changes, low-risk implementation, context-heavy diagnosis, and at least a few tasks that should stay on the top frontier tier.

Delegated agent:
Codex direct route, Codex CLI sub-session, or runtime-native subagent using either top frontier or cheaper frontier based on the routing rule.

Allowed access:
Same repository and tool boundaries as a normal Tiny/Standard task.

Baseline:
Run at least 10 comparable current-route tasks or fixture tasks through the top-frontier-heavy path and record turns, available token/usage events, wall-clock time, repair loops, deterministic checks, review findings, and developer friction notes.

Treatment:
Run the same task set or a comparable mixed stream through explicit tier routing. Attach a minimal fixed claim receipt to every delegated stage.

Success signal:
Pass only if all are true:

- top-frontier turns drop by at least 30%,
- deterministic gates do not regress,
- blocking review findings do not increase,
- routing precision is at least 80% against post-run human/orchestrator classification,
- misroute repair effort stays under 15% of total treatment turns,
- structured-claim overhead stays under 10% of treatment turns,
- at least one hard-to-measure metric, such as developer clarity or repair burden, is checked and does not regress.

Failure signal:
The cheaper tier causes repeated repair loops, unclear handoffs, weak structured claims, more developer intervention than baseline, or a route that looks cheaper only because quality/developer friction was not counted.

Kill condition:
If routing cannot meet the quality proxy after 3 treatment iterations, pause tier routing and revise the route rules before adding local-model automation.

### Experiment 0A: Runtime-adapter portability smoke

Task shape:
Use one read-only review packet and one bounded implementation packet from a fixture or low-risk repo.

Runtime targets:
Codex is the first real target. A second target may be Claude Code, Pi, or a manual packet fallback if the runtime is not ready.

Allowed access:
Use the same portable role definition, context packet, evidence requirements, and structured-claim schema. Only the adapter invocation changes.

Success signal:
The second target can consume the same portable packet and return a comparable response packet without rewriting role policy. Any missing capability is recorded as a runtime cap, not patched by broadening the role.

Failure signal:
The packet only works because it assumes Codex-specific files, Codex-specific command semantics, or Codex-specific hidden context.

### Experiment 0B: Local alternate-perspective planning pass

Task shape:
Use Standard+ planning tasks where a weak plan would likely create multiple downstream edits, agents, research loops, or review passes.

Delegated agent:
Local or different-family `plan-counterpoint-reviewer`, optionally with approved internet research through a controlled MCP/tool path.

Allowed access:
Read-only. The agent receives the original request, frontier draft plan, selected source/context packet, explicit challenge questions, and allowed research tools. It cannot edit files, expand tool authority, or decide the final route.

Baseline:
Frontier orchestrator drafts and executes the plan without an alternate local critique.

Treatment:
Frontier orchestrator drafts the plan, sends it to the counterpoint role, reconciles accepted findings, and then proceeds.

Success signal:
The counterpoint pass catches missing context, weak assumptions, bad route choices, or cheaper valid alternatives that reduce downstream repair loops, frontier turns, human corrections, or review findings.

Failure signal:
The counterpoint output is generic, noisy, hard to verify, or increases planning latency without reducing implementation/review cost.

Kill condition:
If two or three sampled Standard+ tasks show no accepted plan improvement or measurable downstream savings, narrow the trigger or remove the pass from the default route.

### Experiment 0C: Knowledge capture and retrieval

Task shape:
Use real or fixture tasks that reveal reusable system, testing, regulation, architecture, process, tool, or agent-strategy knowledge. Include both deterministic retrieval questions and human-graded semantic-tail questions.

Delegated agent:
Optional `knowledge-capture-worker` at task close and optional offline `knowledge-consolidation-worker` over approved candidate records.

Allowed access:
Read-only task artifacts, structured claims, evidence packets, changed files, approved docs, and sanitized run records. No secrets, raw customer data, or automatic source-of-truth edits.

Baseline:
Current manual Markdown/context updates, which may be inconsistent or skipped when the SDLC update rule does not trigger.

Treatment:
Capture structured learning candidates through a consistent schema, optionally via AirteraCode MCP. Build a retrieval eval set and run detection-weighted offline consolidation that proposes links, duplicates, contradictions, anchor-drift flags, context-index updates, glossary terms, deterministic helper ideas, or retrieval tuning candidates.

Staged retrieval loop:

```text
Stage 1:
Build the ruler on deterministic queries where tools can compute ground truth.
Example shape: "find references to X" where `rg -l X` defines the mechanical floor.
The knowledge layer must not do worse than deterministic search.

Stage 2:
Add human-graded semantic-tail queries: indirect references, transitive relationships, reasons, ownership, regulations, rationale, and "how things fit together."

Stage 3:
Apply validated representation/retrieval lessons to new knowledge categories and other repos.
Grow the eval set from real failed queries.
```

Champion/challenger rule:

```text
1. Change one knob only: capture form, index/store shape, consolidation pass, or retrieval strategy.
2. Compare challenger against champion on a held-out eval slice.
3. Keep the challenger only if it improves quality and stays inside the efficiency budget.
4. Record the config change and eval delta as process knowledge.
5. Never let the loop author facts, edit source-of-truth content, or promote knowledge candidates automatically.
```

Migration seed-corpus rule:

```text
Run existing Markdown/context repositories through the gateway as a seed corpus.
Flag missing envelopes, missing anchors, stale links, sensitivity gaps, and contradictions.
Do not silently import records as trusted knowledge.
Parallel-run old context search and new retrieval until the new path beats the old path on the eval set.
```

Success signal:
Future agents find the right context faster, miss fewer known system facts, produce fewer repeated questions, and retrieve knowledge with source links rather than unsupported summaries. Retrieval improves on held-out queries while staying within precision-at-small-k and context-economy budgets.

Failure signal:
The knowledge layer creates stale or noisy records, increases review burden, exposes sensitive data, causes agents to trust summaries over authoritative artifacts, performs worse than deterministic search on mechanical queries, or returns the right artifact buried in too much context.

Kill condition:
If consolidation reports or retrieval tuning do not produce accepted context improvements, fail the deterministic floor, or create more review work than they save, keep using existing context docs and targeted search until a clearer retrieval need appears. Do not automate the champion/challenger loop until the eval harness is trusted and manual tuning has visibly hit diminishing returns.

### Experiment 1: Reproduce delegated-agent token-reduction signal

Task shape:
Use a small but realistic coding task that has a known baseline from normal Codex-only or frontier-heavy SDLC use.

Delegated agent:
Codex CLI sub-session using the simplest available lower-cost tier that can perform the role.

Allowed access:
Start read-only or bounded-write in a fixture repo. Keep the packet, role, allowed files, and evidence expectations explicit.

Success signal:
Top-frontier token use or frontier turns drop while evaluation, review, and final code quality remain equal or better.

Failure signal:
The apparent token reduction disappears after counting retries, repair loops, missing evidence, or human clarification.

### Experiment 2: Read-only local independent review

Task shape:
Use an existing diff or fixture change.

Local agent:
Independent reviewer.

Allowed access:
Read-only packet with changed-file summaries, diff excerpts, evidence packet, and review criteria.

Success signal:
Findings are useful, specific, and not noisy. Codex can reconcile them without redoing the whole review.

Failure signal:
The local reviewer invents issues, misses obvious evidence gaps, or requires too much context.

### Experiment 3: Local context explorer

Task shape:
Standard task with unclear relevant files.

Local agent:
Context explorer.

Allowed access:
Repo search summaries or bounded file list, no edits.

Success signal:
It identifies high-value files, source-of-truth docs, contradictions, and open questions with less cloud context.

Failure signal:
It over-selects files, trusts weak search hits, or fails to distinguish source from generated/archive/dependency artifacts.

### Experiment 4: Local evaluation worker

Task shape:
Post-implementation evaluation with known commands.

Local agent:
Evaluation/verification worker.

Allowed access:
Approved command outputs and expected evidence ladder.

Success signal:
It correctly separates pass, fail, cap, flaky/tooling issue, product issue, and first false structured claim.

Failure signal:
It treats partial evidence as completion or hides command failures.

### Experiment 5: Bounded implementation worker in fixture repo

Task shape:
Tiny or low-risk Standard change in a fixture.

Local agent:
Language-specific implementation worker or generic implementation worker.

Allowed access:
Explicit files, commands, and stop conditions.

Success signal:
Diff stays in boundary, evaluation passes, and review finds no role-boundary issue.

Failure signal:
The worker edits outside scope, weakens tests, or produces brittle code that requires more top-frontier repair than baseline.

### Experiment 6: SDLC friction audit

Task shape:
Run the same Standard task through the current SDLC route and a local-agent-aware route.

Local agent:
Optional process-learning reviewer or context explorer.

Allowed access:
Read-only SDLC artifacts, generated packets, task journal, evaluation evidence, structured claims, and final handoff.

Success signal:
The local-agent-aware route has fewer repeated prompts, smaller context packets, clearer developer-facing decisions, and equal or better evidence.

Failure signal:
The route is cheaper in tokens but harder for a developer to understand, or it skips safeguards that prevented a real failure.

## Failure Modes And Guardrails

| Failure mode | Guardrail |
| --- | --- |
| Terminology drift | Maintain a glossary/term contract and update it when new artifacts introduce durable terms. |
| Intent drift | Preserve the original request, maintain an intent checklist for Standard+ work, and map final outcomes back to it. |
| Wrong context | Use compiled context packets and require source links or file references. |
| Wrong scope | Every role packet states allowed and forbidden scope. |
| Weak verification | Deterministic checks remain required; model review is not proof. |
| Weak done contract | Each delegated role defines completion evidence before work starts and reports whether it satisfied, capped, or failed the contract. |
| Missed deterministic proof | Maintain a repo tool inventory and prefer deterministic checks over model judgment when available. |
| Tool overreach | Local agents start no-tool/read-only; tool access is explicit and role-bound. |
| Sensitive data leakage | Do not send raw private data to role packets for local agents unless policy allows it; redact by default. |
| False consensus | Model agreement does not outrank tests, contracts, source artifacts, or human judgment. |
| Hidden runtime policy | Runtime adapters stay thin and point to portable docs. |
| Local model hallucination | The orchestrator reconciles every local finding before acting. |
| Excessive process | Micro/Tiny tasks skip local agents unless risk or cost evidence justifies them. |
| Cost illusion | Track total workflow cost, including retries and repair loops. |
| Human orchestration shift | Track manual coordination steps and reject routes that save tokens by making the developer manage more process. |
| Misroute tax | Record when a cheaper tier required repair, escalation, or human correction. |
| Model capability drift | Version model/runtime/scaffold profiles, expire stale evidence, rerun role smoke evals after drift, and fall back to safer tiers when confidence is stale. |
| Goodharted metrics | Token reduction alone never passes; check at least one hard-to-measure quality or flow metric. |
| Write-boundary drift | Bounded workers edit only assigned files/areas and stop on ambiguity. |
| Read-only omission | Context/review roles must source-link claims and report uncertainty; read-only is not automatically low-risk. |
| Unusable response packet | Require status, evidence, uncertainty, boundary, and next-action fields before the orchestrator treats output as complete. |
| Noisy counterpoint | Use plan-counterpoint only where expected downstream savings justify the upfront critique; remove it when it produces generic objections. |
| Stale or overtrusted knowledge | Knowledge-layer records must cite authoritative artifacts, carry confidence/freshness metadata, include anchors where possible, and remain candidates until promoted. |
| Knowledge firehose | Capture only reusable learning and cap consolidation output so review burden does not exceed retrieval value. |
| Retrieval poisoning | Measure retrieval against a held-out eval set with precision-at-small-k and context-economy budgets before changing defaults. |
| Consolidation error amplification | Prefer detection over generation; consolidation cannot raise confidence, strip source links, or auto-merge facts into source-of-truth artifacts. |
| Retrieval overfitting | Use held-out queries and change one knob per trial before accepting a champion/challenger result. |
| MCP/tool injection | Split untrusted-content ingestion from write/outbound authority; reconcile against source, not summaries. |
| Developer usability failure | Keep a simple operator surface and test whether another developer can follow the route. |
| Agent tree sprawl | Use the subagent budget and require a reason for each added role. |
| Runtime lock-in | Portable roles, packets, claims, and evidence contracts remain source of truth; adapters stay thin. |
| SDLC overfit | Mark new guidance experimental until fixture or repeated-run evidence supports it. |
| SDLC stagnation | Treat repeated local-agent friction as evidence that current skills or helper commands may need to change. |

## Security And Privacy Boundary

Internal-only full-stack web development reduces exposure to adversarial public users, but it does not clear agent security or data handling. The live privacy boundary is case/customer data flowing through MCP retrieval, role packets for local agents, sandbox branches, local model prompts, generated runtime-adapter files, and runtime logs.

The security model should focus on blast radius. A delegated role becomes materially riskier when it combines:

```text
private data
+ untrusted content
+ outbound/write capability
```

The safest default is to remove at least one leg per role. For most delegated roles, remove outbound/write capability first.

Primary rules:

- Treat internal case data as sensitive unless explicitly classified otherwise.
- Define which case fields may enter role packets for local agents.
- Redact secrets, tokens, credentials, private URLs, unnecessary personal data, and raw customer-identifying details by default.
- Store role packets, transcripts, claim logs, and sandbox outputs under ignored local paths unless intentionally sanitized for tracked docs.
- Prevent local sandbox work from leaking case data to external services.
- Keep external documentation fetched by the MCP as untrusted input; internal-only status does not make external docs safe.
- Review generated runtime adapters before activation.
- Do not give agents that ingest untrusted external docs direct access to case/customer packets.
- Do not give case-data agents arbitrary web, ticket, shell, or outbound posting access by default.
- Reconcile security-, privacy-, and contract-relevant findings against source artifacts, not subagent summaries.
- Use runtime hooks or equivalent event capture to detect unexpected outbound calls, out-of-boundary edits, unusual tool sequences, and approval bypass attempts.

Before activating generated runtime adapters or local-agent tooling, answer:

- Which local models run fully local, and which may call external services?
- Does LM Studio logging persist prompts, code, case data, or outputs?
- Where do role packets for local agents, transcripts, structured claims, and outcome logs live?
- Where do knowledge candidates and consolidation reports live?
- Are role packets stored under ignored `.ai-local` by default?
- What case fields, logs, database evidence, and ticket details are allowed in role packets for local agents?
- What case fields, logs, database evidence, and ticket details are allowed in knowledge records?
- What must be redacted before local or sandbox processing?
- What must never be stored in the knowledge layer?
- Which agents may run shell commands?
- Which agents may access MCPs?
- Which agents may edit files?
- Can a delegated model request broader context or tools, and how is that request reviewed?
- How do we prevent cross-repo, cross-case, or customer-context bleed?
- How do we review generated runtime adapters before activation?
- How do we review or promote knowledge candidates before they affect future retrieval?
- Which hooks or event logs capture delegated tool use?
- Which runtime caps prevent full enforcement and require a narrower route?

## Configuration Sketch

Potential future local config:

```text
.ai-local/
  sdlc-profile.md
  local-models.md
  runtime-capabilities.md
  sdlc-cache/
    model-capabilities.json
    model-profile-history.jsonl
    model-drift-reports/
    model-eval-results/
    runtime-capabilities.json
    structured-claims.jsonl
    response-packets.jsonl
    failure-attribution.jsonl
    plan-counterpoint-runs/
    knowledge-candidates.jsonl
    knowledge-anchor-index.json
    knowledge-drift-reports/
    knowledge-consolidation-reports/
    retrieval-eval-set.jsonl
    retrieval-eval-results/
    retrieval-champion-challenger-runs/
    mcp-context-feedback.jsonl
    local-agent-runs/
```

Potential tracked templates:

```text
templates/docs/agents/local-model-routing.md
templates/config/local-models.example.json
templates/config/runtime-capabilities.example.json
templates/docs/agents/runtime-adapter-contract.md
templates/docs/agents/agent-response-packet-contract.md
templates/docs/agents/knowledge-layer-contract.md
templates/docs/agents/retrieval-eval-contract.md
templates/adapters/codex-cli-subsession/agent.toml
templates/adapters/claude-code/subagent.md
```

Potential CLI additions:

```text
sdlc models inventory
sdlc models scorecard
sdlc models drift-check
sdlc models eval --role <role> --model <model-id>
sdlc models recommend --role <role> --task "<task>"
sdlc runtime inventory
sdlc runtime adapter-check --runtime <runtime>
sdlc agents packet --role <role> --target local
sdlc agents run --role <role> --task "<task>" --model-tier local-standard
sdlc agents compare --task "<task>"
sdlc claims record --task "<task>"
sdlc claims replay --task "<task>"
sdlc counterpoint plan --task "<task>"
sdlc knowledge capture --task "<task>"
sdlc knowledge consolidate --since <date>
sdlc knowledge drift-check
sdlc retrieval eval --set <path>
sdlc retrieval challenge --knob <name>
sdlc knowledge query --task "<task>"
sdlc failure attribute --task "<task>"
sdlc gates audit --task "<task>"
sdlc route cost --task "<task>"
sdlc route simplify --task "<task>"
```

These are sketches, not approved implementation scope.

Potential normal developer command surface:

```text
sdlc start --task "<task>"
sdlc next --task "<task>"
sdlc agents plan --task "<task>"
sdlc prove --task "<task>"
sdlc finish-ready --task "<task>"
```

The developer-facing path should stay close to existing SDLC commands. Local-model routing should feel like an optional capability behind the route, not a separate workflow the developer has to manually orchestrate.

## Model And Scaffold Capability Profile

A model should not be considered generally "good at coding." It should be rated by role, tier, task type, and scaffold quality. In the initial internal full-stack web domain, shared models and a narrow task surface should keep this lighter than a general-purpose open-domain scorecard.

Possible scorecard fields:

```text
Model id:
Model version/build:
Runtime:
Runtime adapter version:
Tier:
Context window:
Hardware profile:
Good roles:
Weak roles:
Languages/frameworks:
Tool-call support:
Structured output reliability:
Diff/edit reliability:
Instruction-following reliability:
Security/privacy notes:
Known failure modes:
Best task size:
Fallback tier:
Developer usability impact:
Observed token/turn impact:
Observed repair-loop impact:
Structured-claim quality:
Response-packet quality:
MCP context fit:
Knowledge-layer fit:
Planning counterpoint value:
Tool/MCP profile version:
Scaffold version:
Role packet/schema version:
Eval suite version:
Promotion state: candidate / experiment / provisional / durable / deprecated
Revalidation triggers:
Stale-after:
Last evaluated:
Evidence:
```

The SDLC should route by observed capability, not model reputation. The smallest useful scorecard is enough; do not create broad model bureaucracy before failures require it.

Model capability profiles are perishable. A model update, runtime adapter update, role packet change, MCP/tool-profile change, context-window change, structured-output behavior change, hardware move, or observed regression can invalidate prior evidence. The safe default for a stale profile is to narrow the role, fall back to read-only use, route to a stronger tier, or ask for human approval until the profile is refreshed.

Capability maintenance loop:

```text
1. Inventory available models, runtimes, tool profiles, and scaffold versions.
2. Run a small role-specific smoke eval before assigning a model to a role.
3. Compare current results against the prior profile and baseline route.
4. Promote, hold, narrow, or deprecate the model/profile for that role.
5. Record what changed and which routing rules depend on the result.
6. Expire profiles on the configured staleness budget or when drift triggers fire.
```

This is a maintainability requirement, not a call for a heavyweight benchmark lab. The goal is enough evidence to keep routing honest as models and harnesses change, with the minimum scorecard that prevents stale confidence.

## Model Routing Matrix Draft

| Task shape | First choice | Escalate to |
| --- | --- | --- |
| Standard+ initial plan counterpoint | frontier draft plus local/different-family plan-counterpoint reviewer when downstream cost risk is high | top frontier reconciliation or human decision if critique finds real conflict |
| Knowledge capture at task close | deterministic schema plus optional local knowledge-capture worker | human/process-learning review before promotion |
| Offline knowledge consolidation | local-standard over sanitized knowledge candidates | human review before updating docs, skills, context indexes, or patterns |
| File search summary | MCP retrieval plus deterministic search, with local-fast or cheaper-frontier synthesis | top frontier if contradictions affect direction |
| Docs wording | cheaper frontier or local-fast | top frontier if policy meaning changes |
| Mechanical edit | cheaper frontier | top frontier only if scope or behavior becomes ambiguous |
| Bounded TypeScript fix, developer waiting | cheaper frontier after plan | top frontier if tests fail twice or design is unclear |
| Bounded TypeScript fix, async/batch | local-standard after plan and scorecard confidence | cheaper frontier or top frontier if local output is noisy |
| SQL/data diagnosis | deterministic evidence plus data reviewer | top frontier for production/data/security decisions |
| Security/privacy review | top frontier, optional local read-only second pass | independent review with different failure mode |
| Public contract design | top frontier | independent review with different failure mode |
| Evaluation output classification | deterministic command plus local-standard or cheaper frontier | top frontier if failure attribution is ambiguous |
| Release handoff | Codex plus deterministic Git/evidence commands | top frontier for risky release |
| Process learning review | local-standard or cheaper frontier | top frontier for durable SDLC promotion |
| Overnight case-pattern scan | local first in isolated sandbox | cheaper frontier/top frontier only for high-value candidates |

## Fixture Or Dry-Run Validation

The process-improvement skill expects fixture or dry-run validation before durable promotion. This idea should use an approved disposable fixture, configured pilot repository, or repo-local dry run to test:

- local read-only review,
- context explorer usefulness,
- local plan-counterpoint usefulness,
- knowledge capture and retrieval usefulness,
- bounded implementation safety,
- deterministic tool coverage,
- role done-contract clarity,
- intent trace preservation,
- evidence packet quality,
- response packet quality,
- runtime caps,
- process weight,
- human orchestration burden,
- developer-facing clarity,
- subagent count,
- top-frontier turn reduction,
- top-frontier cost reduction,
- final code quality.

Fixture validation should compare against a top-frontier-only or Codex-only baseline. The goal is not to prove local models are clever. The goal is to prove the orchestration pattern preserves SDLC quality while lowering cost or improving throughput.

Fixture evidence should answer:

```text
Was the route easier to explain?
Were fewer top-frontier turns needed?
Did local agents reduce or increase total wall-clock time?
Did the route reduce manual orchestration steps?
Did the plan-counterpoint pass produce accepted, source-linked changes?
Were response packets easy to reconcile?
Was the original developer request preserved and mapped to outcomes?
Did each delegated role have a clear done contract?
Were deterministic checks used where available?
Did captured knowledge help a later task find context faster?
Did any safeguard disappear?
Did deterministic evaluation remain surface-correct?
Could another developer run the same workflow from the handoff?
Did route selection match the post-run judgment?
How much repair effort came from misrouting?
Could the same packet run through a second runtime adapter?
Were runtime caps explicit instead of hidden in prose?
```

## Research Inputs Folded In

Current documentation, provider-independent research, and human workflow feedback changed the plan in these ways:

- Provider docs are used only for runtime capability discovery, not as authority for process policy. OpenAI Codex docs confirm the pilot should map to existing primitives before building new plumbing: custom agents/subagents, `agents.max_depth`, model/provider config, `lmstudio`/`ollama` local provider support, MCP in CLI and IDE, hooks, noninteractive `codex exec`, JSON-schema output, and Codex-as-MCP.
- LM Studio docs confirm Codex can use LM Studio through an OpenAI-compatible Responses endpoint and the `--oss` path, so "can Codex target LM Studio?" is no longer the main unknown. The main unknown is which local models are good enough for which roles in this SDLC.
- Claude Code docs confirm a viable portability target with subagents, MCP, hooks, tool restrictions, settings, and frontmatter-driven agent files. That supports the portable runtime-adapter contract instead of Codex-only policy.
- MCP docs confirm the right abstraction for cross-runtime context/tool access: hosts connect to servers that expose resources, prompts, and tools with explicit consent and tool-safety expectations.
- The provider-independent review reframed the "simple baseline" as a test requirement, but the user counterpoint reframes it again: the current daily workflow already approximates the simple baseline and leaves the human as the manual orchestrator. The plan now measures and reduces that burden instead of treating the baseline as the destination.
- User workflow notes added four practical design requirements: consistent terminology, stronger deterministic tooling, role-specific done contracts, and intent traceability from the original developer statement to final outcome.
- User workflow notes also added the knowledge-layer direction: AirteraCode MCP or another approved retrieval gateway should capture reusable task/system/process learnings and support offline consolidation, while preserving authoritative source boundaries.
- Knowledge-layer feedback added four final requirements: gateway-enforced envelopes, anchor-based drift detection with confidence decay, retrieval-quality measurement, and detection-first consolidation. The plan now treats those as part of the knowledge layer definition instead of later enhancements.
- Independent agent/interface research reinforces that tool setup, command affordances, context packets, and response packets are part of agent quality. The plan now evaluates `agent-interface quality` separately from model quality.
- Long-context research reinforces that both inputs and outputs need structure. The plan now includes context ordering and response packet ordering so agent findings are easier to reconcile.
- The alternate-perspective planning idea becomes an experiment: a local or different-family model may critique a frontier draft plan when catching a weak plan could reduce downstream token churn, repair loops, or human coordination.
- Routing research supports the plan's shift toward model-tier routing as the first cost-control mechanism.
- User maintainability feedback adds model capability drift as a first-class routing concern: model profiles must version the model/runtime/scaffold/tool context, expire stale evidence, and fall back safely when model behavior changes.
- Agentic coding token research reinforces that input context, review/refinement loops, and inter-agent communication can dominate cost; the SDLC should measure total workflow cost, not just prompt price.
- Failure-attribution research warns that automated multi-agent blame assignment is not reliable enough to drive scaffold changes without deterministic or human confirmation.
- LLM-as-judge bias research reinforces that model review is triage, not proof, and that same-family consensus is weak evidence.
- OWASP and MCP security guidance reinforce explicit consent, tool safety, sensitive-information controls, excessive-agency controls, and runtime containment around agentic systems.

Sources used:

- OpenAI Codex docs: [Subagents](https://developers.openai.com/codex/subagents), [Advanced Configuration](https://developers.openai.com/codex/config-advanced), [Non-interactive mode](https://developers.openai.com/codex/noninteractive), [MCP](https://developers.openai.com/codex/mcp), [Hooks](https://developers.openai.com/codex/hooks), [IDE features](https://developers.openai.com/codex/ide/features)
- LM Studio docs: [Codex integration](https://lmstudio.ai/docs/integrations/codex), [OpenAI compatibility](https://lmstudio.ai/docs/developer/openai-compat)
- Claude Code docs: [Subagents](https://code.claude.com/docs/en/sub-agents), [Hooks](https://code.claude.com/docs/en/hooks), [MCP](https://code.claude.com/docs/en/mcp)
- MCP docs: [What is MCP?](https://modelcontextprotocol.io/docs/getting-started/intro), [Specification 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18)
- Provider-independent review: [provider-independent-sdlc-research-review.md](provider-independent-sdlc-research-review.md)
- Knowledge-layer feedback: [sdlc-knowledge-feedback.md](sdlc-knowledge-feedback.md)
- Research papers: [Agentless](https://arxiv.org/abs/2407.01489), [SWE-agent](https://arxiv.org/abs/2405.15793), [FrugalGPT](https://arxiv.org/abs/2305.05176), [RouteLLM](https://arxiv.org/abs/2406.18665), [Lost in the Middle](https://arxiv.org/abs/2307.03172), [SWE-bench](https://arxiv.org/abs/2310.06770), [LiveCodeBench](https://arxiv.org/abs/2403.07974), [How Do AI Agents Spend Your Money?](https://arxiv.org/abs/2604.22750), [Tokenomics](https://arxiv.org/abs/2601.14470), [Who&When failure attribution](https://arxiv.org/abs/2505.00212), [Self-Preference Bias in LLM-as-a-Judge](https://arxiv.org/abs/2410.21819), [Position Bias in LLM-as-a-Judge](https://arxiv.org/abs/2406.07791)
- Security: [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/), [OWASP agentic AI governance resources](https://genai.owasp.org/resource/state-of-agentic-ai-security-and-governance/), [Trustworthy Agentic AI Requires Deterministic Architectural Boundaries](https://arxiv.org/abs/2602.09947)

## Remaining Open Questions

The high-level sequencing decisions are resolved. These remaining questions should be answered inside the relevant implementation cycle.

Cycle 1 contract questions:

- Can the VS Code Codex Extension call Codex CLI sub-runs cleanly, or does the orchestrator need to ask the human to run commands?
- What is the minimum portable runtime-adapter contract that works across Codex `codex exec`, Claude Code, and manual packet fallback without becoming a framework?
- Should local-agent transcripts be saved, summarized, or discarded by default?
- What response packet fields are mandatory enough to be schema-enforced?
- Which terms must be promoted from the working glossary into a dedicated glossary artifact?
- What exact local model metadata can be pulled for `google/gemma-4-26b-a4b-qat`, and which fields require local measurement?

Cycle 1 measurement questions:

- Which current SDLC steps create the most token churn?
- Which current SDLC steps are hardest to explain to another developer?
- Which current SDLC steps can become deterministic helper commands instead of model reasoning?
- Which current SDLC steps are only working because the human is manually orchestrating them?
- What metric best captures developer flow without becoming a heavy survey?

Cycle 2 delegation questions:

- Which languages deserve first-class worker roles after the first fixture evidence?
- Should language-specific workers be portable roles or project-local/downstream roles?
- How should local model failures be scored so routing improves over time?
- What minimum smoke eval is enough to refresh a model capability profile for each role?
- When does a local alternate-perspective planning pass save more downstream work than it adds upfront?
- Which research MCPs or tools should a plan-counterpoint reviewer be allowed to use directly, if any?
- What is the acceptable maximum number of local agents in a normal Standard task?
- Which model-review claims can be checked deterministically, and which must remain human judgment?

Cycle 3 knowledge/retrieval questions:

- Which semantic-tail queries should be human-graded in Stage 2?
- What case fields are allowed in role packets for local agents and sandbox branches?
- What gate approval sampling rate is enough to detect complacency without creating review drag?
- Where should exact cloud pricing be configured if later cost modeling becomes useful?
- Which MCPs, if any, should local models access directly after the orchestrator-mediated research path is proven?
- How do we avoid confusing "local model can run privately" with "safe to include any private data"?

## Acceptance Criteria For The Planning Phase

- The architecture explains the frontier orchestrator, Codex Extension, Codex CLI sub-sessions, cheaper frontier tiers, LM Studio, local agents, SDLC CLI, MCPs, and human gates.
- Existing SDLC concepts are reused rather than replaced.
- A working glossary exists and future artifacts use consistent terms.
- The 16 high-level human decisions are recorded as resolved directions and split into implementation cycles.
- Codex is clearly the first reference runtime, not the permanent source of SDLC policy.
- Runtime portability is represented by a contract and capability matrix.
- Local agents have explicit boundaries and output contracts.
- Local agents have role-specific done contracts before delegated work starts.
- Planner/researcher/context/reviewer outputs have verification criteria even when deterministic proof is not fully available.
- Deterministic tool opportunities are identified before adding model work.
- The original developer request is preserved and mapped to plan/actions/outcome for Standard+ work.
- Cost control is framed as a total workflow metric.
- Current pricing is not hard-coded without verification.
- The plan measures top-frontier turn/token reduction without accepting lower quality.
- The plan measures human orchestration burden and does not accept shifting model cost onto the developer.
- Routing precision, misroute tax, and structured-claim overhead are measured.
- Model capability profiles version the model, runtime adapter, scaffold, role packet, tool/MCP profile, eval suite, evidence, and stale-after trigger.
- Model capability drift has a defined response: revalidate, narrow, downgrade to a safer tier, or ask for human approval before reuse.
- Delegated stages emit structured claims.
- Delegated stages return response packets ordered for reconciliation, not just prose summaries.
- Failures can be attributed to a stage or context layer without replaying the whole run manually.
- Automated attribution is treated as assistive until confirmed by deterministic evidence or human review.
- The scaffold learning model is explicit and versionable.
- Interaction mode separates blocking work from async/batch work.
- Case-data handling is explicit for role packets for local agents and sandbox branches.
- Gate approval instrumentation exists without adding per-call inspection tax.
- Per-piece kill criteria exist for scaffold components.
- Developer usability is an acceptance criterion, not a nice-to-have.
- Agent-interface quality is measured separately from model quality.
- Knowledge-layer capture remains source-linked, anchor-aware, confidence-tagged, sensitivity-aware, schema-versioned, and non-authoritative until promoted.
- The knowledge gateway enforces the record envelope but does not claim content correctness.
- Knowledge records are split into self-correcting and non-self-correcting classes with different review/decay expectations.
- Anchor-based drift detection and confidence decay are part of the knowledge-layer definition.
- Retrieval quality is measured with deterministic and human-graded eval queries, including precision-at-small-k and context economy.
- Offline insight consolidation favors detection over generation and cannot raise confidence, strip source links, or auto-edit source-of-truth artifacts.
- Champion/challenger retrieval tuning changes one knob at a time and keeps changes only when held-out evals improve inside the efficiency budget.
- Subagent count is budgeted and justified by work class.
- Initial experiments start with human-orchestration baseline measurement, mixed-stream tier routing, portability smoke, local planning counterpoint, and knowledge capture before write-capable local automation.
- Security, privacy, and runtime-adapter activation are treated as gates.
- The next planning artifact can choose a concrete implementation slice.

## Recommended Next Planning Artifacts

1. `docs/process-improvement/three-tier-routing-matrix.md`
2. `docs/process-improvement/structured-claims-failure-attribution.md`
3. `docs/process-improvement/sdlc-local-model-glossary.md`
4. `docs/process-improvement/role-done-contracts.md`
5. `docs/process-improvement/deterministic-tooling-inventory.md`
6. `docs/process-improvement/intent-traceability-contract.md`
7. `docs/process-improvement/agent-response-packet-contract.md`
8. `docs/process-improvement/runtime-adapter-contract.md`
9. `docs/process-improvement/runtime-capability-matrix.md`
10. `docs/process-improvement/codex-reference-runtime-adapter.md`
11. `docs/process-improvement/claude-code-or-pi-portability-smoke.md`
12. `docs/process-improvement/model-capability-drift-revalidation.md`
13. `docs/process-improvement/local-plan-counterpoint-experiment.md`
14. `docs/process-improvement/knowledge-layer-capture-consolidation.md`
15. `docs/process-improvement/retrieval-eval-contract.md`
16. `docs/process-improvement/change-detection-adaptivity-model.md`
17. `docs/process-improvement/local-model-experiment-plan.md`
18. `docs/process-improvement/cycle-1-contracts-dry-run-control-plane.md`
19. `docs/process-improvement/cycle-1-implementation-report.md`
20. `docs/process-improvement/cycle-1b-airteracode-knowledge-gateway.md`
21. `docs/process-improvement/cycle-2-backlog.md`
22. `docs/process-improvement/cycle-2-measured-routing-response-validation.md`
23. `docs/process-improvement/cycle-2-implementation-report.md`
24. `docs/process-improvement/cycle-2-fixture-delegation-bounded-write.md`
25. `docs/process-improvement/cycle-3-knowledge-retrieval-adaptivity.md`
26. `docs/process-improvement/cycle-3-implementation-report.md`
27. `docs/process-improvement/retrieval-eval-contract.md`
28. `docs/process-improvement/knowledge-candidate-contract.md`
29. `docs/process-improvement/model-capability-drift-revalidation.md`
30. `docs/process-improvement/cycle-4-measurement-pilot-read-only-counterpoint.md`
31. `docs/process-improvement/cycle-4-implementation-report.md`
32. `docs/process-improvement/cycle-4a-passive-sdlc-feedback-airteracode-mcp.md`
33. `docs/process-improvement/sdlc-feedback-contract.md`
34. `docs/process-improvement/cycle-4a-implementation-report.md`
35. `docs/process-improvement/cycle-5-read-only-code-scout-subagent-pilot.md`
36. `docs/process-improvement/cycle-5-implementation-report.md`
37. `templates/config/local-models.example.json`
38. `templates/config/runtime-capabilities.example.json`
39. `docs/process-improvement/sdlc-friction-token-human-orchestration-audit.md`

## Decision Status

The 16 high-level human decisions that blocked implementation sequencing are resolved in the `Resolved Planning Decisions` section. Cycle 1 implemented and smoke-validated the contracts and dry-run control-plane baseline. Cycle 1B implemented and live-validated the AirteraCode knowledge candidate gateway and `.agents` JSONL fallback bridge. Cycle 2 implemented measured routing and response validation without delegated execution. Cycle 3 implemented deterministic retrieval evaluation, candidate drift checks, and model revalidation prompts without retrieval infrastructure or local-model automation. Cycle 4 implemented a manual measurement helper, but real use showed that manual measurement is too much developer burden for normal rollout. Cycle 4A shifted the long-term improvement path to passive, sanitized `sdlc_feedback` capture through AirteraCode MCP with local fallback.

Remaining decisions should be made inside the relevant cycle, not at the overview level:

1. Cycle 1 follow-up: decide whether to promote the dry-run baseline from Experiment to Provisional after another non-docs fixture run.
2. Cycle 1B follow-up: decide when to promote the knowledge gateway from Provisional after standard-tier denial or cross-restart persistence is validated.
3. Cycle 3 follow-up: decide whether the deterministic retrieval helpers are ready for Provisional after repeated non-docs runs with acceptable context economy.
4. Cycle 4A follow-up: use `sdlc_feedback` during normal Standard+ work and review repeated events through process-learning before changing durable rules.
5. Cycle 4A follow-up: decide whether accumulated feedback needs a summarized report command beyond `list_sdlc_feedback` and `sdlc feedback export`.
6. Cycle 5 follow-up: run a manual scout pilot on a low-risk real task and record accepted/rejected findings through `sdlc_feedback`.
7. Cycle 5 follow-up: decide whether the first runtime pilot uses manual packet paste, Codex CLI sub-session, cheaper frontier model, or LM Studio local model.
8. Later cycle: revisit read-only counterpoint, semantic-tail retrieval expansion, and fixture bounded-write only after passive feedback and read-only scout evidence show repeated value and low review burden.
