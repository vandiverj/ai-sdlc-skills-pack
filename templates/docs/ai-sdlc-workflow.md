# AI SDLC Workflow

## Purpose
This document defines the project's AI-assisted development process.

## Core principles
1. Load the smallest safe context packet.
2. No meaningful code before approved design.
3. Diagrams are part of requirements.
4. Implementation must be testable before coding.
5. Completion requires fresh verification evidence.
6. Context docs are part of Definition of Done.
7. Agent roles, model tiers, and runtime adapters are optional execution aids; they must stay bounded and reviewable.
8. Implementation patterns are evidence-backed project guidance, not duplicate tooling or universal laws.
9. Confidence is limited by contextual caps when required evidence is missing.
10. Product-experience claims require rendered review when a runnable UI/app surface and approved tool exist.

## Workflow
See `SUMMARY.md` in the skills pack for the full baseline.

## Agent strategy
- Portable source of truth: `docs/agents/`.
- Use `choose-agent-strategy` when delegation, specialist review, independent verification, or model-tier selection may reduce risk.
- Runtime-specific files are adapters and should point back to `AGENTS.md`, this workflow, and `docs/agents/`.
- Use the least powerful model tier and fewest agents that can satisfy the evidence requirement.

## Implementation patterns
- Portable source of truth: `docs/patterns/`.
- Use `choose-implementation-pattern` when project-specific forms, tables, APIs, tests, layouts, or feature structure may matter.
- Use `review-implementation-pattern` before completion when implementation patterns affected the change.
- Update patterns only from reviewed evidence, repeated friction, or material requirement/framework/design-system changes.

## Project commands
- Typecheck:
- Test:
- Lint:
- Format check:
- Health:
- Rendered UI/app review:

## Evidence Rules
- Use the smallest evidence packet that fits the work class.
- Record changed files, validation run, skipped checks, contextual caps, and next action.
- For Git-tracked code/text edits, run and record diff hygiene such as `git diff --check` before completion, commit, handoff, or evidence packet finalization when available.
- For UI/user-facing workflow changes, include rendered browser/app/device evidence when available.
- Treat tests, snapshots, generated baselines, validation scripts, thresholds, and CI/local preflight config as protected evidence surfaces. If any changed, record why the change was needed and how the new evidence still protects behavior.
- If no automated tests exist, use the strongest available alternative evidence and state the test gap honestly.

## Definition of Done
- [ ] Issue matches PRD.
- [ ] PRD matches application model.
- [ ] Tests added/updated.
- [ ] Diff hygiene checked for Git-tracked code/text edits.
- [ ] Verification run and recorded.
- [ ] Evidence packet recorded at the route-appropriate level.
- [ ] Contextual caps recorded or marked not applicable.
- [ ] Rendered review recorded for UI/user-facing workflow changes, or explicitly marked unavailable/unverified.
- [ ] Test/evidence surface changes justified.
- [ ] Agent strategy, model-tier, or runtime adapter docs updated if they changed or should have changed.
- [ ] Implementation pattern docs updated if pattern guidance, maturity, examples, or exceptions changed.
- [ ] Feature context updated.
- [ ] Application model updated if structure changed.
- [ ] Context-state updated.
- [ ] Docs/examples updated if behavior changed.
