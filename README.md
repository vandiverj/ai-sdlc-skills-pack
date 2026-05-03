# AI SDLC Skills Pack

A working skills package for recursive, context-managed AI-assisted software development.

The pack is designed to help coding agents preserve product intent, application structure, technical approach, feature context, task state, verification evidence, public contracts, accurate code-local documentation, agent instructions, and unresolved questions across sessions without loading an entire repository or conversation by default.

## Contents

- `WORKFLOW.md` - ordered workflow, gates, context routing model, and skill groups.
- `SUMMARY.md` - working baseline and development notes for the pack.
- `skills/` - draft `SKILL.md` files for the workflow.
- `templates/` - starter docs and feature context templates.

## First principle

Use the minimum process that prevents the most likely expensive failure.

Start by classifying work as `Micro`, `Tiny`, `Standard`, `High-risk`, or `Exploratory`, then choose a fast-pass route, context depth, and dirty surfaces. Apply only the gates and artifact updates that route and those surfaces require.

## Fast-pass routing

Treat the workflow as a dependency graph, not a sequence to run every time.

- `Micro`/`Tiny`: context, lightweight boundary, direct edit/execute, verification, doc-sync only if needed, dirty-surface docs only.
- Standard: context, task/PRD, issue if needed, implementation plan, safe boundary, execution, verification, spec/code review, dirty-surface docs only.
- High-risk: all relevant gates, none skipped silently.
- Exploratory: context, optional product/model exploration, spike boundary, prototype execution, findings evidence, context-state, save.

A skipped gate is acceptable only when the classification explains why the failure it prevents is unlikely or cheap.

## Automated gating

The workflow is a map, not a mandatory ladder. Use context depth and dirty surfaces to avoid updating every file every time.

Dirty surfaces route updates: architecture changes update the model, requirements changes update PRDs, contract/public behavior changes update contracts, feature behavior changes update feature context/code-local docs, routing changes update Memory Bank, uncertainty changes update context-state, and agent instruction changes update AGENTS.md.

## Engineering principles

Use principles as review lenses, not slogans. First principles, assumption challenge, story readability, cohesion, coupling, simplicity, DRY, SOLID, and design patterns should help future maintainers understand the code's intent, boundaries, tradeoffs, and safe way to change it.

## Documentation model

Code-local docs own code-local truth. Use TSDoc/JSDoc, docstrings, generated API docs, or the project's native documentation convention for public exports, shared types/schemas, integration boundaries, non-obvious behavior, invariants, side effects, error behavior, and examples.

Feature `context.md` files should be thinner and more link-oriented when code-local docs are strong. They still own the feature-level map, workflow summary, key files, related artifacts, limitations, and context-loading guidance.

## Context model

The workflow uses a thin Memory Bank as a routing layer:

```text
docs/memory-bank/
  activeContext.md
  productContext.md
  progress.md
  decisionIndex.md
  contextIndex.md
```

Memory Bank files summarize current state, pending work, and routing. They do not store the full history of AI changes. Durable artifacts define and prove:

- Accurate code-local docs own source-local API and behavior truth.
- `AGENTS.md` owns concise agent commands, conventions, verification guidance, documentation rules, and security gotchas.
- `docs/application-model.md` owns application structure and diagrams.
- `docs/prds/` owns requirements.
- `docs/contracts/` owns public and cross-boundary contract specs when needed.
- `docs/decisions/` owns full ADR rationale.
- `src/features/<feature>/context.md` owns feature-level maps and loading guidance.
- `docs/context-state.md` owns uncertainty, assumptions, affected artifacts, and revisit triggers.

## Tool and MCP use

MCPs and tools are optional infrastructure. Use select-tools when external/current knowledge, tool access, or MCP boundaries matter. Tools retrieve or act; they do not remember for the project and they do not outrank local source-of-truth artifacts.

## Technical approach gate

When starting a project or changing meaningful technical surfaces, use `choose-technical-approach` to propose and approve stack, architecture, runtime, persistence, deployment, testing, operations, and dependency policy before deep modeling or implementation planning depends on those choices.

## Contract-first gate

When an issue changes a public or cross-boundary interface, write and review the contract before implementation planning.

Examples include public APIs, library exports, SDK surfaces, plugin interfaces, CLI commands, configuration formats, event/message schemas, data contracts, UI workflows, and external integrations.

This gate is conditional. Do not force it onto internal refactors, private implementation cleanup, small bug fixes, styling tweaks, or prototypes that do not change observable boundaries.

## Start here

For a new or returning project, begin with routing and context:

```text
classify-work
context-restore
select-context
manage-context-state
```

For new product or feature design, continue with:

`	ext
product-reframe
define-application
choose-technical-approach, when starting a project or changing technical surfaces
grill-me
model-application
review-application-model
to-prd
to-issues
```

For implementation, use:

```text
write-contract-spec / review-contract-spec, when public contracts change
write-implementation-plan
review-implementation-plan
create-work-branch
safe-edit-boundary
execute-plan / tdd
verification-before-completion
review-spec-compliance
review-code-quality
update-context-docs
finish-development-branch
context-save
```

## Non-negotiable gates

- Classify work before choosing workflow depth.
- No meaningful implementation before approved design or an explicit small-change exception.
- No major app or feature work without an application model or feature context.
- No issue enters implementation without a testable implementation plan.
- If public or cross-boundary behavior changes, no implementation plan before a reviewed contract spec.
- Public/shared/non-obvious behavior must have accurate code-local docs or an explicit documentation exception.
- High-risk work must address security, privacy, dependency, migration, and rollback concerns as applicable.
- No completion claim without fresh verification evidence.
- Reviews split spec compliance from code quality.
- Context docs, Memory Bank routing files, code-local docs, AGENTS.md, doc-sync assertions, and durable facts from tool/MCP output are part of Definition of Done when they changed or should have changed.

## Optional retrieval layer

Graph/index tooling such as Graphify can be added later as a memory and retrieval accelerator for larger projects. It should not be required for the core workflow and must not replace code, tests, code-local docs, PRDs, contracts, ADRs, application models, feature context files, AGENTS.md, or Memory Bank routing files as sources of truth.
## Repository scope

This repository is the reusable AI SDLC skills pack itself. It is not an application template and should stay independent from product repositories.

Future projects should copy, reference, or selectively install skills and templates from this repo rather than owning the pack's source directly.


## Recent workflow tightening

The workflow now treats `classify-work` as the primary entry point that emits a compact execution contract. It includes `Micro` work, dirty surface routing, mid-stream reclassification, conditional artifact sync, and `review-agent-work` for human audits of AI sessions.