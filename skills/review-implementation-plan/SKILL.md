---
name: review-implementation-plan
description: 'Review an implementation plan before coding.'
user-invocable: true
---

# review-implementation-plan

## Description
Review an implementation plan before coding.

## Checks
- Does the plan match the PRD?
- Does it match docs/application-model.md?
- Does it stay within the approved technical approach, ADRs, dependency policy, and AGENTS.md conventions?
- Does it use approved quality automation, or route missing/stale tooling to `choose-quality-automation`?
- Does it use approved retrieval/indexing only as a pointer to authoritative artifacts, or route missing/stale retrieval decisions to `choose-retrieval-approach`?
- Does it use applicable project implementation patterns, or route missing/stale/disputed patterns to `choose-implementation-pattern`?
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
- Are project-specific pattern expectations and exceptions testable or reviewable where relevant?
- Are formatter, lint, type/schema, build, security/dependency, generated artifact, docs, CI/local preflight, or other automated checks included where relevant?
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
- Do not approve a plan that introduces or depends on new quality automation, CI gates, scanners, build tooling, or verification commands without `choose-quality-automation` approval when the decision is meaningful.
- Do not approve a plan that introduces or depends on new RAG, embeddings, vector search, graph/index tooling, repo retrieval, hosted search, or Obsidian-style workflow without `choose-retrieval-approach` approval when the decision is meaningful.
- Do not approve a plan that invents, promotes, deprecates, or supersedes a project implementation pattern without `choose-implementation-pattern` or `update-implementation-patterns` when the decision is meaningful.

## Loop behavior
If the plan is incomplete, return to plan, `choose-technical-approach`, `choose-quality-automation`, `choose-retrieval-approach`, `choose-implementation-pattern`, contract, issues, PRD, model, engineering-principles-review, or context-state.
