# AI SDLC Workflow Map

This pack is a skills-based SDLC workflow for projects where an AI coding agent must preserve product intent, application structure, task context, and verification evidence across sessions.

The workflow is recursive, not linear. If implementation reveals unclear requirements, the agent returns to the affected model, PRD, issue, plan, contract, or context-state entry before continuing.

## First Principle

Use the minimum process that prevents the most likely expensive failure.

- Tiny work mostly needs context, careful editing, and fresh verification.
- Feature work mostly needs alignment between product intent, technical approach, model, issue, plan, tests, and docs.
- Repeatable quality checks mostly need deterministic automation instead of manual AI review.
- Large or cross-cutting context mostly needs retrieval that points back to authoritative artifacts, not hidden memory.
- Delegation and model routing mostly need clear roles, minimal sufficient model tiers, bounded handoffs, and concrete escalation triggers.
- Repeated implementation surfaces mostly need project pattern guidance that captures product-specific conventions without duplicating deterministic tooling.
- Public interface work mostly needs a reviewed contract before implementation planning.
- Observable behavior work needs an experience-impact trace that follows the actor's job and full workflow through implementation and evidence.
- Security, data, migration, integration, or infrastructure work needs explicit risk review and rollback thinking.
- Long-running work needs context routing and durable state updates.
- Repeated process friction needs lightweight event capture and periodic cross-project review, not human memory.

## Orchestration

Use `run-sdlc` as the preferred front door when the human gives a request and wants the workflow driven for them. `run-sdlc` classifies the work, chooses the route, invokes the right skills, keeps progress visible, and stops at consent gates.

Use individual skills directly only when the human wants a specific gate or review.

## Work Classification

Every task should be classified before choosing gates:

- `Micro`: no-behavior, no-risk, obvious local edit.
- `Tiny`: obvious, local, low-risk, easy to verify.
- `Standard`: bounded feature, moderate bug fix, or multi-file change with clear requirements.
- `High-risk`: touches public contracts, data, security, auth, privacy, migrations, infrastructure, dependencies, integrations, concurrency, or broad architecture.
- `Exploratory`: spike, prototype, research, or uncertain feasibility work with a non-production boundary.

Use `classify-work` when workflow depth is unclear. Do not run the full workflow for tiny work unless a risk signal is present.



## Fast-Pass Routing

Treat the workflow as a dependency graph, not a sequence to run every time. `classify-work` chooses the fast-pass route, context depth, dirty surfaces, skipped gates, and escalation triggers.

A skipped gate is acceptable only when the classification explains why the failure it prevents is unlikely or cheap.

A one-file diff is not enough to qualify for fast-pass. Non-document source work must be explicitly mechanical and non-behavioral; observable changes to a user/system workflow, persisted state, feedback, output, recovery path, or downstream consumer use the normal route.

### Micro
```text
classify-work
-> context, minimal selection
-> implementation, implicit or one-line safe edit boundary
-> direct edit
-> quality, smallest relevant verification or documented inspection
```

Micro work escalates immediately if behavior, tests, shared code, public docs, generated artifacts, or more than one meaningful file changes.

### Tiny
```text
classify-work
-> tools, only if needed
-> context
-> quality, only if quality rails are missing or changing
-> implementation, lightweight safe edit boundary
-> direct edit or implementation execution
-> quality verification
-> context doc-sync check, only if docs/code may disagree
-> context docs update, only if dirty surfaces require it
-> context save, only if pending work/context changed
```

Tiny work skips PRDs, design gates, contracts, broad reviews, and release docs unless risk appears.

### Standard
```text
classify-work
-> tools, only if needed
-> context
-> quality, if quality rails are missing or changing
-> planning, using existing task/PRD source or PRD reference if requirements need durable form
-> planning issues, if not already tracked
-> planning slice-product-fit and experience-impact trace
-> planning implementation plan
-> review implementation-plan reference
-> implementation safe edit boundary
-> implementation execution / TDD
-> quality verification
-> review spec-compliance reference
-> context doc-sync check, if dirty surfaces require it
-> review code-quality reference
-> context docs update, dirty surfaces only
-> context state management, if uncertainty changed
-> context save
```

Standard work usually skips product reframing, full app modeling, contracts, outside voice, engineering-principles review, and release docs unless the dirty surfaces or risk signals require them.

### High-risk
```text
Run all relevant gates, none skipped silently.
```

High-risk work does not literally require every step. It requires every relevant safety gate. Skipped gates must be justified.

### Exploratory
```text
classify-work
-> tools, likely useful
-> context
-> tools retrieval-approach reference, if exploring retrieval/RAG/index options
-> planning product framing or grill-me, if ambiguity is product/requirements
-> planning application model, only if exploring architecture
-> quality automation reference, if comparing automation options or spike checks
-> implementation safe edit boundary
-> implementation execution as spike/prototype
-> quality verification, evidence of findings
-> quality health check, if prototype affects repo health
-> context state management, capture questions/decisions
-> context save
```

Exploratory work produces findings, options, risks, and a recommended next classification. It does not produce production completion claims.
## Automated Gating

The workflow is a map, not a mandatory ladder. `classify-work` must produce a fast-pass route, context depth, and dirty surfaces so agents run only the gates and artifact updates that are actually needed.

Context depth:
- `Shallow`: current file, nearby tests, immediate feature context.
- `Feature`: feature context, related source/tests, related PRD/contract excerpts.
- `Deep`: application model sections, PRD, contract, decision index/ADRs, context-state.
- `Cross-Cutting`: Memory Bank routing, multiple feature contexts, model sections, decisions, contracts, and broader retrieval.

Dirty surfaces decide artifact updates:
- `requirementsSurfaceChanged` -> PRD, issue, acceptance criteria, model section.
- `experienceImpactChanged` -> actor/job, before/after workflow, state/feedback, upstream/downstream/adjacent/recovery paths, implementation responsibilities, and scenario evidence in the slice-fit, plan, handoffs, and impact closure.
- `publicContractSurfaceChanged` -> contract spec, API docs, schemas, compatibility notes.
- `qualityAutomationChanged` -> quality automation decision, command wiring, CI/local preflight docs, AGENTS.md.
- `retrievalApproachChanged` -> retrieval decision, tool boundaries, index location/freshness, AGENTS.md, context index, context-state.
- `agentStrategyChanged` -> agent strategy docs, model-tier policy, runtime adapters, AGENTS.md, context-state.
- `implementationPatternChanged` -> implementation pattern docs, maturity, examples, exceptions, feature context, AGENTS.md, context-state.
- `systemSurfaceChanged` -> application model, ADRs, diagrams, boundaries, feature context.
- `verificationSurfaceChanged` -> tests, verification plan, health-check expectations.
- `docsContextSurfaceChanged` -> code-local docs, feature context, Memory Bank routing, context index, release/dev docs.
- `riskSurfaceChanged` -> security/privacy/dependency/license/migration/rollback/performance/accessibility/observability/rollout review.
- `agentOpsSurfaceChanged` -> AGENTS.md, setup commands, verification commands, workflow guidance.
- `processLearningSurfaceChanged` -> process-improvement event log or cross-project review report.
- `uncertaintyChanged` -> context-state.

Do not update every file every time.

Mid-stream reclassification is required when implementation, verification, review, or doc-sync reveals that the original work class, route, or dirty surfaces were wrong.

For observable behavior, every mapped experience-impact item must finish in one explicit state: implemented and verified, verified unaffected, deferred with rationale and human acceptance, or blocking. An impact packet's presence is not evidence that its content is complete, and generic build/test output must not satisfy an unrelated acceptance criterion.
## Engineering Principles

Use engineering principles as judgment lenses, not slogans. First-principles reasoning, assumption challenge, story readability, cohesion, coupling, simplicity, DRY, SOLID, and design patterns should improve maintainability rather than create ceremony.

A future maintainer should understand the code's intent, boundaries, tradeoffs, and safe way to change it.

Use engineering-principles-review for designs, plans, refactors, or code that feel complex, over-abstracted, tangled, too clever, or difficult to read.

## Code-Local Documentation

Code-local documentation owns code-local truth. Use the project's native documentation convention, such as TSDoc/JSDoc, docstrings, generated API docs, or language-specific equivalents.

Document public exports, shared interfaces/types/schemas, plugin/API/CLI/integration boundaries, non-obvious domain behavior, invariants, side effects, error behavior, compatibility notes, and examples.

Do not require comments for obvious private implementation. Do not move feature-level reasoning, product intent, diagrams, unresolved questions, or cross-feature context into source comments.

Strong code-local docs should make feature `context.md` thinner and more link-oriented, not unnecessary.

## Context Ledger + Routing Index

The workflow uses a thin Memory Bank as a routing layer, not as a second source of truth.

```text
docs/
  memory-bank/
    activeContext.md
    productContext.md
    progress.md
    decisionIndex.md
    contextIndex.md
  agents/
    agent-strategy.md
    agent-catalog.md
    model-tier-policy.md
    delegation-patterns.md
    runtime-adapters.md
    learning-loop.md
```

Memory Bank files summarize current state, pending work, and routing. They do not store the full history of AI changes. Durable artifacts define and prove.

- `activeContext.md`: current focus, current branch, immediate next action, current blockers. Rewritten often.
- `productContext.md`: product thesis, users, product principles, north-star constraints, and non-goals.
- `progress.md`: current status, pending work, known gaps, and not-yet-done work. Mention completed work only when it explains current state or prevents confusion.
- `decisionIndex.md`: concise index of decisions with links to ADRs. ADRs own full rationale.
- `contextIndex.md`: map of PRDs, feature contexts, model sections, workflows, contracts, documented source surfaces, and when to load them.
- `docs/context-state.md`: uncertainty ledger: assumptions, open questions, deferred decisions, blocked items, affected artifacts, and revisit triggers.
- `.agents/agents/*.md`: portable specialist, worker, reviewer, and handoff role definitions for this skills pack.
- `docs/agents/*`: downstream project-local agent strategy, model tiers, delegation patterns, runtime adapter mappings, and reviewed learning loop.
- `docs/patterns/*`: project-specific implementation patterns, maturity, canonical examples, exceptions, deprecated patterns, and change triggers.

Do not duplicate full requirements, architecture, issue details, contract details, code-local API docs, completed-work history, or ADR rationale into Memory Bank files. Link to the authoritative artifact instead.

## Process Learning

Process-learning events are optional project-local observations used to improve the workflow over time. They live outside Memory Bank so they do not become product state or hidden requirements.

```text
docs/process-improvement/
  events.jsonl
  friction-log.md
```

Use the `process-learning` router to capture lightweight events when real work exposes repeated friction, gaps, corrections, near misses, or useful workflow successes. Use its review-learning reference periodically to merge event logs from several projects, group patterns, and recommend improvements to project guidance, templates, deterministic tooling, retrieval approach, or this skills pack.

Do not treat event counts as proof. Cross-project reviews must inspect evidence, redact sensitive details, and keep accepted changes small enough to preserve the first principle.

## Tool and MCP Use

Tools and MCPs provide retrieval, reasoning scaffolds, and actions. They do not remember for the project and they do not outrank local source-of-truth artifacts.

Use the `tools` router when external/current knowledge, tool access, retrieval, or MCP boundaries matter. Context7-like documentation tools are useful for current version-specific library docs. Sequential-thinking-style tools are useful for ambiguous architecture, debugging, refactoring, or high-risk tradeoffs.

Use MCPs to retrieve or act, not to remember. Record durable decisions or verified facts in the owning artifact, not raw tool dumps in Memory Bank files.

## Agent Instructions

Projects using this workflow should maintain `AGENTS.md` when possible. It should contain concise agent-facing setup commands, verification commands, conventions, code-local documentation rules, security gotchas, and workflow rules. It must link to deeper docs rather than duplicating them.

## Agent Strategy

Use `setup-sdlc-in-repo` to install or refresh the portable SDLC files and runtime-specific adapter files in downstream projects. Use the `agents` router when Standard, High-risk, Exploratory, review, release, or cross-cutting work may benefit from delegation, specialist review, independent verification, or model-tier selection.

Portable skills-pack role definitions belong in `.agents/agents/*.md`. Downstream project strategy belongs in `docs/agents/*`. Runtime-specific files for Codex, VS Code/Copilot, Augment, Claude Code, or other tools are adapters. They should stay thin, point back to portable docs, and never outrank source artifacts, skills, or `AGENTS.md`.

Use the least powerful model and fewest agents that can satisfy the evidence requirement. Escalate when confidence is low, verification fails, artifacts conflict, risk surfaces appear, edit scope expands, or the current agent cannot produce a testable plan, reviewable diff, or fresh evidence.

## Implementation Patterns

Use the `implementation` router's implementation-patterns reference when a task touches repeated project-specific surfaces such as forms, tables, modals, API handlers, data fetching, errors, tests, layouts, or feature modules.

Patterns belong in `docs/patterns/*`. They are preferred defaults that help agents code consistently where deterministic tools cannot express product-specific conventions. Patterns start Emerging, become Validated or Standard through reviewed evidence, and can be Deprecated or Superseded when requirements, design systems, frameworks, accessibility, security, performance, or maintainability change.

Do not use implementation patterns to duplicate formatter, linter, typechecker, schema, accessibility, test, or CI rules.

## Technical Approach Gate

For new projects or meaningful technical surface changes, use the `implementation` router's technical-approach reference after application definition and before application modeling. This keeps stack, architecture style, runtime, persistence, deployment, testing, operations, and dependency policy explicit before requirements and issue slicing depend on them.

Do not run this gate for Micro/Tiny work unless the change unexpectedly introduces a new dependency, service, runtime, deployment concern, or technical constraint.

Human approval is required for the initial stack and for meaningful new frameworks, services, databases, auth/payment/AI providers, deployment targets, production dependencies, data retention/security models, or migration paths.

## Quality Automation Gate

Use the `quality` router's quality-automation reference after the technical approach is known and before implementation planning depends on verification assumptions, when project checks are missing, stale, noisy, underused, or newly relevant.

This gate decides which deterministic tools should handle repeatable quality work: formatting, linting, type/schema checks, tests, builds, contracts, accessibility, security, dependency, license, generated artifact, docs, and CI/local preflight validation.

Do not run this gate heavily for Micro/Tiny work unless the task exposes a tooling gap or changes verification, build, dependency, generated artifact, CI, or agent-command surfaces.

Human approval is required before adding new dependencies, hosted scanners, CI providers, build systems, package managers, test frameworks, workflow gates, or security/dependency/license policies with meaningful cost, risk, or workflow impact.

## Retrieval Approach Gate

Use the `tools` router's retrieval-approach reference when project scale, cross-cutting knowledge, repeated context-selection misses, privacy boundaries, or human navigation needs suggest that RAG, embeddings, vector search, graph indexing, repo retrieval, Obsidian-style navigation, or another retrieval layer may be useful.

Do not run this gate for Micro/Tiny work or ordinary feature work unless the work itself changes retrieval/indexing or exposes a real context-selection failure.

Prefer no retrieval layer when Memory Bank routing, context indexes, feature contexts, file names, and targeted search are enough. If retrieval is approved, its output is a pointer to source artifacts, not proof.

Human approval is required before adding retrieval dependencies, vector databases, hosted services, MCP servers, indexing jobs, CI workflows, background sync, cross-repo access, or human-facing tooling requirements.

## Contract-First Gate

For work that changes a public or cross-boundary interface, write and review the contract before implementation planning.

Use this gate when an issue changes a public API, library export, SDK surface, plugin interface, CLI command, configuration format, event/message schema, data contract, UI workflow, or external integration.

Skip this gate for work that does not change observable boundaries, such as many internal refactors, private implementation cleanup, small bug fixes, styling tweaks, or exploratory prototypes.

The contract should be language-neutral by default. In TypeScript projects it may include exported type/interface sketches, schema files, or type tests, but `.d.ts` files are not mandatory unless they are the right local artifact.

## Required gates

1. Classify the work before choosing the fast-pass route, workflow depth, context depth, and dirty surfaces.
2. No meaningful implementation before an approved design or explicit small-change exception.
3. No major app or feature work without `docs/application-model.md` or the relevant feature `context.md`.
4. Diagrams are requirements artifacts when they clarify workflows, dependencies, entities, or state.
5. No issue enters implementation until it has a testable implementation plan.
6. If an issue changes a public or cross-boundary contract, no implementation plan until the contract spec is reviewed.
7. High-risk work must include security/privacy/dependency/migration/rollback considerations as applicable.
8. Projects should automate repeatable quality checks when the risk profile justifies them, and agents should use documented commands before completion.
9. Retrieval/index/RAG layers are optional aids for finding authoritative artifacts; they must not become hidden memory or sources of truth.
10. Agent roles, subagents, model tiers, and runtime adapters are optional execution aids; they must stay bounded, reviewable, and subordinate to portable SDLC docs and project artifacts.
11. Implementation patterns are evidence-backed project guidance, not duplicate tooling or universal laws; Standard patterns need intentional exceptions when they do not fit.
12. Engineering principles are review lenses, not rigid slogans; complex designs, broad refactors, and hard-to-read code should receive principles review.
13. Public/shared/non-obvious code behavior must have accurate code-local documentation or an explicit documentation exception.
14. No completion claim without fresh verification evidence from the current session.
15. Spec compliance review happens before code quality review.
16. Review feedback is evaluated before it is applied.
17. Context docs, Memory Bank routing files, code-local docs, and AGENTS.md are part of Definition of Done when they changed or should have changed.
18. The agent loads the smallest sufficient context packet and expands only when evidence shows it is insufficient.
19. External tools/MCPs must have explicit access boundaries and must not receive secrets, private data, or unnecessary context.
20. Code/docs/contracts/context sync must be asserted when related dirty surfaces are true; docs must not be silently updated to match possibly wrong code.

## Core flow

```text
0. run-sdlc, when orchestrating from a human request
1. classify-work, to choose route, risk, dirty surfaces, gates, evidence, and caps
2. context/tools/agents, only when context selection, tool boundaries, retrieval, delegation, or model tiers matter
3. planning/review, only when requirements, contracts, model, issue slicing, or implementation plans need durable shape
4. implementation, for safe edit boundary, execution, TDD, diagnosis, technical approach, or project patterns
5. quality, for route-appropriate verification, evidence integrity, health checks, rendered evidence, and caps
6. review, for spec, code quality, design, DevEx, security, agent-work, process-feedback, or release-readiness review
7. context, to update docs/state only when dirty surfaces require it
8. release, for finish packets, branch hygiene, and human-approved Git handoff
9. process-learning, when repeated friction or useful workflow evidence should improve the SDLC
```

## Human review
Use the `review` router's agent-work reference when a human wants to inspect prior AI work before continuing or merging. It should review classification, skipped gates, verification evidence, Git reviewability, doc/code/contract sync, context-state updates, and high-risk review coverage without rewriting artifacts unless asked.

## Skill groups

### Routing and context spine
- `run-sdlc`: orchestrate the SDLC from a human request, route to specialized skills, and stop at consent gates.
- `classify-work`: choose micro, tiny, standard, high-risk, or exploratory workflow depth and emit the compact execution contract.
- `setup-sdlc-in-repo`: install or refresh the SDLC, agent strategy docs, and runtime adapters in a downstream repo.
- `context`: restore, select, update, assert, and save durable project context.
- `agents`: choose agent strategy, model tiers, portable roles, runtime adapters, and agent-definition updates.
- `tools`: choose minimum tools, MCPs, retrieval approaches, and trust boundaries.
- `implementation`: choose technical approach or patterns, set safe edit boundaries, diagnose, execute, and use TDD when practical.
- `quality`: select quality automation and collect fresh verification, evidence integrity, rendered evidence, and health-check results.
- `review`: review agent work, agent strategy, planning artifacts, contracts, implementation plans, spec compliance, code quality, security, UX, production readiness, and process feedback.
- `process-learning`: capture lightweight process observations and aggregate repeated evidence before changing durable SDLC guidance.

### Product and model
- `product-reframe`: challenge whether the request is the right thing to build.
- `define-application`: establish app-level purpose, users, workflows, data concepts, and scope.
- `implementation` technical-approach reference: select and record approved stack, architecture, runtime, persistence, deployment, testing, operations, and dependency constraints.
- `quality` quality-automation reference: select and record project-appropriate automated checks, command wiring, CI/local preflight expectations, and lifecycle usage.
- `tools` retrieval-approach reference: decide whether optional retrieval/RAG/indexing is justified and define source, trust, freshness, privacy, and lifecycle boundaries.
- `counterpoint`: challenge a favored plan, design, workflow, or decision from a credible opposing lens before the direction is treated as settled.
- `grill-me`: resolve assumptions through targeted questioning.
- `model-application`: create or update the durable diagrammed application model using approved technical constraints.
- `review-application-model`: challenge the model before PRD creation.
- `outside-voice-review`: advisory review of model, PRD, plan, issue breakdown, contract, or diff.

### Requirements, contracts, and issues
- `planning` PRD reference: synthesize clarified context into durable requirements.
- `review` planning-artifact reference: check PRD/model alignment when needed.
- `planning` diagram/issues references: map dependencies and break work into testable vertical slices.
- `planning` contract-spec reference: define observable public or cross-boundary behavior before implementation planning.
- `review` contract-spec reference: block ambiguous, untestable, unsupported, or over-broad contracts.

### Planning and boundaries
- `planning` implementation-plan reference: convert one issue or coherent issue batch into an executable plan that stays within approved technical constraints.
- `review` implementation-plan reference: block vague, untestable, or misaligned plans.
- `release` create-work-branch reference: isolate implementation work when branch workflow is used.
- `implementation` safe-edit-boundary reference: declare allowed files, commands, and scope limits.

### Implementation and verification
- `implementation` execute-plan and TDD references: implement approved work and use red-green-refactor where practical.
- `implementation` diagnose reference: investigate unclear bugs before fixing.
- `quality` verification-before-completion reference: collect fresh evidence before claiming done.
- `review` spec-compliance reference: check implementation against issue, PRD, model, and contract when present.
- `context` assert-sync reference: prove code, tests, docs, contracts, and context agree before completion or doc updates.
- `review` code-quality reference: review maintainability, engineering principle fit, code-local documentation, operational risk, and gaps not covered by deterministic tooling.
- `review` process-feedback reference: evaluate feedback before applying it.
- `quality` health-check reference: run broad project health checks without automatic fixes.

### Release and continuity
- `release` document-release reference: update public or project-facing release docs.
- `release` finish-development-branch reference: summarize, verify, and present finish options.

### Optional memory and retrieval layer
- The `tools` retrieval-approach reference decides whether retrieval/RAG/indexing is justified before a tool such as Graphify, embeddings, vector search, hosted retrieval, repo retrieval, or Obsidian-style navigation is added.
- `graphify-index` and `graphify-query` are optional context-management accelerators for larger projects. They are not mandatory and are never sources of truth. Use them only when Memory Bank routing files, durable docs, documented code surfaces, selected source files, and the approved retrieval approach are insufficient.
- Other MCPs, such as documentation retrieval, reasoning, repo retrieval/index, or memory-sync tools, are optional infrastructure selected through the `tools` router.

### Process improvement layer
- The `process-learning` capture-event reference records small JSONL observations in each project when workflow friction, gaps, corrections, near misses, or useful successes appear.
- The `process-learning` review-learning reference brings those events together across projects and produces reviewed improvement candidates for project-local guidance, templates, tooling, retrieval, or the skills pack.
