---
name: choose-quality-automation
description: 'Choose, review, or revise project quality automation so deterministic tools handle repeatable checks such as formatting, linting, typing, tests, builds, contracts, accessibility, security, dependency, license, generated artifact, documentation, and CI/local preflight validation.'
user-invocable: true
---

# choose-quality-automation

## Description
Choose, review, or revise project quality automation so deterministic tools handle repeatable checks such as formatting, linting, typing, tests, builds, contracts, accessibility, security, dependency, license, generated artifact, documentation, and CI/local preflight validation.

## Use when
- Starting a new project after the technical approach is clear enough to know the stack, runtime, package manager, test strategy, deployment model, and risk profile.
- A project lacks documented formatter, linter, typecheck, test, build, security, dependency, license, accessibility, contract, docs, generated artifact, or CI/local preflight commands.
- A feature or refactor changes verification needs, build tooling, generated files, public contracts, dependencies, schema/migration behavior, UI accessibility risk, deployment, or release confidence.
- Agents are manually checking problems that mature project tooling should catch.
- `classify-work`, `choose-technical-approach`, `write-implementation-plan`, `verification-before-completion`, `health-check`, or `review-code-quality` detects missing, stale, noisy, or underused quality automation.

## Purpose
Reduce AI and human burden by making repeatable quality checks explicit, automated, and part of the lifecycle. Agents should configure, run, and interpret deterministic tooling, then reserve judgment for intent, architecture, contracts, usability, maintainability, and risk.

## Read first
1. Approved technical approach, ADRs, and package/build files.
2. Existing `AGENTS.md`, README/developer docs, CI config, task runner files, and local scripts.
3. Current tests, linters, formatters, type/schema tools, build commands, generated artifact workflows, and dependency/security tooling.
4. Relevant PRD, issue, contract, application model, or feature context when the automation need is tied to a feature or risk.
5. Current external docs through `select-tools` when version-specific tooling, licenses, security posture, or CI behavior matters.

## Required output

```text
Quality automation decision needed:
Decision scope:
Inputs considered:
Project risk profile:
Existing checks:
Gaps:
Options considered:
Recommended automation:
Commands to add or document:
Lifecycle usage:
Why:
Tradeoffs:
Risks and mitigations:
Rejected options:
Needs human approval:
Future reconsideration triggers:
Artifacts to update:
Next skill:
```

## Decision areas
Consider only areas relevant to the project and current route:

- Formatting and import/order normalization.
- Linting and static analysis.
- Type checking, compile checks, schema validation, and generated type checks.
- Unit, integration, contract, E2E, smoke, visual, snapshot, and regression tests.
- Accessibility checks for UI flows.
- Build, package, release, and install validation.
- Generated artifact validation and drift detection.
- Public API, CLI, SDK, plugin, schema, event, or configuration compatibility checks.
- Migration, seed, rollback, and data integrity validation.
- Security, dependency, license, secret scanning, and supply-chain checks.
- Documentation, examples, snippets, links, and API doc generation checks.
- Local preflight, CI parity, task runner ergonomics, and command discoverability.

## Selection rules
- Prefer project-native, boring, well-maintained tools that fit the approved technical approach.
- Prefer deterministic tools over agent judgment for repeatable consistency, syntax, type, style, dependency, security, and generated-artifact checks.
- Prefer the smallest useful automation set that catches likely expensive failures.
- Keep command paths discoverable through package scripts, Makefile/Justfile/Taskfile, CI, README, or `AGENTS.md`.
- Prefer checks that can run locally and in CI with comparable results.
- Separate targeted commands for fast iteration from broader health commands for completion or release.
- Account for signal-to-noise. A check that agents will ignore because it is slow, flaky, or vague is not a real quality rail.

## Approval behavior
Ask for human approval before accepting:

- New production, CI, or developer dependencies with meaningful maintenance, security, license, cost, or lock-in risk.
- New build systems, package managers, test frameworks, hosted scanners, external services, or CI providers.
- Checks that materially change developer workflow, commit/PR requirements, release gates, or runtime artifacts.
- Security, dependency, license, privacy, migration, or rollback policies.

Do not require approval for documenting existing commands, using already-approved local tools, or adding low-risk test-only utilities that fit the approved approach.

## Artifact updates
After approval, route updates to the owning artifacts:

- `AGENTS.md` owns exact setup, lint, format, typecheck, test, build, health, and local preflight commands for agents.
- CI/task runner/package files own executable command wiring.
- ADRs or technical decision docs own durable rationale when automation changes dependencies, CI, release gates, or developer workflow.
- `docs/application-model.md` owns verification, deployment, generated artifact, or operational implications when they affect the system model.
- PRDs, issues, contracts, and implementation plans own feature-specific verification expectations.
- `docs/context-state.md` owns unresolved tooling gaps, flaky checks, deferred automation, and reconsideration triggers.
- Memory Bank indexes link to quality automation decisions and command locations when present.

## Lifecycle integration
- `classify-work` should mark `qualityAutomationChanged` when quality rails are missing, stale, changing, or newly relevant.
- `write-implementation-plan` should include relevant targeted and broad checks from the approved automation.
- `execute-plan` should run fast targeted checks during implementation when useful.
- `verification-before-completion` should use the approved commands as fresh evidence.
- `health-check` should run or report the broader command suite without automatic fixes.
- `review-code-quality` should focus on judgment that tooling cannot automate and call out missing or ignored tooling.
- `setup-agent-instructions` should document the command contract for future agents.

## Hard rules
- Do not install or mandate tools just because they are popular.
- Do not silently add dependencies, hosted services, CI requirements, or workflow gates.
- Do not treat passing tools as proof that the right product behavior was built.
- Do not make every project use every category of check.
- Do not hide missing quality rails behind manual AI review.
- Do not require slow broad checks for every Micro/Tiny edit when a narrower command proves the change.
- Do not claim completion from stale automation output.

## Next skills
Usually `model-application`, `to-prd`, `write-implementation-plan`, `setup-agent-instructions`, `verification-before-completion`, `health-check`, `manage-context-state`, or `update-context-docs`.
