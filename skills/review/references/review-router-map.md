# Review Router Map

Purpose: choose the minimum review stack that proves the work is correct enough for its class without repeating every review skill on every task.

This reference is owned by the consolidated `review` router. Load it when deciding which review references to use after implementation, agent delegation, fixture work, or final handoff.

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
| Any completed Git-tracked implementation | `quality` verification evidence, then `review/references/agent-work.md` |
| Work with issue, PRD, model, or contract | `review/references/spec-compliance.md`, then `context` doc-sync evidence if artifacts may disagree |
| Code quality, maintainability, tests, or automation changed | `review/references/code-quality.md` |
| Project-specific implementation pattern exists or changed | `review/references/implementation-pattern.md` |
| Implementation plan was non-trivial or changed during work | `review/references/implementation-plan.md` or `review/references/agent-work.md` for plan adherence |
| AI delegation, subagent work, or fixture-agent work occurred | `review/references/agent-strategy.md`, then `review/references/agent-work.md` |
| Final branch handoff, commit, push, PR, or release readiness | `release` handoff evidence, then `review/references/production-readiness.md` when production-intended |

## Specialist Review Triggers

| Dirty surface or concern | Add this review |
| --- | --- |
| UI, visual behavior, accessibility, or user workflow | `review/references/design-review.md` plus rendered/browser evidence |
| Developer tool, SDK, API ergonomics, CLI, or package workflow | `review/references/devex-review.md` |
| Security, privacy, secrets, data, abuse case, dependency, or external integration | `review/references/threat-model.md` |
| LLM, MCP, tool-calling, retrieval, generated skill, or runtime adapter security | `review/references/ai-agent-security.md` |
| Production release, migration, rollback, observability, rollout, or operational support | `review/references/production-readiness.md` |
| Architecture, coupling, abstraction, maintainability, or repeated design tradeoff | `review/references/engineering-principles.md` |
| Application model, PRD, issue, contract, or plan artifact changed or may be stale | `review/references/planning-artifact-review.md` |
| Contract spec changed or public behavior shifted | `review/references/contract-spec.md` |
| Repeated process friction or skill behavior evidence appears | `review/references/process-feedback.md` |

## Evidence Expectations

- Micro/Tiny work can usually stop after targeted verification and a focused `review/references/agent-work.md` pass.
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
References loaded:
References intentionally skipped:
Evidence inspected:
Evidence personally run:
External evidence accepted:
Findings:
Accepted caps:
Required fixes:
Next router or skill:
```
