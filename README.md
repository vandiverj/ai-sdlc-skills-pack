# AI SDLC Skills Pack

A working skills package for recursive, context-managed AI-assisted software development.

The pack is designed to help coding agents preserve product intent, application structure, technical approach, feature context, task state, verification evidence, public contracts, accurate code-local documentation, agent instructions, and unresolved questions across sessions without loading an entire repository or conversation by default.

## Contents

- `WORKFLOW.md` - ordered workflow, gates, context routing model, and skill groups.
- `SUMMARY.md` - working baseline and development notes for the pack.
- `skills/` - loader-compatible `SKILL.md` files for the workflow.
- `agents/` - portable Markdown definitions for optional specialist, worker, reviewer, and handoff agents.
- `agent-contracts/` - legacy compatibility role contracts kept until downstream references move to `agents/`.
- `scripts/` - repository maintenance checks for skill file format and related rails.
- `bin/sdlc` and `scripts/sdlc/` - small dependency-free helper CLI for task open/start/current/id/bundle/status/review/checkpoint/ledger/verify/QA/finish/complete, readiness, health, setup bootstrap/doctor/full doctor/install check, profile, context restore/audit/freshness/contradiction/inventory/place/update plans, change graph lite, workspace map/work-mode detection, run start/finish, touched/impact/QA/manual-smoke/verification packets, route packets, review/release packets, packet completion/status, gates, done checks, multi-repo ledger/QA, contract, data, integration, test-plan/test-suggest and handoff draft packets, security permission/tool audits, scenario validation/testing, rendered plan/evidence/smoke, verification, calibration/learned-flow promotion, and handoff mechanics.
- `templates/` - starter docs, external context-root templates, SDLC scenarios, and feature context templates.

## Common Agent Prompts

Use chat as the normal interface and let the agent run the helper commands:

```text
Use SDLC for this task: <task>. Determine the scope, implement, verify, generate QA Markdown if needed, and stop at the finish decision before commit or push.
```

```text
Use SDLC and review the current completion state of this task: <task>.
```

More examples live in `templates/docs/agents/sdlc-agent-prompts.md`.

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

Dirty surfaces route updates: architecture changes update the model, requirements changes update PRDs, contract/public behavior changes update contracts, quality automation changes update command wiring and verification guidance, retrieval approach changes update index/tool boundaries, implementation pattern changes update `docs/patterns`, feature behavior changes update feature context/code-local docs, routing changes update Memory Bank, uncertainty changes update context-state, and agent instruction changes update AGENTS.md.

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
- `.agents/agents/` owns skills-pack portable agent role definitions; downstream `docs/agents/` owns project-local model-tier policy, delegation patterns, runtime adapters, and learning loop guidance.
- `docs/patterns/` owns project-specific implementation pattern guidance, maturity, examples, exceptions, and change triggers.
- `src/features/<feature>/context.md` owns feature-level maps and loading guidance.
- `docs/context-state.md` owns uncertainty, assumptions, affected artifacts, and revisit triggers.

Process-learning metrics live separately from Memory Bank:

```text
docs/process-improvement/
  events.jsonl
  friction-log.md
```

Use the `process-learning` router to record small observations about friction, gaps, corrections, near misses, and useful workflow successes during project work, then aggregate those events across projects and propose evidence-backed improvements to project guidance, templates, tooling, retrieval, or the skills pack.

## Tool and MCP use

MCPs and tools are optional infrastructure. Use select-tools when external/current knowledge, tool access, or MCP boundaries matter. Tools retrieve or act; they do not remember for the project and they do not outrank local source-of-truth artifacts.

## Agent strategy

Use the `agents` router when Standard, High-risk, Exploratory, review, release, or cross-cutting work may benefit from delegation, specialist review, independent verification, or model-tier selection.

The skills pack defines portable specialist roles in `.agents/agents/*.md`. Downstream projects define project-local agent strategy and model tiers in `docs/agents/*`; runtime-specific files for Codex, VS Code/Copilot, Augment, Claude Code, or other tools are adapters. Keep adapters thin and do not let them outrank `AGENTS.md`, workflow docs, skills, portable agent definitions, or source-of-truth artifacts.

Use the minimum model tier and fewest agents that can satisfy the evidence requirement. Escalate by concrete triggers such as low confidence, failed verification, conflicting artifacts, risky surfaces, or an inability to produce a testable plan or reviewable diff.

## Implementation patterns

Use the `implementation` router when work touches repeated project-specific surfaces such as forms, tables, modals, data fetching, API handlers, error handling, tests, layouts, or feature module structure.

Implementation patterns live in `docs/patterns/*`. They capture project-specific guidance that deterministic tools cannot express. They start as Emerging, harden through reviewed evidence, and can be deprecated or superseded when requirements, design systems, frameworks, accessibility, security, or performance constraints change.

Do not use pattern docs to duplicate formatter, linter, typechecker, schema, accessibility, test, or CI rules.

## Technical approach gate

When starting a project or changing meaningful technical surfaces, use the `implementation` router's technical approach reference to propose and approve stack, architecture, runtime, persistence, deployment, testing, operations, and dependency policy before deep modeling or implementation planning depends on those choices.

## Quality automation gate

Use the `quality` router when a project needs explicit decisions about formatter, linter, typecheck, test, build, contract, accessibility, security, dependency, license, generated artifact, documentation, or CI/local preflight checks.

The goal is to let deterministic tools catch repeatable problems so agents reserve judgment for product intent, architecture, contracts, usability, maintainability, and risk.

## Retrieval approach gate

Use the `tools` router when a project may need optional RAG, embeddings, vector search, graph indexing, repo retrieval, Obsidian-like navigation, or another retrieval layer to find source artifacts reliably.

Retrieval output is a pointer, not proof. It should help agents load authoritative code, tests, PRDs, contracts, ADRs, application models, feature context, AGENTS.md, context-state, and Memory Bank routing files.

## Contract-first gate

When an issue changes a public or cross-boundary interface, write and review the contract before implementation planning.

Examples include public APIs, library exports, SDK surfaces, plugin interfaces, CLI commands, configuration formats, event/message schemas, data contracts, UI workflows, and external integrations.

This gate is conditional. Do not force it onto internal refactors, private implementation cleanup, small bug fixes, styling tweaks, or prototypes that do not change observable boundaries.

## Start here

For most work, start with `run-sdlc`. It classifies the request, chooses the fast-pass route, invokes the right skills, and stops at human consent gates instead of making the human manually pick workflow steps.

To install or refresh the SDLC in a downstream repository, use:

```text
setup-sdlc-in-repo
agents, if AGENTS.md, agent roles, model tiers, or runtime adapters are needed
implementation, if technical approach or project-specific pattern guidance is needed
quality, if verification or quality rails are missing or changing
tools, if retrieval or tool boundaries are needed
```

For lower-level manual routing, begin with context:

```text
classify-work
context
```

For new product or feature design, continue with:

```text
product-reframe
define-application
implementation, when starting a project or changing technical surfaces
quality, when quality rails are missing or changing
tools, when retrieval/RAG/indexing may be justified
agents, when delegation, specialists, or model tiers may matter
grill-me
planning
review
```

For implementation, use:

```text
planning, including contract specs and implementation plans
quality, when verification or tooling rails are missing or changing
tools, when context selection or retrieval rails are missing or changing
agents, when delegation, specialist review, or independent verification would reduce risk
implementation, for safe edit boundary, execution, TDD, technical approach, and patterns
quality, for verification before completion
review, for spec compliance, code quality, threat, design, planning, and release review
context, for durable docs/context updates and save
release, for branch finish, handoff, commit, push, or publication guidance
```

For process improvement across projects, use:

```text
process-learning, when real work exposes process friction, gaps, corrections, near misses, useful successes, or repeated lessons
agents, when reviewed evidence shows agent roles, model tiers, or adapters should change
implementation, when reviewed evidence shows project patterns should emerge, harden, deprecate, or change
```

## Non-negotiable gates

- Classify work before choosing workflow depth.
- No meaningful implementation before approved design or an explicit small-change exception.
- No major app or feature work without an application model or feature context.
- No issue enters implementation without a testable implementation plan.
- If public or cross-boundary behavior changes, no implementation plan before a reviewed contract spec.
- Public/shared/non-obvious behavior must have accurate code-local docs or an explicit documentation exception.
- Repeatable quality checks should be automated and documented when the project risk profile justifies them.
- Retrieval, RAG, graph, embedding, or human navigation layers are optional aids for finding authoritative artifacts, not sources of truth.
- Agent roles, subagents, model tiers, and runtime adapters are optional execution aids; they must stay bounded, reviewable, and subordinate to portable SDLC docs and project artifacts.
- Project implementation patterns are preferred defaults for product-specific consistency; they must be evidence-backed, reviewable, and subordinate to requirements, contracts, accessibility, security, and deterministic tooling.
- Process-learning events are optional evidence for improving the workflow; they are not product requirements, technical decisions, completion evidence, or hidden memory.
- High-risk work must address security, privacy, dependency, migration, and rollback concerns as applicable.
- No completion claim without fresh verification evidence.
- Reviews split spec compliance from code quality.
- Context docs, Memory Bank routing files, code-local docs, AGENTS.md, doc-sync assertions, and durable facts from tool/MCP output are part of Definition of Done when they changed or should have changed.

## Optional retrieval layer

Retrieval/index tooling such as Graphify, embeddings, vector search, repo retrieval, or Obsidian-style navigation can be added later as an accelerator for larger projects. Use the `tools` router before adding it. It should not be required for the core workflow and must not replace code, tests, code-local docs, PRDs, contracts, ADRs, application models, feature context files, AGENTS.md, or Memory Bank routing files as sources of truth.
## Repository scope

This repository is the reusable AI SDLC skills pack itself. It is not an application template and should stay independent from product repositories.

Future projects should copy, reference, or selectively install skills and templates from this repo rather than owning the pack's source directly.

## Skill source format

Each source `skills/*/SKILL.md` file must begin at byte 0 with YAML frontmatter:

```yaml
---
name: run-sdlc
description: 'Short loader description.'
user-invocable: true
---
```

Do not save skill files with a UTF-8 BOM. The Codex skill loader expects the first bytes to be the plain `---` delimiter.


## Recent workflow tightening

The workflow now treats `classify-work` as the primary entry point that emits a compact execution contract. It includes `Micro` work, dirty surface routing, mid-stream reclassification, conditional artifact sync, and `review-agent-work` for human review of AI sessions through Git diffs, scoped commits, and verification evidence.
