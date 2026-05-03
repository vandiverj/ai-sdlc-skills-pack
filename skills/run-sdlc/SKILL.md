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
10. Keep the user oriented with short progress summaries.

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
Technical approach status:
Fast-pass route:
Immediate next skill:
Human consent gates expected:
Artifacts likely needed:
Dirty surfaces likely:
Verification expectation:
Stop condition for this phase:
```

Keep this compact.

## Routing table

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
-> grill-me, if assumptions remain
-> model-application
-> review-application-model
-> to-prd
-> to-issues
-> write-implementation-plan for first slice
```

Stop at product direction, application definition, technical approach, application model, MVP PRD, and first implementation plan approval.

### New feature
Use when adding meaningful behavior to an existing project.

Typical route:
```text
classify-work
-> context-restore
-> select-context
-> product-reframe, if feature value is unclear
-> define/model update, if app structure changes
-> choose-technical-approach, if new technical surface is needed
-> to-prd or update existing PRD
-> to-issues
-> write-implementation-plan
```

Stop at scope approval, technical approach approval if needed, PRD/issue approval, and implementation plan approval.

### Bugfix
Use when fixing broken behavior.

Typical route:
```text
classify-work
-> context-restore
-> select-context
-> diagnose
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
-> choose-technical-approach, if patterns/dependencies/architecture change
-> write-implementation-plan
-> review-implementation-plan
-> safe-edit-boundary
-> execute-plan / tdd
-> verification-before-completion
-> review-code-quality
```

Stop at technical approach approval if architecture/dependency changes, and at refactor plan approval.

### Exploratory spike
Use when feasibility or direction is uncertain.

Typical route:
```text
classify-work
-> select-tools, if external/current research is needed
-> select-context
-> product-reframe or grill-me
-> choose-technical-approach, if comparing technical options
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
- New framework, runtime, production dependency, external service, auth provider, database, AI provider, or testing tool.
- Application model for meaningful work.
- PRD or acceptance criteria.
- Public/cross-boundary contract.
- High-risk implementation plan.
- Data migration, destructive operation, privacy/security decision, or rollback limitation.
- Final acceptance.

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
Artifacts updated or proposed:
Next skill:
Human decision needed:
```

## Reclassification
Pause and return to `classify-work` when:

- The task is broader/narrower than expected.
- A new technical surface appears.
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
- Do not choose or change stack/dependencies/services silently.
- Do not use heavy gates for Micro/Tiny work unless risk appears.
- Do not treat this skill as a mega-skill.
- Do not claim completion without fresh verification evidence.

## Next skills
Usually one of: `classify-work`, `context-restore`, `select-context`, `product-reframe`, `define-application`, `choose-technical-approach`, `grill-me`, `model-application`, `to-prd`, `to-issues`, `write-implementation-plan`, `execute-plan`, `verification-before-completion`, `review-agent-work`, `finish-development-branch`, or `context-save`.