# Delegation Patterns

## Status
Draft / Active / Needs Review

## Purpose
Define approved ways to use subagents without making the workflow noisy, expensive, or hard to review.

## Patterns

### single-agent
Default for Micro, Tiny, and narrow Standard work.

Use when:
- The task is local, low-risk, and easy to verify.

### read-only exploration
An explorer gathers context, related files, contradictions, and risks without editing.

Use when:
- Context is broad or unclear.
- The orchestrator needs help finding source-of-truth artifacts.

### bounded implementation
A worker edits assigned files from an approved plan.

Use when:
- The plan has clear file ownership.
- Work can be split without conflicting edits.

### parallel specialist review
Specialists independently review security, contracts, tests, maintainability, docs, or production readiness.

Use when:
- A risk lens matters and can be reviewed without blocking implementation.

### independent verification
A verifier runs commands and reports current-session evidence.

Use when:
- Completion depends on repeatable checks.
- The implementer may be biased toward a completion claim.

### consensus review
Independent reviewers or model tiers examine a critical decision, then the orchestrator reconciles findings.

Use when:
- The decision is high-risk, costly to reverse, or disputed.

## Handoff format

```text
Task:
Role:
Context provided:
Files/tools allowed:
Files/tools forbidden:
Expected output:
Evidence required:
Stop conditions:
Escalation triggers:
```

## Hard rules
- Do not delegate vague ownership.
- Do not assign overlapping write scopes unless coordination is explicit.
- Do not let subagents expand scope silently.
- Do not treat subagent agreement as proof over tests, contracts, source artifacts, or deterministic tools.

## Last updated
- Date:
- Updated because:
- Confidence:
