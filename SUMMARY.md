# AI SDLC Skills Working Baseline

This package is a working point for a recursive, context-managed SDLC for AI-assisted software projects. It combines ideas from Matt Pocock-style skills, gstack, Superpowers, Memory Bank-style continuity, contract-first development, risk-based workflow routing, engineering-principles review, code-local documentation, and a custom layer for application modeling, diagrams, recursive alignment, feature context files, and active context selection.

## Core philosophy

Use the minimum process that prevents the most likely expensive failure.

The workflow should not be linear:

```text
idea -> PRD -> issues -> code
```

It should be recursive and context-aware:

```text
classify work
-> restore context
-> select only necessary context
-> reframe product when needed
-> define application and technical approach when needed
-> capture open questions
-> write PRD/issues/contracts when needed
-> write implementation plan when needed
-> code with TDD where practical
-> verify with evidence
-> review spec compliance, code quality, and code-local docs
-> update docs/context/agent instructions
-> finish branch
-> save context
```

The purpose is to prevent AI drift by keeping the application model, technical decisions, PRDs, issues, contracts, tests, implementation, code-local docs, feature context files, Memory Bank routing summaries, agent instructions, and unresolved questions aligned without forcing heavy process onto tiny work.

## Work classification

Every task should be routed by risk before choosing gates:

- `Micro`: no-behavior, no-risk, obvious local edit.
- `Tiny`: obvious, local, low-risk, easy to verify.
- `Standard`: bounded feature, moderate bug fix, or multi-file change with clear requirements.
- `High-risk`: touches public contracts, data, security, auth, privacy, migrations, infrastructure, dependencies, integrations, concurrency, or broad architecture.
- `Exploratory`: spike, prototype, research, or uncertain feasibility work with a non-production boundary.



## Fast-pass routing

Treat the workflow as a dependency graph, not a sequence to run every time. `classify-work` chooses the fast-pass route, context depth, dirty surfaces, skipped gates, and escalation triggers.

Routes:
- `Micro`: minimal context, tiny boundary, direct edit, smallest relevant verification.
- `Tiny`: context, lightweight boundary, direct edit/execute, verification, doc-sync only if needed, dirty docs only.
- `Standard`: context, task/PRD, issue if needed, implementation plan, safe boundary, execution, verification, spec/code review, dirty docs only.
- `High-risk`: all relevant gates, none skipped silently.
- `Exploratory`: context, optional product/model exploration, spike boundary, prototype execution, findings evidence, context-state, save.

A skipped gate is acceptable only when the classification explains why the failure it prevents is unlikely or cheap.
## Automated gating

The workflow is a map, not a mandatory ladder. `classify-work` produces a fast-pass route, context depth, and dirty surfaces so agents run only the gates and artifact updates that are actually needed.

Context depth:
- `Shallow`: current file, nearby tests, immediate feature context.
- `Feature`: feature context, related source/tests, related PRD/contract excerpts.
- `Deep`: application model sections, PRD, contract, decision index/ADRs, context-state.
- `Cross-Cutting`: Memory Bank routing, multiple feature contexts, model sections, decisions, contracts, and broader retrieval.

Dirty surfaces route artifact updates:
- `requirementsSurfaceChanged` -> PRD, issue, acceptance criteria, or model section.
- `publicContractSurfaceChanged` -> contract spec, public docs, schemas, examples, compatibility notes.
- `systemSurfaceChanged` -> application model, ADRs, diagrams, boundaries, feature context.
- `verificationSurfaceChanged` -> tests, verification plan, health-check expectations.
- `docsContextSurfaceChanged` -> code-local docs, feature context, Memory Bank routing, context index, release/developer docs.
- `riskSurfaceChanged` -> security/privacy/dependency/license/migration/rollback/performance/accessibility/observability/rollout review.
- `agentOpsSurfaceChanged` -> AGENTS.md, setup commands, verification commands, workflow guidance.
- `uncertaintyChanged` -> context-state.

Do not update every file every time. Reclassify mid-stream when implementation, verification, review, or doc-sync shows the route was wrong.
## Engineering principles

Use engineering principles as judgment lenses, not slogans. First-principles reasoning, assumption challenge, story readability, single responsibility, cohesion, coupling, simplicity, DRY, SOLID, and design patterns should improve maintainability rather than create ceremony.

A future maintainer should understand the code's intent, boundaries, tradeoffs, and safe way to change it.

## Code-local documentation

Code-local documentation owns code-local truth:

- public exports
- shared interfaces/types/schemas
- plugin/API/CLI/integration boundaries
- non-obvious domain behavior
- invariants and side effects
- error behavior and compatibility notes
- examples

Use the project's native documentation style, such as TSDoc/JSDoc, docstrings, generated API docs, or language-specific equivalents.

Code-local docs should make feature `context.md` thinner and more link-oriented. They do not replace feature context, application models, PRDs, contracts, ADRs, Memory Bank files, or context-state.

## Context Ledger + Routing Index

Use a thin Memory Bank as a routing layer, not as a second source of truth:

```text
docs/
  memory-bank/
    activeContext.md
    productContext.md
    progress.md
    decisionIndex.md
    contextIndex.md
```

File ownership:

- `activeContext.md` owns current focus, branch, immediate next action, and blockers. It is rewritten often.
- `productContext.md` owns product thesis, target users, product principles, north-star constraints, and non-goals.
- progress.md owns current status, pending work, known gaps, and not-yet-done work. It mentions completed work only when needed to explain current state.
- `decisionIndex.md` owns a concise decision index with links to ADRs.
- `contextIndex.md` owns the map of important artifacts and when to load them.
- docs/context-state.md owns uncertainty: assumptions, open questions, deferred decisions, blocked items, affected artifacts, and revisit triggers.

Decision rule: Memory Bank stores what is known and what is next. docs/context-state.md stores what is unknown, suspected, deferred, contradicted, blocked, or needs review.

Memory Bank files summarize current state, pending work, and routing. They do not store the full history of AI changes. Durable artifacts define and prove.

## Tool and MCP use

Tools and MCPs provide retrieval, reasoning scaffolds, and actions. They do not remember for the project and they do not outrank local source-of-truth artifacts.

Use select-tools when external/current knowledge, tool access, or MCP boundaries matter. Use MCPs to retrieve or act, not to remember. Record durable decisions or verified facts in the owning artifact, not raw tool dumps in Memory Bank files.

## Agent instructions

Projects should maintain `AGENTS.md` when practical. It owns concise agent-facing setup commands, verification commands, conventions, code-local documentation rules, security gotchas, workflow gates, and PR/release instructions. It should link to deeper docs rather than duplicating them.

## Technical approach

For new projects or meaningful technical surface changes, choose and approve the technical approach before deep modeling, PRD breakdown, or implementation planning. This includes stack, architecture style, runtime, persistence, deployment, testing, operations, and dependency policy.

Use `choose-technical-approach` after `define-application` has enough product/workflow/data context, and before `model-application` depends on stack constraints. Re-run it when a feature needs a new framework, library, service, database, runtime, hosting target, auth provider, queue, job system, AI provider, testing tool, deployment model, or other technical surface change.

Approved technical choices belong in ADRs, docs/application-model.md, AGENTS.md, docs/context-state.md, and Memory Bank indexes as applicable.

## Contract-first development

When an issue changes public or cross-boundary behavior, write and review a contract spec before implementation planning.

Examples include public APIs, library exports, SDK surfaces, plugin interfaces, CLI commands, configuration formats, event/message schemas, data contracts, UI workflows, and external integrations.

The contract is language-neutral by default. In TypeScript projects it may include exported type/interface sketches, schema files, type tests, or declaration expectations, but `.d.ts` files are not mandatory unless they are the right local artifact.

Skip this gate when the work does not change observable boundaries.

## Primary artifacts

```text
AGENTS.md

docs/
  ai-sdlc-workflow.md
  application-model.md
  context-state.md
  memory-bank/
    activeContext.md
    productContext.md
    progress.md
    decisionIndex.md
    contextIndex.md
  prds/
    app.md
    features/
      <feature>.md
  contracts/
    <feature-or-interface>.md
  decisions/
    0001-<decision>.md
  workflows/
    <workflow>.md
  session-checkpoints/
    <date>-<topic>.md
  knowledge-graph/
    GRAPH_REPORT.md

src/
  features/
    <feature>/
      context.md
```

## Source-of-truth hierarchy

```text
1. Current code, tests, and accurate code-local docs
2. Application model / PRDs / contract specs / ADRs / feature context.md files
3. AGENTS.md for agent-facing commands and conventions
4. context-state.md uncertainty ledger
5. Memory Bank routing summaries and indexes
6. Optional knowledge graph / retrieval reports
7. Conversation history
```

Conversation history is useful but not durable. If a decision matters, it belongs in the relevant artifact or index.

## Required gates

1. Classify work before choosing fast-pass route, workflow depth, context depth, and dirty surfaces.
2. No meaningful implementation before approved design or an explicit small-change exception.
3. No app or feature work without an application model or feature context.
4. Diagrams are part of requirements when they clarify workflows, dependencies, entities, or state.
5. No issue enters implementation until it has a testable implementation plan.
6. If public or cross-boundary behavior changes, no implementation plan until the contract spec is reviewed.
7. High-risk work must include security/privacy/dependency/migration/rollback considerations as applicable.
8. Public/shared/non-obvious code behavior must have accurate code-local documentation or an explicit documentation exception.
9. No production code before a failing test where practical; exceptions must be explicit.
10. No completion claims without fresh verification evidence from the current session.
11. Reviews split spec compliance first and code quality second.
12. Review feedback must be evaluated, not blindly applied.
13. If implementation reveals unclear requirements, return to model, PRD, contract, issues, implementation plan, or context-state.
14. Context docs, Memory Bank routing files, code-local docs, and AGENTS.md are part of Definition of Done when they changed or should have changed.
15. Code/docs/contracts/context sync must be asserted when related dirty surfaces are true; docs must not be silently updated to match possibly wrong code.
15. Load the smallest safe context packet and expand only when the packet is insufficient.

## Core workflow

See `WORKFLOW.md` for the canonical workflow map.

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
14. diagram-issues
15. to-issues
16. review-issue-dependencies
17. write-contract-spec, when public/cross-boundary behavior changes
18. review-contract-spec, when a contract spec is required
19. write-implementation-plan
20. review-implementation-plan
21. create-work-branch
22. safe-edit-boundary
23. execute-plan / tdd
24. verification-before-completion
25. review-spec-compliance
26. assert-doc-sync, when code/docs/contracts/context may disagree
27. engineering-principles-review, when complexity/readability/abstraction risk warrants it
28. review-code-quality
29. process-review-feedback
30. health-check
31. document-release
32. update-context-docs
33. manage-context-state
34. setup-agent-instructions, when agent instructions changed or are missing
35. finish-development-branch
36. review-agent-work, when a human wants to audit AI work before continuing or merging
37. context-save
```

## Core skill boundaries

- classify-work chooses fast-pass route, workflow depth, context depth, dirty surfaces, confidence, evidence requirements, and escalation triggers. It does not solve the task.
- `assert-doc-sync` checks whether code, tests, docs, contracts, and context agree before completion or doc updates. If code and docs disagree, assume implementation may be wrong until verified.
- `select-tools` chooses optional tools/MCPs and access boundaries. It does not make tool output a source of truth.
- `context-restore` resumes from Memory Bank routing files, context-state, and checkpoints.
- `select-context` decides what to load. It does not solve the task.
- `manage-context-state` records uncertainty and affected artifacts. It does not replace PRDs, contracts, ADRs, feature context files, AGENTS.md, or Memory Bank routing files.
- `choose-technical-approach` selects and records approved stack, architecture, runtime, persistence, deployment, testing, operations, and dependency constraints. It does not implement.
- `model-application` defines structure and diagrams using approved technical constraints. It does not create implementation issues.
- `to-prd` defines durable requirements. It does not break work into tasks.
- `write-contract-spec` defines observable public or cross-boundary behavior. It does not implement.
- `review-contract-spec` checks whether the contract is clear, supported, and testable.
- `write-implementation-plan` makes one issue executable. It does not implement.
- `execute-plan` orchestrates implementation. `tdd` is the per-behavior discipline used inside execution.
- `verification-before-completion` reports fresh evidence. It does not infer success from old runs.
- `engineering-principles-review` asks whether the design or code is understandable, cohesive, appropriately abstracted, and maintainable.
- `review-spec-compliance` asks whether the implementation built the right thing. `review-code-quality` asks whether it was built well, safely, operably, accessibly when UI is involved, and with accurate code-local documentation.
- `review-agent-work` audits prior AI work for classification quality, skipped gates, verification evidence, artifact sync, and unsafe silent changes.

## Optional memory and retrieval layer

Graph/indexing tools such as Graphify may be useful later for large repositories. Treat them as optional retrieval accelerators that help select context. They must not become mandatory workflow dependencies and must not outrank code, tests, code-local docs, PRDs, contract specs, ADRs, application models, feature context files, AGENTS.md, context-state, or Memory Bank routing files.

## Definition of Done

A task is not done until:

- Work classification, fast-pass route, context depth, and dirty surfaces were appropriate or corrected.
- Complex or hard-to-read designs/code received engineering-principles review when warranted.
- Implementation matches the issue.
- Issue matches the PRD.
- Public or cross-boundary behavior matches the reviewed contract spec, if one exists.
- PRD matches the application model.
- Public/shared/non-obvious behavior has accurate code-local documentation or a documented exception.
- Code/docs/contracts/context sync was asserted when related dirty surfaces were true.
- Tests were written first where practical, or an exception is documented.
- Tests and relevant verification commands were run in the current session.
- High-risk security/privacy/dependency/license/migration/rollback/performance/accessibility/observability concerns are addressed or explicitly accepted.
- Health-check passes or exceptions are documented.
- Spec compliance review passes.
- Code quality review passes or accepted risks are recorded.
- Review feedback is processed intentionally.
- Feature `context.md` is updated if behavior, structure, related artifacts, loading guidance, or public surface changed.
- `docs/application-model.md` is updated if feature boundaries, workflows, entities, or architecture changed.
- docs/context-state.md is updated with resolved, deferred, open, and affected items.
- Technical approach ADRs, application model, AGENTS.md, and context indexes are updated when stack, dependency, deployment, testing, or operations decisions changed.
- Memory Bank routing files are updated if current focus, pending work, known gaps, product context, decision indexes, or context indexes changed.
- `AGENTS.md` is updated if agent commands, conventions, documentation rules, security gotchas, or verification guidance changed.
- Public or developer docs are updated if behavior changed.
- `context-save` records current state, next step, and durable facts from any tool/MCP output that affected the work.

## Recommended next development work for this pack

1. Pressure-test risk classification, context spine, contract-first gate, and code-local documentation expectations on a real feature.
2. Tighten review skills using examples from those runs.
3. Add templates only after the final process shape is concrete.
4. Decide whether optional graph/index tooling belongs in the pack or in a separate companion pack.