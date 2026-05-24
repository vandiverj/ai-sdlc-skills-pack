---
name: review-implementation-plan
description: 'Review an implementation plan before coding.'
user-invocable: true
---

# review-implementation-plan

## Description
Review an implementation plan before coding.

## Slice Product-Fit Review
For every Standard plan, verify that `slice-product-fit` ran and that the implementation plan preserved its decisions.

Check:
- The primary actor and secondary actors are explicit.
- The actor job-to-be-done and product outcome are stated in human/domain language.
- Concept ownership and boundaries are clear enough to avoid global/per-user/event/library confusion.
- Input methods, validation rules, defaults, and error states reduce resistance and prevent low-quality input.
- Shared vocabularies, libraries, and settings are controlled where consistency matters.
- AI/automation authority is explicit, including suggest/decide/persist/escalate boundaries.
- Cross-slice impacts and predecessor work are handled before coding.
- Evidence needed before confidence is present and testable.

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
- Does the plan define an artifact lifecycle: what is temporary, what is
  durable, where final truth will live, and what references must be cleaned up
  after completion?
- Were human attention items surfaced in chat with recommendations, including 70%+ recommended defaults when meaningful?
- Could an agent execute this without guessing?

## Principle guidance
- Use `engineering-principles-review` when the plan introduces patterns, abstractions, dependencies, or broad refactors.
- Line count estimates are only signals. The real concern is responsibility, cohesion, coupling, and abstraction level.
- Design patterns should simplify the plan, not decorate it.

## Product-fit hard gate
- Do not approve a Standard implementation plan that lacks slice-product-fit evidence or an explicit route downgrade to Tiny/Micro.
- Do not approve a plan that converts unresolved product-fit questions into hidden implementation assumptions.

## Chat attention review
Reject or revise a plan when decision-bearing questions are only stored in files. Every surfaced question must include:

```text
Question:
Recommendation:
Why this fits current evidence:
Tradeoff or risk:
Default action if approved or not corrected:
```

Confirm the plan separates:

- `Needs decision before work`: unresolved blockers or below-70% confidence questions.
- `Recommended default unless corrected`: 70%+ assumptions that are safe but meaningful.
- `Recorded for later`: non-blocking context.

Do not approve execution when `Needs decision before work` items remain unresolved unless the user explicitly accepts the risk.

## Hard gates
- Do not approve a plan for public or cross-boundary behavior without an approved contract spec or explicit documented exception.
- Do not approve a plan that contradicts the PRD, application model, approved technical approach, contract spec, AGENTS.md, or context-state.
- Do not approve a plan that lacks testable behavior or verification commands.
- Do not approve a plan that would create undocumented public/shared behavior without an explicit documentation exception.
- Do not approve a Standard plan that creates implementation plans,
  slice-specific contracts, or context docs without a cleanup/ownership path for
  those artifacts.
- Do not approve a plan whose core approach is over-abstracted, under-specified, or likely to produce tangled responsibilities.
- Do not approve a plan that introduces a new framework, runtime, service, database, production dependency, deployment model, or testing tool without `choose-technical-approach` approval.
- Do not approve a plan that introduces or depends on new quality automation, CI gates, scanners, build tooling, or verification commands without `choose-quality-automation` approval when the decision is meaningful.
- Do not approve a plan that introduces or depends on new RAG, embeddings, vector search, graph/index tooling, repo retrieval, hosted search, or Obsidian-style workflow without `choose-retrieval-approach` approval when the decision is meaningful.
- Do not approve a plan that invents, promotes, deprecates, or supersedes a project implementation pattern without `choose-implementation-pattern` or `update-implementation-patterns` when the decision is meaningful.
- Do not approve a plan that asks naked questions without recommendations.

## Loop behavior
If the plan is incomplete, return to plan, `choose-technical-approach`, `choose-quality-automation`, `choose-retrieval-approach`, `choose-implementation-pattern`, contract, issues, PRD, model, engineering-principles-review, or context-state.
