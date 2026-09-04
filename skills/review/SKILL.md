---
name: review
description: 'Router skill for review and release checks: spec compliance, code quality, UX, security, and agent-work review.'
user-invocable: true
---

# review

## Purpose
Route review requests to the smallest meaningful review stack and load review-local references and templates.

## Use when
- A review, spec compliance check, code quality pass, UX/design review, threat-model, or release readiness assessment is requested.
- `run-sdlc` or another router determines a review phase is required.

## Behavior
1. Classify the claim being checked (spec, code quality, UX, security, agent work, release readiness) and load the experience-impact trace when observable behavior changed.
2. Select the minimal set of review references from `references/`.
3. Use this router as the canonical review entry point. Former top-level `review-*`, `design-review`, `devex-review`, `production-readiness-review`, and `threat-model` skills now live here as references.
4. Produce a structured review report using `templates/review-report.md` when present, or the required output below.
5. Stop at blocking findings and hand back to the orchestrator or request human approval.

## Reference selection

| Trigger or surface | Load reference |
| --- | --- |
| Implementation must satisfy issue, PRD, model, contract, or acceptance criteria | `references/spec-compliance.md` |
| Code maintainability, tests, architecture, docs, dependency, operability, or implementation quality | `references/code-quality.md` |
| AI agent work, handoff, workflow adherence, evidence integrity, Git reviewability, or artifact drift | `references/agent-work.md` |
| Select the minimum review stack for AI/human work review | `references/review-router-map.md` |
| UI screens, user flows, visual states, accessibility, responsive behavior, or rendered evidence | `references/design-review.md` |
| CLI, API, SDK, package, local setup, examples, error messages, or developer workflow | `references/devex-review.md` |
| Security, privacy, abuse, data, dependency, tool access, AI/agent risk, public boundary, or untrusted input | `references/threat-model.md` |
| LLM, agent, MCP, tool-calling, retrieval, generated skill, or runtime adapter security | `references/ai-agent-security.md` |
| Production merge, release, deployment, handoff, rollback, migration, CI parity, or operational readiness | `references/production-readiness.md` |
| Contract spec before implementation planning or public boundary changes | `references/contract-spec.md` |
| Implementation plan before coding or plan gate after slice/product-fit work | `references/implementation-plan.md` |
| Application model, PRD-to-model, or issue dependency review before planning/build | `references/planning-artifact-review.md` |
| Project-specific implementation pattern fit, deviations, or pattern maturity | `references/implementation-pattern.md` |
| Deeper maintainability principle challenge or architecture-quality lens | `references/engineering-principles.md` |
| Independent critique of a plan, model, contract, review, or diff | `references/outside-voice.md` |
| Agent strategy, delegation, model tier, runtime adapter, or specialist boundary review | `references/agent-strategy.md` |
| Process feedback, review feedback, or repeated process-learning signal | `references/process-feedback.md` |

Load more than one reference only when the work crosses surfaces. For example, a release-facing UI change usually needs `spec-compliance`, `design-review`, and `production-readiness`; an LLM tool-calling change usually needs `spec-compliance`, `threat-model`, `agent-work`, and `production-readiness` if it is merge-bound.

## References
- references/spec-compliance.md
- references/code-quality.md
- references/agent-work.md
- references/review-router-map.md
- references/design-review.md
- references/devex-review.md
- references/production-readiness.md
- references/threat-model.md
- references/ai-agent-security.md
- references/contract-spec.md
- references/implementation-plan.md
- references/planning-artifact-review.md
- references/implementation-pattern.md
- references/engineering-principles.md
- references/outside-voice.md
- references/agent-strategy.md
- references/process-feedback.md

## Required output

```text
Reviewed scope:
Primary claim checked:
Verdict: pass / pass-with-notes / blocked / needs-human-review
Blocking findings:
Non-blocking findings:
Evidence gaps:
Experience-impact closure findings:
Recommended next action:
```

## Stop rules
- Stop if review requires edits, release authority, or a human waiver.
- Escalate to `run-sdlc` for cross-router or cross-repo reviews.
