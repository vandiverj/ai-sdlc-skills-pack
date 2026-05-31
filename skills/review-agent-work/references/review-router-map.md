# Review Router Map

Purpose: choose the minimum review stack that proves the work is correct enough for its class without repeating every review skill on every task.

This reference is owned by `review-agent-work`. Load it when deciding which review skills to run after implementation, agent delegation, fixture work, or final handoff.

## Routing Principles

1. Start from the work class, dirty surfaces, and verification evidence.
2. Run spec compliance before quality review when requirements or acceptance criteria exist.
3. Run documentation sync checks before updating durable docs to match implementation.
4. Add specialist reviews only for surfaces the slice actually touched.
5. Treat missing or capped evidence as a review finding, not as proof of failure by itself.
6. Distinguish evidence the reviewer personally ran from external evidence supplied by the orchestrator, CI, another agent, or a human.
7. Keep independent reviewers read-only unless a separate fix route is approved.

## Core Review Stack

| Situation | Review route |
| --- | --- |
| Any completed Git-tracked implementation | `verification-before-completion`, then `review-agent-work` |
| Work with issue, PRD, model, or contract | `review-spec-compliance`, then `assert-doc-sync` if artifacts may disagree |
| Code quality, maintainability, tests, or automation changed | `review-code-quality` |
| Project-specific implementation pattern exists or changed | `review-implementation-pattern` |
| Implementation plan was non-trivial or changed during work | `review-implementation-plan` or `review-agent-work` for plan adherence |
| AI delegation, subagent work, or fixture-agent work occurred | `review-agent-strategy`, then `review-agent-work` |
| Final branch handoff, commit, push, PR, or release readiness | `finish-development-branch`, then `production-readiness-review` when production-intended |

## Specialist Review Triggers

| Dirty surface or concern | Add this review |
| --- | --- |
| UI, visual behavior, accessibility, or user workflow | `design-review` plus rendered/browser evidence |
| Developer tool, SDK, API ergonomics, CLI, or package workflow | `devex-review` |
| Security, privacy, secrets, data, abuse case, dependency, or external integration | `threat-model` |
| Production release, migration, rollback, observability, rollout, or operational support | `production-readiness-review` |
| Architecture, coupling, abstraction, maintainability, or repeated design tradeoff | `engineering-principles-review` |
| Application model changed or may be stale | `review-application-model` |
| PRD changed or implementation pressure revealed product drift | `review-prd-against-model` |
| Contract spec changed or public behavior shifted | `review-contract-spec` |
| Issue ordering or slice dependency risk appears | `review-issue-dependencies` |
| Repeated process friction or skill behavior evidence appears | `review-process-learning` |

## Evidence Expectations

- Micro/Tiny work can usually stop after targeted verification and a focused review-agent-work pass.
- Standard work needs spec or acceptance review plus relevant quality/specialist review for touched surfaces.
- High-risk work needs independent review, threat or production review when relevant, and explicit human approval for accepted caps.
- Fixture validation is useful evidence for SDLC behavior, but reusable skill-pack changes still need local skill-pack verification.
- External review evidence may satisfy a specialist gap only when its source, freshness, scope, and cap are reported separately from the reviewer's own commands/tools.

## Stop Conditions

Stop and reroute when:

- the work class looks too low for the observed blast radius,
- requirements, docs, tests, and implementation disagree,
- a review finds missing evidence that cannot be capped locally,
- a reviewer would need to edit files rather than review,
- the review route requires a human waiver or product decision,
- fixture-agent behavior suggests the SDLC prompt or skill design is drifting.

## Handoff Format

```text
Review route chosen:
Why this route:
Reviews run:
Reviews intentionally skipped:
Evidence inspected:
Evidence personally run:
External evidence accepted:
Findings:
Accepted caps:
Required fixes:
Next skill:
```
