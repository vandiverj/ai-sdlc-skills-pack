# review-code-quality

## Description
Review code quality, maintainability, operational risk, engineering principles, and code-local documentation after spec compliance passes.

## Checks
- Type safety or language-appropriate correctness checks.
- Story readability: can a maintainer follow the intent top-down?
- Intent-revealing names and domain language.
- Functions/modules/classes have cohesive responsibilities and clear reasons to change.
- Long units are reviewed for mixed responsibilities, mixed abstraction levels, or hidden side effects.
- Error handling.
- Validation.
- Module boundaries.
- Coupling and dependency direction.
- Separation of concerns.
- Level of abstraction consistency.
- Test quality and testability.
- Dependency usage.
- Maintainability.
- Simplicity and YAGNI.
- DRY with judgment: avoid harmful duplication without creating premature abstractions.
- SOLID or equivalent boundary principles where relevant.
- Design pattern appropriateness: useful tool or unnecessary ceremony.
- Security-sensitive behavior.
- Privacy and data handling.
- Secrets/configuration handling.
- Observability: logs, metrics, traces, debug output, or supportability where relevant.
- Performance implications.
- Migration, rollback, and compatibility implications.
- README/example accuracy when user-facing behavior changed.
- Public API, shared module, type/schema, CLI, integration, or non-obvious behavior has accurate code-local documentation.
- Comments explain purpose, contract, invariants, side effects, errors, examples, or "why"; they do not narrate obvious implementation.
- Inline docs do not contradict contracts, PRDs, feature context, or implementation.

## Principle guidance
- Use `engineering-principles-review` when a design or code diff needs deeper maintainability analysis.
- Line count is a smell, not a verdict.
- Readable code is not necessarily short code.
- DRY is a tradeoff, not a commandment.
- Patterns are options, not goals.
- Prefer local simplicity over architectural theater.

## Code-local documentation guidance
Use the project's native documentation style:

- TSDoc/JSDoc for TypeScript or JavaScript.
- Docstrings for Python, Ruby, Rust, Go, Java, C#, or other languages as appropriate.
- Generated API docs are useful only when generated from accurate source docs.

Document:
- public exports
- shared interfaces/types/schemas
- plugin/API/CLI/integration boundaries
- non-obvious domain behavior
- invariants and side effects
- error behavior and compatibility notes

Do not require comments for obvious private code.

## Output
- Pass/fail.
- High-priority fixes.
- Optional improvements.
- Engineering principle findings.
- Missing or stale code-local docs.
- Security/privacy/dependency risks.
- Operability and maintainability risks.
- Risks accepted or deferred.