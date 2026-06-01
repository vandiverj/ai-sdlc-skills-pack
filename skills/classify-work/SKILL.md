---
name: classify-work
description: 'Classify requested work by risk, confidence, context depth, dirty surfaces, required gates, and fast-pass route so the agent runs the minimum workflow needed to prevent expensive failure.'
user-invocable: true
---

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
Evidence packet level:
Contextual caps:
Repository boundaries, if multiple repos are involved:
Context/documentation updates:
Escalation triggers:
Reclassification triggers:
Next skill:
```

Prefer short, decisive answers. The execution contract should be small enough for the agent to follow without re-deciding the whole process.

## Fast-pass principle
The workflow is a dependency graph, not a mandatory ladder. A skipped gate is acceptable only when the classification explains why the failure it prevents is unlikely or cheap.

## Security trigger overlay
Before finalizing the route, check `references/security-route-triggers.md`.

Security/tool triggers add required gates and evidence to the selected base route. They may escalate the work to High-risk when secrets, production, users, data, dependencies, tool permissions, prompt/tool injection, external integrations, or irreversible state can be affected.

## Work classes and fast-pass routes

### Micro
Use for no-behavior, no-risk edits that are obvious and local.

Examples: typo fix, formatting-only change, comment wording, dead link update, mechanical rename within one private scope, lint-only cleanup.

Fast-pass route:
```text
classify-work
-> context, minimal selection
-> implementation safe-edit boundary, implicit or one-line
-> direct edit
-> quality verification, smallest relevant check or documented inspection
```

Evidence packet level: one-line summary.

Escalate out of Micro if behavior, tests, public docs, generated artifacts, shared code, or more than one meaningful file changes.

### Tiny
Use for changes that are obvious, local, low-risk, and easy to verify.

Examples: small copy edit, simple config comment, narrow test expectation update, one-line bug fix with clear behavior.

Fast-pass route:
```text
classify-work
-> tools, only if needed
-> context selection
-> implementation safe-edit boundary, lightweight
-> direct edit or implementation execution
-> quality verification
-> context doc-sync check, only if docs/code may disagree
-> context docs update, only if dirty surfaces require it
-> context save, only if pending work/context changed
```

Usually skip application modeling, PRD, issues, contract spec, implementation plan, outside voice, broad reviews, and branch finishing.

Evidence packet level: compact summary.

### Standard
Use for bounded feature work, moderate bug fixes, or multi-file changes with clear requirements.

Fast-pass route:
```text
classify-work
-> tools, only if needed
-> context selection
-> implementation pattern selection, if repeated project-specific patterns may apply
-> existing PRD/task source or planning PRD conversion if requirements need durable form
-> planning issues, if not already tracked
-> planning implementation plan
-> review implementation-plan reference
-> implementation safe-edit boundary
-> implementation execution / TDD
-> quality verification
-> review spec-compliance reference
-> context doc-sync check, if dirty surfaces require it
-> review code-quality reference
-> context docs update, dirty surfaces only
-> context state management, if uncertainty changed
-> context save
```

For Standard work, spec compliance, artifact sync, and code quality can be performed as one concise review pass when risk is low and the dirty surfaces are narrow.

Evidence packet level: compact evidence packet.

Prefer an independent reviewer role when the change has meaningful behavior, UI, test, data, contract, or multi-file risk. If runtime support is unavailable, use a review-focused pass over the diff and evidence packet.

Bundled execution is allowed for low-risk Standard work when requirements are clear and the expected diff is reviewable in one pass. A bundled prompt may cover plan confirmation, implementation, verification, and handoff, but it must not skip the gates selected by this classification. The execution contract must still name required acceptance criteria, verification commands/tools, rendered review expectations, caps for unavailable evidence, and the handoff packet shape before implementation begins.

Do not use bundled execution when the work is High-risk, cross-repository, requirement-ambiguous, security/data-sensitive, migration/deployment-related, or when a previous run exposed a process failure that needs isolated retesting.

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
- structured reasoning or tools selection for Sequential Thinking-style support when useful
- `review/references/threat-model.md` when security, privacy, data, dependency, integration, untrusted input, AI/agent, tool-access, or abuse-case risk is present
- implementation plan and review
- security/privacy/supply-chain/license risk review
- data retention/deletion review when user data is involved
- migration rehearsal or rollback/mitigation plan where relevant
- contract/type/schema stress testing where relevant
- performance, accessibility, observability, and rollout checks where relevant
- fresh verification evidence
- `review/references/production-readiness.md` before merge/release/deploy/handoff for production-intended changes
- context doc-sync check
- context and release documentation updates only where dirty surfaces require them

Evidence packet level: full evidence packet with waiver/status notes.

### Exploratory
Use for spikes, prototypes, research, or uncertain feasibility work.

Fast-pass route:
```text
classify-work
-> tools, likely useful
-> context selection
-> planning product framing or grill-me, if ambiguity is product/requirements
-> planning application model, only if exploring architecture
-> implementation safe-edit boundary
-> implementation execution as spike/prototype
-> quality verification, evidence of findings
-> quality health check, if prototype affects repo health
-> context state management, capture questions/decisions
-> context save
```

Exploratory work produces findings, options, risks, and a recommended next classification. It does not produce production completion claims.

Evidence packet level: findings packet, not completion packet.

### Review-only
Use when inspecting a diff, artifact, prior agent session, or branch without approval to make code changes.

Fast-pass route:
```text
classify-work
-> context selection
-> agents strategy, if independent review or specialist review is useful
-> review agent-work, spec-compliance, or code-quality references as applicable
-> quality verification, only if evidence is missing and commands can be run safely
```

Evidence packet level: findings packet.

Do not edit code unless the user separately approves a fix route.

### Release or handoff
Use when preparing merge, deploy, QA, ticket update, or local review packet.

Fast-pass route:
```text
classify-work
-> quality verification
-> review agent-work / production-readiness or release finish-development-branch references as applicable
-> context save / docs update, dirty surfaces only
```

Evidence packet level: release/handoff packet.

For repositories without PRs, require a local review packet: task, changed files, diff summary, validation evidence, rendered review if relevant, risks, skipped checks, acceptance status, and next action.

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
- `technicalApproachChanged` -> use implementation technical-approach guidance; update ADRs, application model, AGENTS.md, context-state, and Memory Bank indexes as applicable.
- `qualityAutomationChanged` -> use quality automation guidance; update command wiring, CI/local preflight docs, AGENTS.md, verification expectations, context-state, and Memory Bank indexes as applicable.
- `retrievalApproachChanged` -> use tools retrieval-approach guidance; update retrieval decisions, tool boundaries, index/report locations, freshness expectations, AGENTS.md, context-state, and Memory Bank indexes as applicable.
- systemSurfaceChanged -> update/review application model, ADRs, diagrams, dependency boundaries, data flows, or feature context.
- `verificationSurfaceChanged` -> update tests, verification plan, health-check expectations, or evidence requirements.
- `docsContextSurfaceChanged` -> update code-local docs, feature context, Memory Bank routing, context index, release docs, or developer docs.
- `riskSurfaceChanged` -> use `review/references/threat-model.md`, security/privacy/dependency/license/migration/rollback/performance/accessibility/observability/rollout review, or `review/references/production-readiness.md` as applicable.
- `implementationPatternChanged` -> use implementation pattern selection, `review/references/implementation-pattern.md`, or process-learning pattern updates; update `docs/patterns/*`, feature context, AGENTS.md, context-state, or Memory Bank indexes as applicable.
- `agentOpsSurfaceChanged` -> update `AGENTS.md`, setup commands, verification commands, safe-edit rules, or workflow guidance.
- `agentStrategyChanged` -> use agents strategy selection/update guidance or `review/references/agent-strategy.md`; update `docs/agents/*`, runtime adapters, or AGENTS.md as applicable.
- `processLearningSurfaceChanged` -> use process-learning event capture or include the evidence in a process-learning review report.
- `uncertaintyChanged` -> update `docs/context-state.md`.

Legacy dirty flags may still appear in older artifacts. Map them to the surface groups instead of preserving both lists.

## Mid-stream reclassification
During implementation execution, quality verification, review, or doc-sync, pause and reclassify when:

- The change touches more files/modules than expected.
- Public behavior, contracts, schema, API, CLI, integration, data, auth, security, privacy, dependency, migration, infrastructure, concurrency, or architecture changes appear.
- Tests reveal behavior different from the PRD, issue, contract, or plan.
- The agent discovers misunderstood requirements or contradictory artifacts.
- Tool/MCP output conflicts with project artifacts.
- Verification cannot prove the required evidence for the current class.

Reclassification may escalate or narrow the route. Record why the original route changed.

## Confidence and escalation
If classification confidence is below 80%, take the smallest uncertainty-reducing step: ask one or two clarifying questions, use context selection, implementation diagnosis, `grill-me`, tools selection, or draft/review a contract spec.

Escalate when:
- Micro -> Tiny: behavior, tests, docs, shared code, generated files, or more than one meaningful file changes.
- Tiny -> Standard: more than one module changes, behavior changes, tests are non-trivial, or docs/code may disagree.
- Standard -> High-risk: public behavior, auth, permissions, user data, dependencies, migrations, infrastructure, concurrency, external integrations, or architecture changes.
- Exploratory -> Standard: spike findings become production implementation.
- Exploratory -> High-risk: spike touches high-risk systems or recommends high-risk production work.
- Any route -> context state management: uncertainty, blocked questions, or affected artifacts appear.
- Any route -> context doc-sync check: code/docs/contracts/context disagree or related dirty surfaces are true.
- Any route -> implementation technical-approach guidance: stack, architecture, runtime, dependency, service, persistence, deployment, testing, or operations decisions are missing or changing.
- Any route -> quality automation guidance: formatter, linter, typecheck, test, build, contract, accessibility, security, dependency, license, generated artifact, docs, CI, local preflight, or verification command decisions are missing, stale, noisy, or changing.
- Any route -> tools retrieval-approach guidance: RAG, embeddings, vector search, graph/index tooling, repo retrieval, Obsidian-style navigation, hosted retrieval, indexing cadence, source scope, freshness, privacy, or retrieval trust boundaries are missing, stale, risky, unnecessary, or changing.
- Any route -> agents strategy guidance: Standard, High-risk, Exploratory, broad review, or release work may benefit from delegation, model-tier selection, specialist review, independent verification, or runtime-specific agent boundaries.
- Any route -> implementation pattern guidance: work touches repeated project-specific implementation surfaces such as forms, tables, modals, data fetching, API handlers, error handling, tests, layouts, or feature module structure.
- Any route -> `review/references/threat-model.md`: security, privacy, user data, untrusted input, dependency/supply-chain, external integration, public contract, AI/agent, tool-access, or abuse-case risk is present and not already addressed.
- Any route -> `review/references/production-readiness.md`: Standard or High-risk work is intended for merge, release, deploy, or production handoff and needs Git reviewability, rollback, observability, or release confidence.
- Any route -> tools selection: current external docs, reasoning scaffold, repo retrieval, or tool boundaries are needed.

## Contextual caps
Contextual caps limit completion confidence when required evidence is missing. Prefer these canonical caps over many custom numeric sub-scores:

- `missing-context`: affected files, schemas, docs, tests, or runtime constraints were not inspected.
- `missing-validation`: no relevant check was run and no waiver/handoff exists.
- `weak-validation`: checks ran but do not cover the changed behavior.
- `hidden-blast-radius`: shared behavior, cross-repo impact, production path, or downstream consumer impact is not mapped.
- `rendered-experience-unverified`: UI/user-facing workflow changed but rendered surface was not inspected when tooling was available.
- `security-data-uncertainty`: sensitive data, dependency, MCP/tool, auth, privacy, or production boundary is unresolved.
- `review-conflict`: implementer, reviewer, tests, or requirements disagree.
- `environment-mismatch`: validation ran in a meaningfully different OS/runtime/environment than the product requires.
- `test-evidence-tampering-risk`: tests, snapshots, thresholds, validation scripts, generated baselines, or CI changed without an approved test/tooling scope.

If a cap applies, record it in the execution contract and route to the smallest useful action: gather context, run verification, ask for approval, produce a handoff, or reclassify.

## Multi-repository boundaries
When a task spans more than one repository, include a compact boundary table before implementation, verification, push, or handoff:

```text
Repository:
Role: fixture / product / reusable-skill-pack / docs / other
Branch expected:
Edit permission: editable / read-only
Push permission: allowed / not allowed / needs approval
Local-only paths:
```

Use this especially for SDLC pilots where a fixture repository tests reusable skill changes. Keep fixture behavior, reusable skill edits, and local handoff notes separate unless the user explicitly asks to bridge them.

For pilot workflows, keep roles explicit:

- fixture/test agents work only inside the fixture repository and report whether the SDLC guidance worked in practice,
- the orchestrator reviews and edits the reusable skill pack,
- do not ask a fixture/test agent to inspect, judge release readiness for, push, merge, or edit the reusable skill-pack repository unless the human explicitly changes that role boundary.

Use the pilot workflow template and fixture prompt template, when present, to keep the task intent, assigned phase, boundary table, evidence packet, and process findings consistent across runs.

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
- Do not silently downgrade the approved work class in later phases. If implementation or review evidence shows the scope is smaller or larger than planned, explicitly reclassify, explain why, and preserve any already-approved evidence expectations unless they are no longer relevant.
- Do not update artifacts whose dirty surfaces are false unless review finds they are stale.
- Do not skip a gate without explaining which risk is unlikely or cheap enough to accept.
- Do not continue on the original route after evidence shows the route is wrong.

## Next skills
Usually `tools` when tool boundaries are needed, then `context` selection, then the first required gate for the chosen fast-pass route.
