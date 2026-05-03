# choose-technical-approach

## Description
Choose, review, or revise the approved technical approach for a project, feature, or subsystem, including stack, architecture style, runtime, persistence, deployment, testing, operations, dependency policy, and approval triggers.

## Use when
- Starting a new project after the application definition is clear enough to know workflows, data, users, integrations, and MVP boundaries.
- A meaningful feature needs a new framework, library, service, database, runtime, hosting target, auth provider, queue, job system, AI provider, testing tool, or deployment model.
- Existing technical choices constrain requirements, architecture, testing, security, cost, performance, or maintainability.
- Implementation reveals that the approved approach cannot support the requirement cleanly.
- `classify-work`, `define-application`, `model-application`, `write-implementation-plan`, or `review-implementation-plan` detects an unapproved technical surface change.

## Purpose
Make technical direction explicit before modeling, PRDs, issue slicing, or implementation plans depend on it. Prevent agents from silently introducing stack choices, infrastructure, services, or dependencies while coding.

## Read first
1. `define-application` output or existing application definition.
2. Product constraints, users, workflows, data concepts, integrations, MVP boundary, and non-goals.
3. Existing `docs/application-model.md`, ADRs, AGENTS.md, package/build files, deployment files, and repo conventions if the project already exists.
4. Relevant `docs/context-state.md` entries.
5. Current external docs through `select-tools` when version-specific library, service, license, security, or deployment facts matter.

## Required output

```text
Technical decision needed:
Decision scope:
Inputs considered:
Product constraints:
Engineering constraints:
Operational constraints:
Existing constraints:
Options considered:
Recommended approach:
Why:
Tradeoffs:
Risks and mitigations:
Rejected options:
Approved dependencies/services:
Needs human approval:
Future reconsideration triggers:
Artifacts to update:
Next skill:
```

## Decision areas
Consider only the areas that matter for the current scope:

- Language, runtime, framework, and package manager.
- Architecture style and module boundaries.
- UI system, accessibility strategy, and browser/device targets.
- Persistence, schema/migration strategy, caching, search, queues, jobs, and background processing.
- API, CLI, SDK, plugin, event, or integration style.
- Auth, permissions, secrets, privacy, data retention, export, deletion, and compliance constraints.
- Hosting, deployment, environments, configuration, observability, rollback, and release strategy.
- Testing strategy: unit, integration, contract, E2E, visual, type/schema, smoke, security/dependency.
- Quality automation handoff: which verification, build, lint, type/schema, security, dependency, generated artifact, documentation, and CI/local preflight decisions need `choose-quality-automation`.
- Retrieval handoff: whether RAG, embeddings, vector search, graph/index tooling, repo retrieval, hosted search, or human navigation needs `choose-retrieval-approach`.
- Dependency policy: new packages, services, licenses, supply-chain risk, maintenance health, and lock-in.
- Cost, scale, performance, portability, developer experience, and maintenance burden.

## Approval behavior
Ask for human approval before accepting:

- Initial project stack or architecture style.
- Database/storage choice.
- Auth, payments, AI provider, cloud service, hosted dependency, or external integration.
- New runtime/framework/build system/package manager.
- Production dependency with meaningful license, security, cost, lock-in, privacy, or maintenance risk.
- Deployment target, migration strategy, data retention model, or rollback limitation.

Do not require human approval for tiny internal helpers, already-approved local conventions, or test-only utilities that fit the approved testing strategy and carry low risk.

## Artifact updates
After approval, route updates to the owning artifacts:

- `docs/decisions/000x-<decision>.md` owns durable technical rationale.
- `docs/application-model.md` owns architecture/runtime/data/deployment implications.
- `AGENTS.md` owns package manager, setup commands, verification commands, conventions, and tool rules.
- `docs/context-state.md` owns unresolved assumptions, rejected-but-revisitable options, and reconsideration triggers.
- `docs/memory-bank/decisionIndex.md` links to the ADR.
- `docs/memory-bank/contextIndex.md` explains which stack/config/docs future agents should load.

Prefer ADRs plus the application model. Create a separate `docs/technical-approach.md` only when the project is large enough that one or two ADRs are not enough.

## Workflow impact
Use the approved approach to prune irrelevant workflow steps:

- Local-first or desktop app -> emphasize local storage, packaging, filesystem, sync, and update model; skip cloud/server gates unless needed.
- Hosted SaaS -> include auth, privacy, deployment, environments, observability, migrations, rollback, and secrets.
- Static frontend -> avoid backend/database issue slicing unless an API or persistence layer is chosen.
- Managed backend/service -> record vendor limits, pricing, lock-in, portability, and operational assumptions.
- Library/CLI/plugin -> emphasize public contracts, compatibility, type/schema tests, docs, and release/versioning.

## Hard rules
- Do not choose technology because it is popular or familiar.
- Do not add infrastructure before product needs justify it.
- Do not introduce a new dependency, framework, service, or runtime silently during implementation.
- Do not rely on stale memory for version-sensitive technical facts; use `select-tools` for current docs when needed.
- Do not bury stack approval inside implementation planning.
- Prefer boring, well-supported tools unless product constraints justify novelty.
- Record tradeoffs and rejected options, not just the winner.
- If an implementation plan violates the approved approach, return to this skill before coding.

## Next skills
Usually `choose-quality-automation`, `choose-retrieval-approach`, `model-application`, `review-application-model`, `to-prd`, `write-implementation-plan`, `review-implementation-plan`, `manage-context-state`, or `update-context-docs`.
