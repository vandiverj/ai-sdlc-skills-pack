# Code Quality Review

Use after spec compliance passes, or when reviewing maintainability, operational risk, engineering principles, tests, code-local docs, dependencies, or implementation quality.

## Checks
- Language-appropriate correctness, type, lint, build, format, schema, dependency, generated artifact, docs, and CI/local preflight checks.
- Story readability, intent-revealing names, cohesive responsibilities, module boundaries, coupling, dependency direction, and abstraction level consistency.
- Error handling, validation, test quality, testability, and failure modes.
- Dependency usage, supply-chain risk, and license compatibility.
- Security-sensitive behavior, privacy/data lifecycle, secrets/configuration handling.
- Observability, debuggability, logs, metrics, traces, alerts, debug output, and supportability where relevant.
- Performance, hot-path regressions, migration, rollback, compatibility, rollout, and accessibility implications.
- Public API, shared module, type/schema, CLI, integration, or non-obvious behavior has accurate code-local documentation.
- Comments explain purpose, contract, invariants, side effects, errors, examples, or "why"; they do not narrate obvious code.

## Principle Guidance
- Line count is a smell, not a verdict.
- Readable code is not necessarily short code.
- DRY is a tradeoff, not a commandment.
- Patterns are options, not goals.
- Prefer local simplicity over architectural theater.

## Output
- Pass/fail.
- High-priority fixes.
- Optional improvements.
- Engineering principle findings.
- Missing or stale code-local docs.
- Missing, stale, noisy, or ignored quality automation.
- Missing, stale, over-broad, or ignored implementation pattern guidance.
