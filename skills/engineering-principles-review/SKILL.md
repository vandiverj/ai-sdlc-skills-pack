# engineering-principles-review

## Description
Review a design, plan, refactor, or implementation using durable engineering principles as judgment lenses.

## Use when
- Reviewing a design, application model, implementation plan, refactor plan, or code diff.
- A module feels hard to read, too long, too coupled, or too clever.
- The agent is about to introduce an abstraction, dependency, framework, pattern, or broad refactor.
- `review-code-quality`, `review-implementation-plan`, `outside-voice-review`, or `decision-brief` needs deeper maintainability analysis.

## Purpose
Improve long-term maintainability by challenging assumptions, clarifying responsibilities, and keeping code understandable to future maintainers.

Principles are review lenses, not slogans. Use them to expose tradeoffs, not to enforce dogma.

## Review lenses
- First principles: what problem is this solving, and what must be true for the solution to work?
- Assumption challenge: what is being taken for granted?
- Story readability: can a maintainer follow the intent top-down as a coherent story?
- Intent-revealing names: do names explain purpose in domain language?
- Single responsibility: does each unit have one main reason to change?
- Cohesion: do related behaviors live together?
- Coupling: are dependencies minimal, explicit, and pointed in the right direction?
- Level of abstraction: does one function/module mix orchestration, validation, formatting, persistence, network calls, and UI concerns?
- Simplicity and YAGNI: is this the simplest design that handles the known requirements?
- DRY with judgment: is duplication harmful, or would abstraction be premature?
- SOLID where relevant: do boundaries and dependencies support safe change?
- Design patterns as tools: does a pattern simplify a recurring structure, or add ceremony?
- Information hiding: are implementation details hidden behind clear boundaries?
- Testability: can behavior be verified without brittle setup?
- Error behavior: are failure modes explicit and understandable?
- Changeability: can the next likely change be made safely?

## Heuristics, not laws
- Line count is a smell, not a verdict.
- Long code is a problem when it mixes responsibilities, abstraction levels, or reasons to change.
- Readable code is not necessarily short code.
- DRY is a tradeoff, not a commandment.
- SOLID is useful when it improves boundaries; it is overkill when it adds needless indirection.
- Design patterns are options, not goals.
- Clever code must earn its keep with measurable simplicity, performance, or safety.

## Output
- Principle findings.
- Assumptions challenged.
- Responsibility or abstraction problems.
- Duplication or premature abstraction risks.
- Pattern/dependency tradeoffs.
- Refactor recommendations.
- Risks to accept, defer, or fix now.
- Impact on plan, code, tests, docs, or context-state.

## Hard rules
- Do not demand refactors unrelated to the current work unless they block safe completion.
- Do not apply principles mechanically.
- Do not use line count alone as a failure reason.
- Do not introduce patterns only because they are familiar.
- If a principle conflict exists, state the tradeoff and recommend the pragmatic choice.

## Next skills
Usually return to the invoking review skill, `decision-brief`, `write-implementation-plan`, `review-code-quality`, or `process-review-feedback`.