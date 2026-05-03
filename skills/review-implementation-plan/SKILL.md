# review-implementation-plan

## Description
Review an implementation plan before coding.

## Checks
- Does the plan match the PRD?
- Does it match docs/application-model.md?
- Does it stay within the approved technical approach, ADRs, dependency policy, and AGENTS.md conventions?
- If a public or cross-boundary contract changed, does it reference an approved contract spec?
- Does it reference the correct feature `context.md` files?
- Are file responsibilities clear?
- Are tasks small enough?
- Will the plan produce readable, cohesive units that a maintainer can follow as a story?
- Does the plan avoid mixing orchestration, validation, persistence, IO, formatting, and presentation concerns in one unit?
- Are abstractions, patterns, dependencies, frameworks, and services justified by known requirements and approved technical constraints rather than speculation?
- Does it avoid both harmful duplication and premature abstraction?
- Are tests specified before code?
- Are contract, acceptance, E2E, or integration checks included where relevant?
- Are code-local documentation updates identified for public exports, shared types/schemas, integration boundaries, non-obvious behavior, invariants, errors, or examples?
- Are verification commands listed?
- Are documentation/context updates included?
- Could an agent execute this without guessing?

## Principle guidance
- Use `engineering-principles-review` when the plan introduces patterns, abstractions, dependencies, or broad refactors.
- Line count estimates are only signals. The real concern is responsibility, cohesion, coupling, and abstraction level.
- Design patterns should simplify the plan, not decorate it.

## Hard gates
- Do not approve a plan for public or cross-boundary behavior without an approved contract spec or explicit documented exception.
- Do not approve a plan that contradicts the PRD, application model, approved technical approach, contract spec, AGENTS.md, or context-state.
- Do not approve a plan that lacks testable behavior or verification commands.
- Do not approve a plan that would create undocumented public/shared behavior without an explicit documentation exception.
- Do not approve a plan whose core approach is over-abstracted, under-specified, or likely to produce tangled responsibilities.
- Do not approve a plan that introduces a new framework, runtime, service, database, production dependency, deployment model, or testing tool without `choose-technical-approach` approval.

## Loop behavior
If the plan is incomplete, return to plan, `choose-technical-approach`, contract, issues, PRD, model, engineering-principles-review, or context-state.