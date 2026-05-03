---
name: production-readiness-review
description: 'Review whether completed Standard or High-risk work is ready to merge, release, deploy, or hand off for production use.'
user-invocable: true
---

# production-readiness-review

## Description
Review whether completed Standard or High-risk work is ready to merge, release, deploy, or hand off for production use.

## Use when
- A feature, bug fix, refactor, dependency change, migration, integration, infrastructure change, public contract change, or AI/agent change is intended for production.
- `classify-work` marks work as High-risk or release-facing.
- `verification-before-completion`, `health-check`, `review-code-quality`, or `review-agent-work` finds missing release, rollback, observability, dependency, security, migration, or Git review evidence.
- A human wants confidence that the Git diff and commits are reviewable before merge.

## Purpose
Make production readiness concrete without turning every change into a heavy release ceremony. The review should prove that the work is scoped, verified, reviewable in Git, and has an acceptable path to rollback or mitigation if production behavior is wrong.

## Read first
1. User request, issue, PRD, contract spec, application model, implementation plan, and threat-model output if required.
2. Git status, changed files, and recent commits when available.
3. Verification evidence from the current session.
4. Quality automation decision, AGENTS.md commands, CI configuration, package/build/release configuration, and health-check output.
5. Relevant docs, feature context, context-state, release notes, migration notes, and operational docs.

## Required output

```text
Production readiness status: Ready / Needs Fixes / Not Ready / Not Applicable
Scope reviewed:
Work class and release risk:
Git reviewability:
Verification evidence:
CI/local parity:
Security/privacy/dependency evidence:
Threat model status:
Contract and docs status:
Migration/data status:
Observability/support status:
Rollback or mitigation:
Release notes or handoff:
Blocking issues:
Accepted risks:
Recommended commit boundary:
Next skill:
```

## Checks
- Scope: the diff matches the approved issue/plan and does not hide unrelated work.
- Git reviewability: changes are small enough to review, commits are intentional, commit messages describe the task and why it changed, and one commit does not span unrelated tasks.
- Verification: targeted behavior checks and relevant broad checks ran in the current session or are clearly delegated to CI with residual risk stated.
- CI/local parity: local commands match documented CI expectations where practical.
- Security/privacy/dependency: threat-model findings are resolved or accepted; security, dependency, license, and secret checks ran when relevant and available.
- Public contracts: APIs, CLIs, schemas, events, UI workflows, examples, and compatibility notes match the approved contract and tests.
- Data/migrations: migrations, backfills, seeds, retention/deletion behavior, rollback, and recovery paths are tested or explicitly accepted.
- Observability/support: logs, metrics, traces, alerts, audit logs, error messages, runbooks, and debug paths are adequate for the risk.
- Rollout/rollback: feature flags, canaries, versioning, compatibility, rollback, mitigation, and customer communication are addressed where relevant.
- Docs/context: README, release notes, feature context, application model, ADRs, AGENTS.md, and context-state changed only when their surfaces changed.

## Git review guidance
- Prefer commits that map to one coherent task, gate, or mechanical change.
- Do not bundle unrelated behavior changes with formatting, dependency updates, generated artifacts, or docs unless the project convention expects that bundle.
- Commit messages should explain the user-visible or maintainer-visible purpose, not just list touched files.
- If one change became multiple tasks, recommend splitting before merge or at least document the reason it remains together.
- Do not require a separate audit artifact when the Git diff, commit history, verification evidence, and updated source-of-truth artifacts are enough for human review.

## Hard gates
- Do not mark production work ready when verification evidence is stale, missing, or lower than the work class requires.
- Do not mark High-risk work ready while threat-model, rollback, migration, security/privacy/dependency, or observability findings are unresolved unless the human explicitly accepts the residual risk.
- Do not claim CI coverage without current local evidence, current CI evidence, or a clear statement that the check was not run.
- Do not rewrite history, squash, split, or stage broad changes unless the human asks.

## Next skills
Usually `verification-before-completion`, `threat-model`, `review-spec-compliance`, `assert-doc-sync`, `review-code-quality`, `health-check`, `document-release`, `finish-development-branch`, `context-save`, or `review-agent-work`.
