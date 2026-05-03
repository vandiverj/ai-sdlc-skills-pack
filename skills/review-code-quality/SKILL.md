# review-code-quality

## Description
Review code quality, maintainability, operational risk, engineering principles, and code-local documentation after spec compliance passes.

## Checks
- Type safety or language-appropriate correctness checks.
- Appropriate deterministic tooling exists and was used for repeatable format, lint, type/schema, build, dependency, generated artifact, documentation, and CI/local preflight checks.
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
- Automation signal quality: checks are discoverable, relevant, not excessively flaky/noisy, and not substituting for spec review.
- Dependency usage, supply-chain risk, and license compatibility.
- Maintainability.
- Simplicity and YAGNI.
- DRY with judgment: avoid harmful duplication without creating premature abstractions.
- SOLID or equivalent boundary principles where relevant.
- Design pattern appropriateness: useful tool or unnecessary ceremony.
- Project implementation pattern fit: applicable `docs/patterns/*` guidance was followed or deviations are intentional.
- Pattern maturity: Standard/Validated guidance is respected, Emerging/Experimental guidance is bounded, and Deprecated/Superseded examples are not copied into new work.
- Security-sensitive behavior.
- Privacy, data lifecycle, retention, export, deletion, and compliance-sensitive handling.
- Secrets/configuration handling.
- Observability and debuggability: logs, metrics, traces, alerts, debug output, failure modes, or supportability where relevant.
- Performance implications and hot-path regressions.
- Migration, rollback, compatibility, feature flag, and rollout implications.
- Accessibility implications for UI/user workflows.
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
- Project patterns are preferred defaults, not universal laws; challenge them when requirements, frameworks, accessibility, security, performance, or maintainability change.
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
- Missing, stale, noisy, or ignored quality automation.
- Missing, stale, over-broad, or ignored implementation pattern guidance.
- Security/privacy/dependency risks.
- Operability and maintainability risks.
- Risks accepted or deferred.
