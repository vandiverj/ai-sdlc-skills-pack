# Production Readiness Review

Use when completed Standard or High-risk work is intended for merge, release, deployment, handoff, public contract change, dependency change, migration, integration, infrastructure change, or production-facing AI/agent behavior.

## Checks
- Scope matches approved issue/plan and does not hide unrelated work.
- Git diff and commits are reviewable, intentional, and scoped.
- Targeted behavior checks and relevant broad checks ran recently, or residual CI/local gaps are stated.
- Local commands match documented CI expectations where practical.
- Security, privacy, dependency, license, secret, and threat-model findings are resolved or explicitly accepted.
- APIs, CLIs, schemas, events, UI workflows, examples, and compatibility notes match the approved contract and tests.
- Migrations, backfills, seeds, retention/deletion behavior, rollback, and recovery paths are tested or accepted.
- Logs, metrics, traces, alerts, audit logs, error messages, runbooks, and debug paths fit the risk.
- Feature flags, canaries, versioning, compatibility, rollback, mitigation, and communication are addressed where relevant.
- README, release notes, feature context, application model, ADRs, AGENTS.md, and context-state changed only when their surfaces changed.

## Hard Gates
- Do not mark production work ready when verification evidence is stale, missing, or weaker than the work class requires.
- Do not mark High-risk work ready while threat-model, rollback, migration, security/privacy/dependency, or observability findings are unresolved unless the human accepts residual risk.
- Do not claim CI coverage without current local evidence, current CI evidence, or a clear not-run statement.
- Do not rewrite history, squash, split, or stage broad changes unless the human asks.

## Output
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
