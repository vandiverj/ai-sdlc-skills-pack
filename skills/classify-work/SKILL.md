# classify-work

## Description
Classify requested work by risk, confidence, context depth, dirty surfaces, required gates, and fast-pass route so the agent runs the minimum workflow needed to prevent expensive failure.

## Use when
- Starting any new task.
- Reality changes during execution and the current route may be wrong.
- The agent needs to decide which skills, artifacts, tools, and verification evidence are required.
- A task may be micro, tiny, standard, high-risk, exploratory, shallow, deep, or cross-cutting.

## Purpose
Prevent two failure modes:

- Too little process for risky work, causing drift, security issues, broken contracts, stale docs, or unverified behavior.
- Too much process for small work, causing documentation churn, context exhaustion, and slow delivery.

## Required output
Return a compact execution contract:

```text
Work class:
Classification confidence:
Risk level:
Context depth:
Fast-pass route:
Why:
Dirty surfaces:
Required gates:
Technical approach status:
Quality automation status:
Retrieval approach status:
Agent strategy status:
Implementation pattern status:
Threat model status:
Production readiness status:
Optional gates:
Skipped gates and reason:
Required context:
Required tools/MCPs:
Required verification:
Context/documentation updates:
Escalation triggers:
Reclassification triggers:
Next skill:
```

Prefer short, decisive answers. The execution contract should be small enough for the agent to follow without re-deciding the whole process.

## Fast-pass principle
The workflow is a dependency graph, not a mandatory ladder. A skipped gate is acceptable only when the classification explains why the failure it prevents is unlikely or cheap.

## Work classes and fast-pass routes

### Micro
Use for no-behavior, no-risk edits that are obvious and local.

Examples: typo fix, formatting-only change, comment wording, dead link update, mechanical rename within one private scope, lint-only cleanup.

Fast-pass route:
```text
classify-work
-> select-context, minimal
-> safe-edit-boundary, implicit or one-line
-> direct edit
-> verification-before-completion, smallest relevant check or documented inspection
```

Escalate out of Micro if behavior, tests, public docs, generated artifacts, shared code, or more than one meaningful file changes.

### Tiny
Use for changes that are obvious, local, low-risk, and easy to verify.

Examples: small copy edit, simple config comment, narrow test expectation update, one-line bug fix with clear behavior.

Fast-pass route:
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

Usually skip application modeling, PRD, issues, contract spec, implementation plan, outside voice, broad reviews, and branch finishing.

### Standard
Use for bounded feature work, moderate bug fixes, or multi-file changes with clear requirements.

Fast-pass route:
```text
classify-work
-> select-tools, only if needed
-> select-context
-> choose-implementation-pattern, if repeated project-specific patterns may apply
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

For Standard work, spec compliance, artifact sync, and code quality can be performed as one concise review pass when risk is low and the dirty surfaces are narrow.

### High-risk
Use when the change affects public contracts, data, security, auth, payments, privacy, permissions, migrations, infrastructure, external integrations, concurrency, irreversible operations, or broad architecture.

Fast-pass route:
```text
Run all relevant gates, none skipped silently.
```

High-risk does not always mean every step. Every skipped gate must be justified. Keep spec compliance, artifact sync, and code quality as distinct passes for high-risk work.

Usually required:
- model/PRD/context-state alignment
- contract spec when public/cross-boundary behavior changes
- structured reasoning or `select-tools` for Sequential Thinking-style support when useful
- `threat-model` when security, privacy, data, dependency, integration, untrusted input, AI/agent, tool-access, or abuse-case risk is present
- implementation plan and review
- security/privacy/supply-chain/license risk review
- data retention/deletion review when user data is involved
- migration rehearsal or rollback/mitigation plan where relevant
- contract/type/schema stress testing where relevant
- performance, accessibility, observability, and rollout checks where relevant
- fresh verification evidence
- `production-readiness-review` before merge/release/deploy/handoff for production-intended changes
- `assert-doc-sync`
- context and release documentation updates only where dirty surfaces require them

### Exploratory
Use for spikes, prototypes, research, or uncertain feasibility work.

Fast-pass route:
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

## Context depth

- `Shallow`: current file, nearby tests, immediate feature context.
- `Feature`: feature `context.md`, related source/tests, related PRD/contract excerpts, nearby decisions.
- `Deep`: application model sections, PRD, contract, decision index/ADRs, context-state.
- `Cross-Cutting`: Memory Bank routing, multiple feature contexts, model sections, decisions, contracts, and broader retrieval/index support.

## Dirty surfaces
Dirty surfaces decide which artifacts are eligible to update. Do not update every artifact by default.

```text
requirementsSurfaceChanged: yes/no
publicContractSurfaceChanged: yes/no
systemSurfaceChanged: yes/no
technicalApproachChanged: yes/no
qualityAutomationChanged: yes/no
retrievalApproachChanged: yes/no
verificationSurfaceChanged: yes/no
docsContextSurfaceChanged: yes/no
riskSurfaceChanged: yes/no
implementationPatternChanged: yes/no
agentOpsSurfaceChanged: yes/no
agentStrategyChanged: yes/no
processLearningSurfaceChanged: yes/no
uncertaintyChanged: yes/no
```

Surface routing:
- `requirementsSurfaceChanged` -> update/review product intent, PRD, issue, acceptance criteria, or application model section.
- `publicContractSurfaceChanged` -> write/review contract spec; update public API docs, schemas, type docs, examples, or compatibility notes.
- `technicalApproachChanged` -> run `choose-technical-approach`; update ADRs, application model, AGENTS.md, context-state, and Memory Bank indexes as applicable.
- `qualityAutomationChanged` -> run `choose-quality-automation`; update command wiring, CI/local preflight docs, AGENTS.md, verification expectations, context-state, and Memory Bank indexes as applicable.
- `retrievalApproachChanged` -> run `choose-retrieval-approach`; update retrieval decisions, tool boundaries, index/report locations, freshness expectations, AGENTS.md, context-state, and Memory Bank indexes as applicable.
- systemSurfaceChanged -> update/review application model, ADRs, diagrams, dependency boundaries, data flows, or feature context.
- `verificationSurfaceChanged` -> update tests, verification plan, health-check expectations, or evidence requirements.
- `docsContextSurfaceChanged` -> update code-local docs, feature context, Memory Bank routing, context index, release docs, or developer docs.
- `riskSurfaceChanged` -> run `threat-model`, security/privacy/dependency/license/migration/rollback/performance/accessibility/observability/rollout review, or `production-readiness-review` as applicable.
- `implementationPatternChanged` -> run `choose-implementation-pattern`, `review-implementation-pattern`, or `update-implementation-patterns`; update `docs/patterns/*`, feature context, AGENTS.md, context-state, or Memory Bank indexes as applicable.
- `agentOpsSurfaceChanged` -> update `AGENTS.md`, setup commands, verification commands, safe-edit rules, or workflow guidance.
- `agentStrategyChanged` -> run `choose-agent-strategy`, `review-agent-strategy`, or `update-agent-definitions`; update `docs/agents/*`, runtime adapters, or AGENTS.md as applicable.
- `processLearningSurfaceChanged` -> run `capture-process-event` or include the evidence in a `review-process-learning` report.
- `uncertaintyChanged` -> update `docs/context-state.md`.

Legacy dirty flags may still appear in older artifacts. Map them to the surface groups instead of preserving both lists.

## Mid-stream reclassification
During `execute-plan`, `verification-before-completion`, review, or doc-sync, pause and reclassify when:

- The change touches more files/modules than expected.
- Public behavior, contracts, schema, API, CLI, integration, data, auth, security, privacy, dependency, migration, infrastructure, concurrency, or architecture changes appear.
- Tests reveal behavior different from the PRD, issue, contract, or plan.
- The agent discovers misunderstood requirements or contradictory artifacts.
- Tool/MCP output conflicts with project artifacts.
- Verification cannot prove the required evidence for the current class.

Reclassification may escalate or narrow the route. Record why the original route changed.

## Confidence and escalation
If classification confidence is below 80%, take the smallest uncertainty-reducing step: ask one or two clarifying questions, run `select-context`, use `diagnose`, use `grill-me`, use `select-tools`, or draft/review a contract spec.

Escalate when:
- Micro -> Tiny: behavior, tests, docs, shared code, generated files, or more than one meaningful file changes.
- Tiny -> Standard: more than one module changes, behavior changes, tests are non-trivial, or docs/code may disagree.
- Standard -> High-risk: public behavior, auth, permissions, user data, dependencies, migrations, infrastructure, concurrency, external integrations, or architecture changes.
- Exploratory -> Standard: spike findings become production implementation.
- Exploratory -> High-risk: spike touches high-risk systems or recommends high-risk production work.
- Any route -> `manage-context-state`: uncertainty, blocked questions, or affected artifacts appear.
- Any route -> `assert-doc-sync`: code/docs/contracts/context disagree or related dirty surfaces are true.
- Any route -> `choose-technical-approach`: stack, architecture, runtime, dependency, service, persistence, deployment, testing, or operations decisions are missing or changing.
- Any route -> `choose-quality-automation`: formatter, linter, typecheck, test, build, contract, accessibility, security, dependency, license, generated artifact, docs, CI, local preflight, or verification command decisions are missing, stale, noisy, or changing.
- Any route -> `choose-retrieval-approach`: RAG, embeddings, vector search, graph/index tooling, repo retrieval, Obsidian-style navigation, hosted retrieval, indexing cadence, source scope, freshness, privacy, or retrieval trust boundaries are missing, stale, risky, unnecessary, or changing.
- Any route -> `choose-agent-strategy`: Standard, High-risk, Exploratory, broad review, or release work may benefit from delegation, model-tier selection, specialist review, independent verification, or runtime-specific agent boundaries.
- Any route -> `choose-implementation-pattern`: work touches repeated project-specific implementation surfaces such as forms, tables, modals, data fetching, API handlers, error handling, tests, layouts, or feature module structure.
- Any route -> `threat-model`: security, privacy, user data, untrusted input, dependency/supply-chain, external integration, public contract, AI/agent, tool-access, or abuse-case risk is present and not already addressed.
- Any route -> `production-readiness-review`: Standard or High-risk work is intended for merge, release, deploy, or production handoff and needs Git reviewability, rollback, observability, or release confidence.
- Any route -> select-tools: current external docs, reasoning scaffold, repo retrieval, or tool boundaries are needed.

## Risk signals
Treat the work as higher risk when it touches:

- Authentication, authorization, sessions, secrets, encryption, or permissions.
- User data, privacy, retention, export, deletion, or compliance.
- Payments, billing, account state, or irreversible operations.
- External network calls, downloads, dependencies, frameworks, runtimes, services, generated code, licenses, CI/build tooling, or untrusted content.
- Database schema, migrations, data backfills, queues, jobs, or concurrency.
- Public APIs, CLIs, SDKs, schemas, events, plugin contracts, or UI workflows.
- Repeated implementation patterns such as forms, tables, modals, API handlers, data fetching, errors, tests, layouts, or feature modules.
- Accessibility-critical UI paths, hot paths, performance-sensitive queries, observability, alerts, or deployment controls.
- Cross-feature architecture, shared utilities, build systems, CI, or deployment.
- AI, LLM, RAG, embeddings, agent tool-calling, MCP access, prompts, memory, retrieval indexes, or model output handling.

## Hard rules
- Do not use the full workflow for small work unless a risk signal is present.
- Do not classify work as Micro or Tiny if it changes behavior across a public or shared boundary.
- Do not classify exploratory work as complete production work.
- Do not update artifacts whose dirty surfaces are false unless review finds they are stale.
- Do not skip a gate without explaining which risk is unlikely or cheap enough to accept.
- Do not continue on the original route after evidence shows the route is wrong.

## Next skills
Usually `select-tools` when tools are needed, then `select-context`, then the first required gate for the chosen fast-pass route.
