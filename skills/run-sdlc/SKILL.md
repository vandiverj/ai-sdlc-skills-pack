---
name: run-sdlc
description: 'Orchestrate the AI SDLC workflow from a human request by classifying work, selecting the minimum route, invoking the right skills, maintaining context/artifact state, and stopping only at meaningful human consent gates.'
user-invocable: true
---

# run-sdlc

## Description
Orchestrate the AI SDLC workflow from a human request by classifying work, selecting the minimum route, invoking the right skills, maintaining context/artifact state, and stopping only at meaningful human consent gates.

## Use when
- The user asks to use the SDLC workflow.
- The user starts a new project, feature, bug fix, refactor, exploratory spike, review, release, or resumed session.
- The user gives a broad idea and wants the agent to guide discovery through implementation.
- The user does not want to manually choose individual skills.
- The workflow route is unclear and should be driven by `classify-work`.

## Purpose
Make the SDLC usable by shifting process work to the AI.

The human provides intent, constraints, judgment, approvals, and acceptance.
The AI handles routing, context selection, artifact drafting, verification discipline, doc/context updates, and next-step orchestration.

## Core rule
Do not run the whole workflow by default. Run the smallest route that prevents the most likely expensive failure.

## Legacy engineering-context environment
When the current workspace is part of the `C:\WebSite` legacy environment, or when an `engineering-context/index.md` file exists near the workspace, treat `engineering-context` as the durable SDLC/context root instead of creating a repo-local `docs/` tree by default.

Preferred root for this machine-specific environment:

```text
C:\WebSite\engineering-context
```

From `C:\WebSite\www_dev`, this is usually `..\engineering-context`.

For legacy work, start routing from:

1. `engineering-context/index.md`
2. relevant `engineering-context/domains/**`
3. relevant `engineering-context/systems/**`
4. relevant `engineering-context/repos/**`
5. relevant `engineering-context/operations/**`

Preserve the legacy `setup-task` discipline inside the SDLC flow:

- identify the domain, or list candidates when uncertain
- always evaluate frontend, API, legacy main site, infrastructure/config, and database impact
- separate confirmed repos from potential repos
- record missing context and initial risks
- separate Known, Believed, and Unknown facts
- stop after context routing when domain or repo impact is unclear
- ask only for answers that cannot be found in code or durable context

Use repo-local `docs/` only as a fallback outside this environment or when a specific repository intentionally owns code-local documentation or a thin runtime adapter.

## What this skill does
1. Interpret the user request.
2. Run or simulate `classify-work`.
3. Choose the SDLC mode and fast-pass route.
4. Identify the next necessary skill.
5. Run one coherent phase at a time.
6. Draft or update artifacts when the route requires them.
7. Stop at consent gates.
8. Continue after approval.
9. Reclassify when new evidence changes the route.
10. Ensure approved quality automation is considered and used when verification or tooling surfaces matter.
11. Choose agent strategy when delegation, specialists, model tiers, or runtime adapters may help.
12. Capture process-learning events when real work exposes friction, gaps, corrections, near misses, or useful workflow successes.
13. Run `slice-product-fit` for Standard implementation slices before implementation planning, and for smaller work when actor, input, contract, data, AI, or cross-slice risk appears.
14. Surface contract, product-fit, and planning attention items in chat when they affect the next decision or implementation path.
15. Keep the user oriented with short progress summaries.

## What this skill does not do
- Do not replace the specialized skills.
- Do not duplicate full instructions from other skills.
- Do not skip consent gates for product, technical, contract, data, security, or high-risk decisions.
- Do not implement before the required design, plan, contract, and approval gates for the work class.
- Do not update every artifact by default.
- Do not treat conversation history as durable truth.

## SDLC modes
Choose one mode:

```text
new-project
setup-sdlc
new-feature
bugfix
refactor
exploratory-spike
resume-work
review-work
release-work
```

## Required output at start

```text
SDLC mode:
Work class:
Classification confidence:
Context depth:
Durable context root:
Technical approach status:
Quality automation status:
Retrieval approach status:
Agent strategy status:
Implementation pattern status:
Slice product-fit status:
Fast-pass route:
Immediate next skill:
Human consent gates expected:
Artifacts likely needed:
Legacy context routing: domain / confirmed repos / potential repos / missing context / initial risks / Known-Believed-Unknown
Dirty surfaces likely:
Verification expectation:
Stop condition for this phase:
```

Keep this compact.

## Routing table

### Setup SDLC
Use when installing or refreshing this SDLC in a downstream repository.

Typical route:
```text
classify-work
-> select-context
-> setup-sdlc-in-repo
-> setup-agent-instructions, if AGENTS.md is missing or stale
-> choose-agent-strategy, if agent roles/model tiers/runtime adapters are needed
-> choose-implementation-pattern, if implementation pattern docs are missing or needed
-> choose-quality-automation, if command rails are missing or changing
-> choose-retrieval-approach, if retrieval/indexing is needed
-> verification-before-completion
-> context-save
```

Stop at ambiguous existing instructions, runtime adapter choices, new tooling/dependency decisions, or any change that would overwrite project-specific guidance.

### New project
Use when the user starts from an idea or empty/new repo.

Typical route:
```text
classify-work
-> context-restore, if repo exists
-> select-context
-> product-reframe
-> define-application
-> choose-technical-approach
-> choose-quality-automation
-> choose-retrieval-approach, if retrieval/RAG/indexing may be justified
-> choose-agent-strategy, if multiple runtimes, specialists, or model tiers may matter
-> choose-implementation-pattern, if project-specific implementation patterns may matter
-> grill-me, if assumptions remain
-> model-application
-> review-application-model
-> to-prd
-> to-issues
-> write-implementation-plan for first slice
```

Stop at product direction, application definition, technical approach, quality automation when needed, retrieval approach when needed, application model, MVP PRD, and first implementation plan approval.

### New feature
Use when adding meaningful behavior to an existing project.

Typical route:
```text
classify-work
-> context-restore
-> select-context
-> product-reframe, if feature value is unclear
-> slice-product-fit, mandatory for Standard feature slices before PRD/issues/plan; for Tiny/Micro when actor/input/contract/data/AI risk appears
-> define/model update, if app structure changes
-> choose-technical-approach, if new technical surface is needed
-> choose-quality-automation, if verification or tooling rails are missing or changing
-> choose-retrieval-approach, if retrieval/RAG/indexing is part of the feature or context selection is failing
-> choose-agent-strategy, if delegation, specialist review, or model-tier selection would reduce risk
-> choose-implementation-pattern, if repeated project-specific implementation patterns apply
-> to-prd or update existing PRD
-> to-issues
-> write-implementation-plan
```

Stop at scope approval, technical approach, quality automation, or retrieval approval if needed, PRD/issue approval, and implementation plan approval.

### Bugfix
Use when fixing broken behavior.

Typical route:
```text
classify-work
-> context-restore
-> select-context
-> diagnose
-> slice-product-fit, if the fix is Standard or actor/input/contract/data/cross-feature assumptions changed
-> choose-quality-automation, if verification or tooling rails are missing or changing
-> choose-retrieval-approach, if diagnosis needs missing/stale retrieval rails
-> choose-agent-strategy, if diagnosis needs read-only exploration, specialist review, or independent verification
-> choose-implementation-pattern, if the bug involves a repeated project pattern
-> write-implementation-plan, if non-trivial
-> safe-edit-boundary
-> execute-plan / tdd
-> verification-before-completion
-> assert-doc-sync, if behavior/docs may disagree
```

Stop when expected behavior is unclear or a non-trivial/risky fix needs plan approval.

### Refactor
Use when changing structure without intended behavior change.

Typical route:
```text
classify-work
-> select-context
-> slice-product-fit, mandatory for Standard refactors where actors, contracts, shared concepts, or user-visible behavior may be affected
-> choose-technical-approach, if patterns/dependencies/architecture change
-> choose-quality-automation, if verification or tooling rails are missing or changing
-> choose-retrieval-approach, if retrieval/index sources or context-selection workflow changes
-> choose-agent-strategy, if the refactor can be split into bounded workers or specialist review
-> choose-implementation-pattern, if the refactor changes or depends on project patterns
-> write-implementation-plan
-> review-implementation-plan
-> safe-edit-boundary
-> execute-plan / tdd
-> verification-before-completion
-> review-code-quality
```

Stop at technical approach, quality automation, or retrieval approval if architecture, dependency, verification, tooling, or retrieval rails change, and at refactor plan approval.

### Exploratory spike
Use when feasibility or direction is uncertain.

Typical route:
```text
classify-work
-> select-tools, if external/current research is needed
-> select-context
-> product-reframe or grill-me
-> slice-product-fit, if the spike is evaluating a product slice, user workflow, AI behavior, API contract, or shared concept
-> choose-technical-approach, if comparing technical options
-> choose-quality-automation, if comparing automation options or spike checks
-> choose-retrieval-approach, if comparing retrieval/RAG/index options
-> choose-agent-strategy, if exploration benefits from read-only specialists or model-tier comparison
-> choose-implementation-pattern, if exploring or comparing implementation patterns
-> safe-edit-boundary
-> execute-plan as spike/prototype
-> verification-before-completion for findings
-> manage-context-state
-> context-save
```

Stop at spike boundary approval and recommendation approval before production work.

### Resume work
Use when continuing a prior session.

Typical route:
```text
context-restore
-> classify-work
-> choose-agent-strategy, if restored work requires delegation or model-tier changes
-> select-context
-> manage-context-state, if uncertainty changed
-> next required gate from restored state
```

Stop when current state is ambiguous or artifacts are stale/contradictory.

### Review work
Use when auditing AI or human work.

Typical route:
```text
classify-work
-> select-context
-> choose-agent-strategy, if independent specialist review or verification is useful
-> review-agent-work
-> assert-doc-sync, if artifacts may disagree
-> verification-before-completion, if evidence is missing
```

Stop when findings require human decision or route mismatch requires reclassification.

### Release work
Use when preparing to finish, merge, ship, or document.

Typical route:
```text
classify-work
-> verification-before-completion
-> review-spec-compliance
-> assert-doc-sync
-> review-code-quality
-> health-check, if needed
-> choose-quality-automation, if release checks expose missing or stale rails
-> choose-retrieval-approach, if release checks expose missing or stale retrieval/index rails
-> choose-agent-strategy, if release review needs specialists or independent verification
-> review-implementation-pattern, if implementation patterns affected the release surface
-> document-release
-> finish-development-branch
-> context-save
```

Stop at failed verification, unresolved high-risk findings, or release approval.

## Consent gates
Ask for human approval before proceeding past:

- Product direction or MVP scope.
- Application definition for meaningful new work.
- Technical approach, stack, architecture, deployment, persistence, or dependency choice.
- Quality automation, CI/local preflight, test framework, lint/type/build tooling, or verification command changes.
- Retrieval, RAG, embeddings, vector search, graph/index tooling, Obsidian-style navigation, hosted retrieval, or repo retrieval changes.
- Agent strategy, runtime adapters, model-tier mappings, specialist definitions, or delegation policy changes.
- Slice product fit, actor map, concept ownership, AI/automation authority, or predecessor-slice decisions for Standard work.
- Implementation pattern guidance, pattern maturity, canonical examples, deprecated examples, or pattern exceptions.
- New framework, runtime, production dependency, external service, auth provider, database, AI provider, or testing tool.
- Application model for meaningful work.
- PRD or acceptance criteria.
- Public/cross-boundary contract.
- High-risk implementation plan.
- Data migration, destructive operation, privacy/security decision, or rollback limitation.
- Final acceptance.

## Chat attention gates
Do not leave decision-bearing questions only in artifacts. When contract, product-fit, issue, implementation-plan, review, or execution preflight work finds questions, assumptions, or risks that affect the next implementation step, present them in chat before continuing.

Classify surfaced items as:

- `Needs decision before work`: blocking items, questions below 70% confidence, or choices that affect scope, public contract, data ownership, AI/automation authority, security/privacy, dependencies, persistence, rollback, or user-visible behavior.
- `Recommended default unless corrected`: meaningful assumptions at 70%+ confidence that are safe to proceed with, but should be visible to the human.
- `Recorded for later`: non-blocking context that does not affect the next step.

Every question must include a recommendation. Do not ask naked questions.

Use this shape:

```text
Question:
Recommendation:
Why this fits current evidence:
Tradeoff or risk:
Default action if approved or not corrected:
```

Block before implementation when any `Needs decision before work` item remains unresolved. For Tiny/Micro work, keep this lightweight and surface only items that affect behavior, safety, contracts, or user-visible outcomes.

## Human interaction style
Ask the fewest useful questions.

For broad ideas, ask 5-7 high-leverage questions max before drafting a first artifact. Prefer grouped questions with defaults.

Good first questions for a new app:
```text
1. Who is the primary user?
2. What is the first version supposed to help them do?
3. What must be true for this to feel successful?
4. What platforms or environments matter?
5. What data does it store or touch?
6. Does it need offline, sync, print, auth, sharing, or reminders?
7. Are there technical preferences or constraints?
```

## Progress updates
After each phase, summarize:

```text
Completed:
Decisions made:
Open questions:
Attention items surfaced:
Artifacts updated or proposed:
Next skill:
Human decision needed:
```

## Reclassification
Pause and return to `classify-work` when:

- The task is broader/narrower than expected.
- A new technical surface appears.
- A missing or inadequate quality automation surface appears.
- A missing, stale, risky, or unnecessary retrieval surface appears.
- A missing, stale, excessive, or unsafe agent strategy appears.
- A missing, stale, disputed, deprecated, or newly needed implementation pattern appears.
- A slice actor, user job, input method, validation boundary, concept owner, AI/automation authority, or cross-slice dependency is unclear.
- A requirement contradicts the model, PRD, issue, contract, or plan.
- A public contract changes.
- Security, privacy, data, migration, dependency, deployment, or operations risk appears.
- Verification cannot prove the completion claim.
- Artifact sync reveals disagreement.

## Artifact behavior
Use dirty surfaces to decide what to update.

Do not update every artifact every time. Draft artifacts when required, then ask for approval when they become decision-bearing.

## Hard rules
- Do not make the human manually pick skills.
- Do not continue through a consent gate silently.
- Do not implement meaningful work before the required route gates pass.
- Do not skip `slice-product-fit` for Standard implementation work before implementation planning.
- Do not choose or change stack/dependencies/services silently.
- Do not use heavy gates for Micro/Tiny work unless risk appears.
- Do not treat this skill as a mega-skill.
- Do not claim completion without fresh verification evidence.

## Next skills
Usually one of: `classify-work`, `context-restore`, `setup-sdlc-in-repo`, `select-context`, `product-reframe`, `slice-product-fit`, `define-application`, `choose-technical-approach`, `choose-quality-automation`, `choose-retrieval-approach`, `choose-agent-strategy`, `choose-implementation-pattern`, `grill-me`, `model-application`, `to-prd`, `to-issues`, `write-implementation-plan`, `execute-plan`, `verification-before-completion`, `review-agent-work`, `capture-process-event`, `finish-development-branch`, or `context-save`.
