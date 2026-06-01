
# outside-voice-review

## Description
Run an independent reviewer pass over a plan, model, issue breakdown, contract, or diff using a curated context packet.

## Purpose
Challenge assumptions and identify missing risks without letting the reviewer automatically override the plan.

## Rule
Outside voice findings are advisory until accepted.

## Review packet
- Purpose of review.
- Work class and context depth.
- Dirty surfaces.
- Application model excerpt.
- PRD excerpt.
- Contract excerpt, when relevant.
- Issue/task being reviewed.
- Files changed, when reviewing code.
- Base/head diff, when available.
- Specific questions.
- What not to review.

## Reviewer personas
Use one or more personas when they match the risk:

- Product skeptic: asks whether the work solves the root problem or only a symptom.
- Lead architect: challenges boundaries, dependency direction, and long-term changeability.
- Security reviewer: looks for auth, privacy, secret, injection, dependency, and data risks.
- Junior maintainer: checks whether the design/code tells a readable story and can be understood without tribal knowledge.
- API consumer: checks public contract clarity, examples, and failure behavior.
- Test engineer: checks testability, missing edge cases, and verification gaps.
- Operations/support reviewer: checks observability, rollout, rollback, migration, and debuggability.

Do not require actual multi-agent execution. A single agent may simulate these lenses, or multiple agents/tools may be used when available and worthwhile.

## Output
- Personas used.
- Agreements.
- Disagreements.
- Risks.
- Missing questions.
- Alternative design options.
- Recommendation.
- Dirty surface changes.
- Impact on model / PRD / contract / issues / context-state.

## Hard rules
- Do not accept outside-voice findings blindly.
- Do not expand scope just because a persona suggests an improvement.
- If a finding changes requirements, contracts, architecture, or uncertainty, update the owning artifact or context-state before implementation continues.
