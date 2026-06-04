---
name: sdlc-process-improvement
description: 'Improve the AI SDLC itself through evidence-backed research, implementation planning, repeated review/research/revision loops, implementation, Battle Soccer fixture validation, and approved commit/push handoff.'
user-invocable: true
---

# sdlc-process-improvement

## Purpose
Improve the SDLC process, skills, helper CLI, runtime guidance, and validation fixtures without turning one rough idea into durable process law too quickly.

Use this skill as a laboratory loop for SDLC usability, capability, efficiency, reliability, best practices, and learnings from real agent work.

## Improvement Boundary
This skill is broad enough to invent new SDLC capabilities, but every idea must improve the agent coding software development process. Keep proposals anchored to coding quality, platform coverage, repo-specific configuration, local evidence, and developer control.

A valid improvement should make at least one of these better:
- code correctness, maintainability, testability, security, accessibility, or release readiness,
- agent execution quality during diagnosis, planning, implementation, review, verification, QA, or handoff,
- deterministic local support for tools, commands, evidence, context, and run state,
- repo-specific adaptation without hardcoding product facts into shared process guidance,
- developer usability by reducing ceremony, prompt/context load, repeated reasoning, or noisy command surfaces.

Reject or mark experimental any improvement that mainly adds process ceremony, broadens scope without evidence, hides human control, weakens verification, or overfits to one project/task.

## Reference Selection
Load references only when the task shape needs them:

| Trigger or surface | Load reference |
| --- | --- |
| Battle Soccer fixture validation, fixture dry runs, or validation packet shape | `references/battle-soccer-validation.md` |
| Cross-domain inspiration, machine-native process representations, prompt compression, or experiment-before-process design | `references/experimental-research.md` |

## SDLC Support Requirements
All durable SDLC improvements must preserve support for:
- personal projects, modern Node/TypeScript apps, Deno/JS apps, API-only services, legacy ASP Classic/.NET/SQL systems, multi-project repositories, and multi-repo workspaces,
- UI, API, data, integration, worker/job, CLI, documentation, and manual QA test surfaces,
- proportional routes from Micro/Tiny through Standard, High-risk, Exploratory, Review-only, and Release/handoff work,
- local-first discovery of repo tools, scripts, profiles, deployable units, context buckets, evidence paths, and dirty worktree state,
- human approval gates for commit, push, merge, deploy, release, destructive commands, migrations, new dependencies, secrets, and external services,
- sanitized learning capture where reusable process lessons are separated from product/client/repo-sensitive facts,
- runtime portability across Codex, Augment, Auggie, and other coding agents with different tools, sandboxes, and approval models.

## Coding Quality Bar
Improvements should help agents produce better software, not just better process artifacts.

Prefer changes that make it easier to:
- diagnose before editing when cause is unclear,
- set safe edit boundaries and protect unrelated user changes,
- follow existing project patterns instead of inventing new architecture,
- use TDD or regression coverage when behavior is testable and risk warrants it,
- choose surface-correct verification rather than defaulting every task to browser evidence,
- capture command results, evidence gaps, and confidence without overstating proof,
- prepare human QA scripts that testers can execute without AI, code inspection, or SDLC knowledge,
- make final handoffs reviewable, scoped, and backed by fresh evidence.

Do not optimize the SDLC for speed by removing the checks that protect code quality. Reduce overhead by moving repeated mechanics into local helpers, clearer routing, better defaults, or repo configuration.

## Platform And Tool Support
Treat the SDLC as a configurable local platform for coding agents.

Durable improvements should consider:
- package managers and build systems such as npm, pnpm, yarn, bun, deno, dotnet, cargo, pip, uv, Make, Docker, and Podman when relevant,
- test/build/lint/typecheck scripts already declared by the repo before inventing new commands,
- optional tools such as Playwright, Cypress, OpenAPI validators, spell/prose tools, local LLMs, browser tools, ticket systems, database access, and MCPs as capability-aware overlays, not required dependencies,
- JSON or structured outputs for helper commands when later commands, agents, or tests need stable contracts,
- graceful fallback when a tool, fixture, browser, service, or runtime adapter is unavailable,
- no mandatory third-party installation unless the user explicitly approves the setup as part of the task.

The SDLC may detect, recommend, or use tools that are already installed or configured. Third-party software is an optional accelerator, not a process mandate. Improvements may describe how a tool can make work better when it is available, but the default workflow must still have a no-install path, a documented fallback, or an explicit human approval gate before setup changes. The SDLC must not silently install tools, change repo setup, add dependencies, require optional services, or require a specific agent runtime unless the user approved that direction.

## Repo Configurability
Every improvement should ask how it behaves in a specific repository.

Support repo-local configuration through existing or proposed mechanisms such as:
- `.ai-local/sdlc-profile.md` for repo/unit profiles, commands, surfaces, deploy methods, and context buckets,
- repo-local dictionaries, aliases, and prompt-hygiene hints for product terms that should not become shared process rules,
- ignored `.ai-local` run journals, caches, scratch scripts, tool inventories, and evidence ledgers,
- unit-aware mappings for monorepos, multi-project repos, and multi-repo workspaces,
- explicit override paths when the local recommendation is wrong, unavailable, or too heavy for the task.

Shared `.agents` guidance should define portable behavior. Repo-specific facts, credentials, private URLs, customer data, proprietary schemas, and environment details belong in repo-local or approved external context, not in reusable SDLC skills.

## Novel Solution Exploration
For Standard or larger SDLC process improvements, generate and compare multiple solution candidates before choosing the implementation plan. Do this after evidence gathering and before the 10-loop critique.

Include at least three candidate approaches unless the user explicitly requests a narrow edit:
- an incremental improvement to existing SDLC guidance or helper behavior,
- a deterministic helper CLI or local control-plane capability,
- a repo-configuration or deployable-unit adaptation,
- a new validation, evidence, QA, or Battle Soccer fixture pattern,
- an agent handoff, runtime-adapter, prompt, context, or review workflow pattern.

Compare candidates using:
```text
Candidate:
New capability or behavior:
Coding-quality impact:
Platform/tool support impact:
Repo configurability impact:
No-install fallback:
Evidence and validation path:
External inspiration used:
Machine-native representation considered:
Experiment-before-process path:
Cost/risk:
Why choose or reject:
```

Prefer the candidate, or small combination of candidates, that improves coding-agent outcomes with the least durable process weight. Keep rejected candidates in the plan when they reveal useful future work, but do not implement them without evidence and scope approval.

## Improvement Hypothesis
Every Standard or larger improvement must start as a falsifiable behavior bet, not just a feature idea.

```text
Hypothesis:
Failure mode it addresses:
Expected agent behavior change:
Expected developer experience change:
Expected code-quality change:
How we will know it worked:
How it could make things worse:
```

If the hypothesis cannot name a coding-agent behavior, developer workflow, evidence-quality, or repo-configurability improvement, do not promote it to durable SDLC guidance.

## Agent Failure Mode Taxonomy
Classify the primary failure mode before designing the fix. Use one or more:

- wrong context: the agent loaded, trusted, or ignored the wrong facts,
- wrong scope: the agent touched too much, too little, or the wrong repo/unit,
- wrong abstraction: the agent invented architecture instead of following project patterns,
- weak verification: the agent used proof that did not match the changed surface,
- stale evidence: the agent relied on old results, assumptions, or unchecked state,
- over-process: the agent added ceremony, commands, or artifacts that did not reduce risk,
- under-process: the agent skipped planning, review, safety, or evidence needed for the risk,
- unsafe repo change: the agent risked unrelated user changes, generated files, setup, secrets, migrations, or destructive operations,
- missing repo configuration: the SDLC lacked commands, units, surfaces, context buckets, or local dictionaries needed to adapt,
- poor handoff: the agent left reviewers, QA, or future agents without usable evidence or next actions,
- hidden assumption: the agent silently rewrote intent, invented constraints, or skipped an ambiguity,
- tool/runtime mismatch: the agent assumed unavailable MCPs, browser tools, CLIs, services, permissions, or runtimes.

## Repo Capability Contract
Prefer improvements that help each repo describe itself to the SDLC. A mature repo contract should be able to answer:

```text
Repo kind:
Deployable units:
Primary languages/frameworks:
Trusted commands:
Test surfaces:
Best proof / fallback proof:
Risky paths:
Generated or ignored paths:
Human QA expectations:
Optional tools available:
Tools/services unavailable:
Local-only facts and sensitivity boundaries:
Override instructions:
```

Implement this through repo-local configuration when possible, especially `.ai-local/sdlc-profile.md`, unit mappings, tool inventory caches, local dictionaries, and context buckets. Shared `.agents` guidance should define the contract shape and defaults, not product-specific facts.

## Quality Oracle Ladder
For each candidate and implementation plan, name the best available proof before running checks.

```text
Best proof:
Good proof:
Fallback proof:
Unavailable proof:
Human-only proof:
Do not claim:
```

Use the ladder to prevent mismatched evidence, such as using rendered UI proof for API-only/data/job work, or claiming release readiness from tests that do not touch the changed behavior.

## Process Weight Budget
Every durable improvement must account for its process cost.

```text
New commands:
New concepts:
New files/artifacts:
New decisions required:
New context loaded:
New human approvals:
Removed complexity:
Net process weight: lighter / neutral / heavier
Why the weight is worth it:
```

Prefer improvements that move repeated mechanics into local helpers, structured outputs, better repo profiles, or clearer defaults. A heavier process is acceptable only when it protects high-risk work, improves code quality, or creates reusable capability that lighter options cannot provide.

## Local-First Compiler Model
Treat the SDLC CLI and skill pack as a local compiler/control plane around agent coding work:

```text
Human intent + repo facts + task risk + available tools
-> route
-> context packet
-> evidence plan
-> agent instructions
-> QA/handoff packet
-> completion gate
```

Use this model when evaluating novel improvements. Good changes should make the compiled outputs smaller, clearer, safer, more repo-aware, or more evidence-backed. Do not make the model depend on optional third-party tools; optional tools may enrich a compiled output only when available or explicitly approved.

## Comparative Evaluation
For meaningful changes, compare before and after behavior.

```text
Before:
Agent confusion:
Commands needed:
Context needed:
Evidence quality:
Code-quality risk:
Developer effort:

After:
Agent confusion reduced:
Commands reduced or clarified:
Context reduced:
Evidence improved:
Code-quality risk reduced:
Developer effort reduced:
Remaining tradeoff:
```

Use Battle Soccer for realistic fixture evidence when relevant. Also consider synthetic fixture shapes when the change targets API-only services, no-test legacy repos, multi-repo workspaces, UI-heavy flows, data-sensitive work, or runtime/tool unavailability.

## Adoption Test
Before implementing or promoting a durable process change, check whether future agents and repos can actually use it.

```text
Reachability:
Would the right skill trigger?
Would the agent know the next action?
Could a new repo configure this?
Could a tiny task bypass it?
Could a high-risk task be forced through it?
Could unavailable optional tools be skipped cleanly?
Would the final output tell the developer what changed and what was proven?
```

A process improvement that is hard to trigger, hard to configure, impossible to validate, or too heavy for tiny tasks should be revised before implementation.

## Iteration Tool Selection
Use `improvement-loop` when a bounded artifact needs repeated critique, candidate tracking, viewpoint shifts, frozen evaluator scoring, or convergence testing. Good improvement-loop targets include this skill, another skill, a plan, a prompt packet, a helper-command contract, or a fixture-validation script.

Use this skill's 10-loop critique when the target is an SDLC process-improvement plan that is already framed and needs research/review/revision before implementation.

Do not run both loops by habit. Use `improvement-loop` to improve the improvement artifact; use this skill to evaluate and implement a concrete SDLC improvement. If both apply, run improvement-loop first on the bounded artifact, then use the resulting candidate as input to this skill.

## Promotion Ladder
Classify every SDLC process change by maturity before implementation or handoff:

```text
Idea: plausible, not yet shaped.
Candidate: compared against alternatives and selected.
Experiment: tested through a small fixture, dry run, prompt comparison, or helper-command smoke.
Provisional: useful with evidence, but still monitored or scoped.
Durable: validated, documented, and safe to rely on as reusable SDLC behavior.
Deprecated: replaced, harmful, unused, or too heavy.
```

Novel, cross-domain, machine-native, or tool-dependent ideas should pass through `Experiment` before becoming durable. A low-risk wording or routing clarification may move directly to `Provisional` when the behavior is obvious and reversible.

## Experimental Research
For Standard or larger SDLC process improvements, consider whether useful ideas exist outside normal software-development practice or in machine-native process representations. Use outside domains and compressed representations as experimental inspiration, not authority.

Load `references/experimental-research.md` when the improvement may involve cross-domain ideas, manufacturing/lean/checklist/statistical inspiration, math or representation design, prompt compression, trigger-word packets, context/evidence matrices, or experiment-before-process design.

## Use When
- The user asks to improve, harden, simplify, extend, or evaluate the SDLC process.
- A process learning should become a durable SDLC change.
- The SDLC helper CLI, skills, references, workflow gates, validation fixture, or agent routing needs improvement.
- The user wants a research-backed implementation plan before changing the SDLC.
- Battle Soccer or another fixture app should validate that the SDLC still works in practice.

## Not For
- Ordinary product work that should use `run-sdlc` directly.
- One-off local preferences with no reusable process value.
- Bypassing human approval for commit, push, merge, deploy, release, or destructive Git operations.

## Core Workflow
1. Frame the improvement hypothesis: current friction, failure mode, desired behavior, affected users, affected SDLC surfaces, and expected evidence.
2. Gather local evidence first: relevant skills, references, helper CLI code, tests, previous learnings, run journals, and fixture behavior.
3. Research current best practices when the topic may have changed, involves external tools, coding quality, platform support, repo configurability, or would benefit from primary sources.
4. Generate and compare multiple novel solution candidates for Standard+ improvements, including at least one low-weight incremental option and one capability-expanding option. Include quality-oracle, process-weight, repo-contract, adoption, cross-domain inspiration, machine-native representation, and experiment-before-process implications.
5. Assign a promotion-ladder state and define the smallest experiment needed before durable adoption.
6. Create an implementation plan with scope, changes, risks, validation, rollback, affected skills/scripts/tests, coding-quality impact, platform support impact, repo-configuration behavior, process weight, and before/after evaluation.
7. Run at least 10 critique loops before implementation unless the user explicitly narrows the task to a tiny edit.
8. Implement the approved/revised plan using existing SDLC patterns and the smallest durable change set.
9. Validate against the Battle Soccer app or the configured fixture target.
10. Run relevant SDLC helper checks/tests and capture evidence.
11. Prepare commit/push only after explicit human approval.

## Ten-Loop Critique Requirement
For Standard or larger SDLC process improvements, complete at least 10 loops before implementation:

```text
Loop N:
Research question:
Evidence consulted:
Plan weakness found:
Revision made:
Residual risk:
Next loop focus:
```

Each loop must do at least one of:
- inspect a local artifact not previously considered,
- test a workflow or helper command,
- compare against current primary-source guidance,
- run an independent review lens,
- challenge usability for a future agent or human,
- reduce unnecessary process overhead,
- improve validation or rollback.

Do not pad the loop with empty repetition. If a loop produces no change, record why the plan held up and switch review lens for the next loop.

## Review Lenses
Cycle through these lenses during the 10 loops:

- Usability: Can an agent or human follow this without ceremony?
- Capability: Does it unlock a real workflow the SDLC could not handle before?
- Efficiency: Does it remove repeated model reasoning, command clutter, or context waste?
- Evidence integrity: Are validation claims backed by local proof?
- Best practices: Does it align with current tool, security, testing, and agent guidance?
- Safety: Are consent gates, sensitive data boundaries, and Git boundaries preserved?
- Composability: Does it fit existing skills instead of duplicating them?
- Fixture realism: Would Battle Soccer expose the intended failure or improvement?
- Maintainability: Is the change understandable, testable, and reversible?
- Adoption: Will future agents know when and how to use it?

## Planning Artifact
Before implementation, produce:

```text
Improvement hypothesis:
Failure mode classification:
Evidence summary:
Affected surfaces:
Coding-quality impact:
Platform/tool support impact:
Repo configurability impact:
Candidate approaches considered:
Selected approach and rationale:
Repo capability contract impact:
Quality oracle ladder:
Process weight budget:
Comparative evaluation:
Adoption test:
Iteration tool used:
Promotion ladder state:
Cross-domain inspiration:
Machine-native representation plan:
Experiment before durable process:
Implementation plan:
Ten-loop review log:
Acceptance criteria:
Battle Soccer validation plan:
Verification commands:
Configuration/defaults changed:
Rollback path:
Commit/push approval needed: yes
```

## Implementation Rules
- Prefer modifying existing SDLC skills, references, helper CLI commands, tests, or fixture guidance over adding a new abstraction.
- Keep durable rules portable and sanitized. Product-specific facts stay in project context, not reusable SDLC guidance.
- Use `process-learning` for learning capture and promotion decisions.
- Use `planning` for implementation plans and `review` for plan/code/process critique.
- Use `test-skill-behavior` before relying on a meaningful skill behavior change.
- Use `quality` for verification evidence and rendered/fixture evidence when relevant.
- Use `release` only for commit/handoff readiness, and stop before commit/push without explicit human approval.

## Battle Soccer Validation
Use Battle Soccer as the default fixture when validating SDLC process changes that affect routing, helper CLI behavior, planning, implementation, review, QA, or release handoff.

Validation should prove:
- the changed SDLC guidance is reachable when appropriate,
- the workflow remains proportional for small tasks,
- Standard+ process work gets enough evidence,
- generated plans or helper outputs are usable,
- no human consent gate was hidden or removed.

If Battle Soccer is unavailable, record the missing fixture as an evidence gap and use the closest local fixture or dry-run packet.

## Required Output

```text
Improvement scope:
Work class:
Research sources/evidence:
Coding/platform/config fit:
Failure mode addressed:
Novel candidates considered:
Process weight/adoption fit:
Cross-domain/machine-representation fit:
Experiment-before-process result:
Iteration tool used:
Promotion state:
Ten-loop status:
Plan verdict:
Implementation status:
Battle Soccer validation:
Verification evidence:
Git status:
Human approval needed:
Next action:
```

## Stop Rules
- Stop before implementation if the 10-loop review finds unresolved product direction, safety, data-boundary, or process-ownership questions.
- Stop before installing third-party software, adding dependencies, changing repo setup, or requiring optional services unless the user explicitly approves that setup.
- Stop before commit or push unless the user explicitly approves those Git actions.
- Do not merge, deploy, release, or create PRs by default.
- Do not promote a durable SDLC rule from one weak signal without marking it experimental.
