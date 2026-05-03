# classify-work

## Description
Classify the requested work by risk, context depth, dirty flags, and fast-pass route so the agent runs the minimum workflow gates needed to prevent expensive failure.

## Use when
- Starting a new task.
- The user asks for a change and the appropriate workflow depth is unclear.
- `select-context` needs to know which artifacts and gates matter.
- A task may be tiny, exploratory, standard, high-risk, shallow, deep, or cross-cutting.

## Purpose
Prevent two failure modes:

- Too little process for risky work, causing drift, security issues, broken contracts, stale docs, or unverified behavior.
- Too much process for tiny work, causing documentation churn, context exhaustion, and slow delivery.

## Required output

```text
Work class:
Risk level:
Context depth:
Fast-pass route:
Why:
Dirty flags:
Required gates:
Optional gates:
Skipped gates and reason:
Required context:
Required tools/MCPs:
Required verification:
Context/documentation updates:
Escalation triggers:
Next skill:
```

## Fast-pass principle
The workflow is a dependency graph, not a mandatory ladder. A skipped gate is acceptable only when the classification explains why the failure it prevents is unlikely or cheap.

## Work classes and fast-pass routes

### Tiny
Use for changes that are obvious, local, low-risk, and easy to verify.

Examples: typo fix, small copy edit, simple config comment, narrow test expectation update, one-line bug fix with clear behavior.

Fast-pass route:
```text
classify-work
-> select-tools, only if needed
-> select-context
-> safe-edit-boundary, lightweight
-> direct edit or execute-plan
-> verification-before-completion
-> assert-doc-sync, only if docs/code may disagree
-> update-context-docs, only if dirty flags require it
-> context-save, only if pending work/context changed
```

Usually skip:
- application modeling
- PRD
- issues
- contract spec
- implementation plan
- outside voice
- broad reviews
- branch finishing

### Standard
Use for bounded feature work, moderate bug fixes, or multi-file changes with clear requirements.

Fast-pass route:
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
-> assert-doc-sync, if dirty flags require it
-> review-code-quality
-> update-context-docs, dirty flags only
-> manage-context-state, if uncertainty changed
-> context-save
```

Usually skip unless dirty flags or risk require:
- product-reframe
- full application modeling
- contract specs
- outside voice
- engineering-principles-review
- release docs

### High-risk
Use when the change affects public contracts, data, security, auth, payments, privacy, permissions, migrations, infrastructure, external integrations, concurrency, irreversible operations, or broad architecture.

Fast-pass route:
```text
Run all relevant gates, none skipped silently.
```

High-risk does not always mean every step. A backend migration may not need UI design review. A security fix may not need product reframing. But every skipped gate must be justified, and all relevant model/PRD/contract/plan/security/verification/doc-sync/context gates must be considered.

Usually required:
- model/PRD/context-state alignment
- contract spec when public/cross-boundary behavior changes
- structured reasoning or `select-tools` for Sequential Thinking-style support when useful
- implementation plan and review
- security/privacy/supply-chain risk review inside plan and code review
- rollback or mitigation plan
- contract/type/schema stress testing where relevant
- fresh verification evidence
- `assert-doc-sync`
- context and release documentation updates only where dirty flags require them

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

Usually skip:
- production implementation claims
- release documentation
- full PRD unless the spike becomes product work
- branch finishing unless there is production-ready work

## Context depth

### Shallow
Needs only the current file, nearby tests, and immediate feature context.

### Feature
Needs the feature `context.md`, related source/tests, related PRD/contract excerpts, and nearby decisions.

### Deep
Needs application model sections, PRD, contract, decision index/ADRs, and context-state.

### Cross-Cutting
Needs Memory Bank routing, multiple feature contexts, model sections, decisions, contracts, and broader dependency/retrieval support.

## Dirty flags

Dirty flags decide which artifacts are eligible to update. Do not update every artifact by default.

```text
architectureChanged: yes/no
productIntentChanged: yes/no
requirementsChanged: yes/no
contractChanged: yes/no
publicBehaviorChanged: yes/no
featureBehaviorChanged: yes/no
codeLocalDocsChanged: yes/no
testsChanged: yes/no
securityPrivacyRiskChanged: yes/no
dependencyChanged: yes/no
migrationChanged: yes/no
contextRoutingChanged: yes/no
uncertaintyChanged: yes/no
agentInstructionsChanged: yes/no
releaseDocsChanged: yes/no
```

Dirty flag routing:
- `architectureChanged` -> update/review `docs/application-model.md`.
- `productIntentChanged` or `requirementsChanged` -> update/review PRD.
- `contractChanged` or `publicBehaviorChanged` -> write/review contract spec.
- `featureBehaviorChanged` -> update feature `context.md` and code-local docs.
- `codeLocalDocsChanged` -> review code-local docs.
- `securityPrivacyRiskChanged`, `dependencyChanged`, or `migrationChanged` -> high-risk review and rollback/mitigation planning.
- `contextRoutingChanged` -> update Memory Bank routing files.
- `uncertaintyChanged` -> update `docs/context-state.md`.
- `agentInstructionsChanged` -> update `AGENTS.md`.
- `releaseDocsChanged` -> update public/developer docs.

## Escalation triggers
Escalate the work class or route when:

- Tiny -> Standard: more than one module changes, behavior changes, tests are non-trivial, or docs/code may disagree.
- Standard -> High-risk: public behavior, auth, permissions, user data, dependencies, migrations, infrastructure, concurrency, external integrations, or architecture changes.
- Exploratory -> Standard: spike findings become production implementation.
- Exploratory -> High-risk: spike touches high-risk systems or recommends high-risk production work.
- Any route -> `manage-context-state`: uncertainty, blocked questions, or affected artifacts appear.
- Any route -> `assert-doc-sync`: code/docs/contracts/context disagree or related dirty flags are true.
- Any route -> `select-tools`: current external docs, reasoning scaffold, repo retrieval, or tool boundaries are needed.

## Risk signals
Treat the work as higher risk when it touches:

- Authentication, authorization, sessions, secrets, encryption, or permissions.
- User data, privacy, retention, export, deletion, or compliance.
- Payments, billing, account state, or irreversible operations.
- External network calls, downloads, dependencies, generated code, licenses, or untrusted content.
- Database schema, migrations, data backfills, queues, jobs, or concurrency.
- Public APIs, CLIs, SDKs, schemas, events, plugin contracts, or UI workflows.
- Cross-feature architecture, shared utilities, build systems, CI, or deployment.

## Hard rules
- Do not use the full workflow for tiny work unless a risk signal is present.
- Do not classify work as tiny if it changes behavior across a public or shared boundary.
- Do not classify exploratory work as complete production work.
- Do not update artifacts whose dirty flags are false unless review finds they are stale.
- Do not skip a gate without explaining which risk is unlikely or cheap enough to accept.
- If classification is uncertain, choose the smallest next step that reduces uncertainty, usually `select-context`, `diagnose`, `grill-me`, `select-tools`, or `write-contract-spec`.

## Next skills
Usually `select-tools` when tools are needed, then `select-context`, then the first required gate for the chosen fast-pass route.