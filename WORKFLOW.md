# AI SDLC Workflow Map

This pack is a skills-based SDLC workflow for projects where an AI coding agent must preserve product intent, application structure, task context, and verification evidence across sessions.

The workflow is recursive, not linear. If implementation reveals unclear requirements, the agent returns to the affected model, PRD, issue, plan, contract, or context-state entry before continuing.

## First Principle

Use the minimum process that prevents the most likely expensive failure.

- Tiny work mostly needs context, careful editing, and fresh verification.
- Feature work mostly needs alignment between product intent, technical approach, model, issue, plan, tests, and docs.
- Public interface work mostly needs a reviewed contract before implementation planning.
- Security, data, migration, integration, or infrastructure work needs explicit risk review and rollback thinking.
- Long-running work needs context routing and durable state updates.

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

### Micro
```text
classify-work
-> select-context, minimal
-> safe-edit-boundary, implicit or one-line
-> direct edit
-> verification-before-completion, smallest relevant check or documented inspection
```

Micro work escalates immediately if behavior, tests, shared code, public docs, generated artifacts, or more than one meaningful file changes.

### Tiny
```text
classify-work
-> select-tools, only if needed
-> select-context
-> safe-edit-boundary, lightweight
-> direct edit or execute-plan
-> verification-before-completion
-> assert-doc-sync, only if docs/code may disagree
-> update-context-docs, only if dirty surfaces require it
-> context-save, only if pending work/context changed
```

Tiny work skips PRDs, design gates, contracts, broad reviews, and release docs unless risk appears.

### Standard
```text
classify-work
-> select-tools, only if needed
-> select-context
-> existing PRD/task source or to-prd if requirements need durable form
-> to-issues, if not already tracked
-> write-implementation-plan
-> review-implementation-plan
-> safe-edit-boundary
-> execute-plan / tdd
-> verification-before-completion
-> review-spec-compliance
-> assert-doc-sync, if dirty surfaces require it
-> review-code-quality
-> update-context-docs, dirty surfaces only
-> manage-context-state, if uncertainty changed
-> context-save
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
-> select-tools, likely useful
-> select-context
-> product-reframe or grill-me, if ambiguity is product/requirements
-> model-application, only if exploring architecture
-> safe-edit-boundary
-> execute-plan as spike/prototype
-> verification-before-completion, evidence of findings
-> health-check, if prototype affects repo health
-> manage-context-state, capture questions/decisions
-> context-save
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
- `publicContractSurfaceChanged` -> contract spec, API docs, schemas, compatibility notes.
- `systemSurfaceChanged` -> application model, ADRs, diagrams, boundaries, feature context.
- `verificationSurfaceChanged` -> tests, verification plan, health-check expectations.
- `docsContextSurfaceChanged` -> code-local docs, feature context, Memory Bank routing, context index, release/dev docs.
- `riskSurfaceChanged` -> security/privacy/dependency/license/migration/rollback/performance/accessibility/observability/rollout review.
- `agentOpsSurfaceChanged` -> AGENTS.md, setup commands, verification commands, workflow guidance.
- `uncertaintyChanged` -> context-state.

Do not update every file every time.

Mid-stream reclassification is required when implementation, verification, review, or doc-sync reveals that the original work class, route, or dirty surfaces were wrong.
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
```

Memory Bank files summarize current state, pending work, and routing. They do not store the full history of AI changes. Durable artifacts define and prove.

- `activeContext.md`: current focus, current branch, immediate next action, current blockers. Rewritten often.
- `productContext.md`: product thesis, users, product principles, north-star constraints, and non-goals.
- `progress.md`: current status, pending work, known gaps, and not-yet-done work. Mention completed work only when it explains current state or prevents confusion.
- `decisionIndex.md`: concise index of decisions with links to ADRs. ADRs own full rationale.
- `contextIndex.md`: map of PRDs, feature contexts, model sections, workflows, contracts, documented source surfaces, and when to load them.
- `docs/context-state.md`: uncertainty ledger: assumptions, open questions, deferred decisions, blocked items, affected artifacts, and revisit triggers.

Do not duplicate full requirements, architecture, issue details, contract details, code-local API docs, completed-work history, or ADR rationale into Memory Bank files. Link to the authoritative artifact instead.

## Tool and MCP Use

Tools and MCPs provide retrieval, reasoning scaffolds, and actions. They do not remember for the project and they do not outrank local source-of-truth artifacts.

Use select-tools when external/current knowledge, tool access, or MCP boundaries matter. Context7-like documentation tools are useful for current version-specific library docs. Sequential-thinking-style tools are useful for ambiguous architecture, debugging, refactoring, or high-risk tradeoffs.

Use MCPs to retrieve or act, not to remember. Record durable decisions or verified facts in the owning artifact, not raw tool dumps in Memory Bank files.

## Agent Instructions

Projects using this workflow should maintain `AGENTS.md` when possible. It should contain concise agent-facing setup commands, verification commands, conventions, code-local documentation rules, security gotchas, and workflow rules. It must link to deeper docs rather than duplicating them.

## Technical Approach Gate

For new projects or meaningful technical surface changes, use `choose-technical-approach` after `define-application` and before `model-application`. This keeps stack, architecture style, runtime, persistence, deployment, testing, operations, and dependency policy explicit before requirements and issue slicing depend on them.

Do not run this gate for Micro/Tiny work unless the change unexpectedly introduces a new dependency, service, runtime, deployment concern, or technical constraint.

Human approval is required for the initial stack and for meaningful new frameworks, services, databases, auth/payment/AI providers, deployment targets, production dependencies, data retention/security models, or migration paths.

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
8. Engineering principles are review lenses, not rigid slogans; complex designs, broad refactors, and hard-to-read code should receive principles review.
9. Public/shared/non-obvious code behavior must have accurate code-local documentation or an explicit documentation exception.
10. No completion claim without fresh verification evidence from the current session.
11. Spec compliance review happens before code quality review.
12. Review feedback is evaluated before it is applied.
13. Context docs, Memory Bank routing files, code-local docs, and AGENTS.md are part of Definition of Done when they changed or should have changed.
14. The agent loads the smallest sufficient context packet and expands only when evidence shows it is insufficient.
15. External tools/MCPs must have explicit access boundaries and must not receive secrets, private data, or unnecessary context.
16. Code/docs/contracts/context sync must be asserted when related dirty surfaces are true; docs must not be silently updated to match possibly wrong code.

## Core flow

```text
0. classify-work
1. context-restore
2. select-tools, when external/current knowledge or tool boundaries are needed
3. select-context
4. product-reframe
5. define-application
6. choose-technical-approach, when starting a project or changing technical surfaces
7. grill-me / brainstorming
8. model-application
8. manage-context-state
9. outside-voice-review
10. review-application-model
11. to-prd
12. review-prd-against-model
13. diagram-issues
14. to-issues
15. review-issue-dependencies
16. write-contract-spec, when public/cross-boundary behavior changes
17. review-contract-spec, when a contract spec is required
18. write-implementation-plan
19. review-implementation-plan
20. create-work-branch
21. safe-edit-boundary
22. execute-plan / tdd
23. verification-before-completion
24. review-spec-compliance
25. assert-doc-sync, when code/docs/contracts/context may disagree
26. engineering-principles-review, when complexity/readability/abstraction risk warrants it
27. review-code-quality
28. process-review-feedback
29. health-check
30. document-release
31. update-context-docs
32. manage-context-state
33. setup-agent-instructions, when agent instructions changed or are missing
34. finish-development-branch
35. context-save
```

## Human audit
Use `review-agent-work` when a human wants to inspect prior AI work before continuing or merging. It should audit classification, skipped gates, verification evidence, doc/code/contract sync, context-state updates, and high-risk review coverage without rewriting artifacts unless asked.

## Skill groups

### Routing and context spine
- `classify-work`: choose micro, tiny, standard, high-risk, or exploratory workflow depth and emit the compact execution contract.
- `context-restore`: resume from Memory Bank routing files, context-state, and latest checkpoint.
- `select-tools`: choose minimum tools/MCPs and define access boundaries.
- `select-context`: choose the smallest safe context packet using work class, `activeContext.md`, and `contextIndex.md` first.
- `manage-context-state`: maintain assumptions, open questions, deferred decisions, and affected artifacts.
- `update-context-docs`: align durable docs, code-local docs, and Memory Bank routing summaries after behavior or structure changes.
- `engineering-principles-review`: challenge designs, plans, refactors, and implementations through maintainability principles.
- `context-save`: checkpoint the session and update `activeContext.md`, `progress.md`, and affected indexes.
- `setup-agent-instructions`: create or update `AGENTS.md`.

### Product and model
- `product-reframe`: challenge whether the request is the right thing to build.
- `define-application`: establish app-level purpose, users, workflows, data concepts, and scope.
- `choose-technical-approach`: select and record approved stack, architecture, runtime, persistence, deployment, testing, operations, and dependency constraints.
- `grill-me`: resolve assumptions through targeted questioning.
- `model-application`: create or update the durable diagrammed application model using approved technical constraints.
- `review-application-model`: challenge the model before PRD creation.
- `outside-voice-review`: advisory review of model, PRD, plan, issue breakdown, contract, or diff.

### Requirements, contracts, and issues
- `to-prd`: synthesize clarified context into a PRD.
- `review-prd-against-model`: check PRD/model alignment.
- `diagram-issues`: map feature and task dependencies before issue creation.
- `to-issues`: break PRDs into testable vertical slices.
- `review-issue-dependencies`: ensure issues are ordered, scoped, and independently testable.
- `write-contract-spec`: define observable public or cross-boundary behavior before implementation planning.
- `review-contract-spec`: block ambiguous, untestable, unsupported, or over-broad contracts.

### Planning and boundaries
- `write-implementation-plan`: convert one issue or coherent issue batch into an executable plan that stays within approved technical constraints.
- `review-implementation-plan`: block vague, untestable, or misaligned plans.
- `create-work-branch`: isolate implementation work.
- `safe-edit-boundary`: declare allowed files, commands, and scope limits.

### Implementation and verification
- `execute-plan`: orchestrate approved plan execution.
- `tdd`: perform per-behavior red-green-refactor where practical.
- `diagnose`: investigate bugs before fixing.
- `verification-before-completion`: collect fresh evidence before claiming done.
- `review-spec-compliance`: check implementation against issue, PRD, model, and contract when present.
- `assert-doc-sync`: prove code, tests, docs, contracts, and context agree before completion or doc updates.
- `review-code-quality`: review maintainability, engineering principle fit, code-local documentation, and operational risk after spec compliance.
- `process-review-feedback`: evaluate feedback before applying it.
- `health-check`: run broad project health checks without automatic fixes.
- `review-agent-work`: human-facing audit of AI work, verification evidence, process adherence, and artifact sync.

### Release and continuity
- `document-release`: update public or project-facing docs.
- `finish-development-branch`: summarize, verify, and present finish options.

### Optional memory and retrieval layer
- `graphify-index` and `graphify-query` are optional context-management accelerators for larger projects. They are not mandatory and are never sources of truth. Use them only when Memory Bank routing files, durable docs, documented code surfaces, and selected source files are insufficient.
- Other MCPs, such as documentation retrieval, reasoning, repo retrieval/index, or memory-sync tools, are optional infrastructure selected through `select-tools`.
