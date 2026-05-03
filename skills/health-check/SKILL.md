---
name: health-check
description: 'Run a read-only project quality dashboard using commands discovered from the project, not language assumptions.'
user-invocable: true
---

# health-check

## Description
Run a read-only project quality dashboard using commands discovered from the project, not language assumptions.

## Purpose
Surface broad project health without automatically changing files.

## Read first
1. `AGENTS.md`, if present.
2. README and developer docs.
3. CI configuration.
4. Package/build/test configuration.
5. Makefile, Justfile, Taskfile, scripts, or equivalent command runners.
6. Existing workflow docs or Memory Bank context index.
7. Approved quality automation decisions, if present.
8. Approved retrieval approach and index freshness expectations, if present.
9. Agent strategy docs, runtime adapters, and model-tier mappings, if present.
10. Implementation pattern docs, canonical examples, and pattern maturity, if present.

## Command discovery
Prefer project-declared commands over guesses. Look for:

- build
- test
- narrow test command for changed area
- lint
- typecheck / compile
- format check
- static analysis
- security or dependency audit
- dead-code or unused dependency checks
- docs/example validation
- retrieval/index freshness validation
- agent strategy/runtime adapter consistency validation
- implementation pattern consistency validation
- smoke or end-to-end checks

## Quality areas
- Build/compile health.
- Test health.
- Lint/format health.
- Type/schema/contract health where relevant.
- Dependency and license risk summary when tooling exists.
- Security/privacy checks when tooling exists.
- README/setup validity.
- CI parity: whether local checks match CI expectations.
- Agent runtime adapter consistency: whether IDE/tool-specific instructions point back to portable SDLC docs.
- Implementation pattern consistency: whether pattern docs exist, are not duplicating tooling, and point to current canonical examples.
- Known skipped checks and why.

## Rules
- Do not automatically fix code.
- Do not install dependencies without approval.
- Do not assume TypeScript, Node, pnpm, or any specific stack.
- Report command, result, exit code, and relevant output.
- If a useful check exists but was not run, explain why.
- If no project commands are documented, recommend `setup-agent-instructions` or documentation updates.
- If useful checks are missing, stale, noisy, or underused, recommend `choose-quality-automation` before adding tools ad hoc.
- If retrieval/index checks are missing, stale, risky, or underused, recommend `choose-retrieval-approach` before adding retrieval tools ad hoc.
- If agent strategy docs or runtime adapters are missing, stale, divergent, or over-broad, recommend `setup-sdlc-in-repo`, `choose-agent-strategy`, or `update-agent-definitions`.
- If implementation pattern docs are missing, stale, over-broad, or duplicating tooling, recommend `choose-implementation-pattern` or `update-implementation-patterns`.

## Output
```text
Project command sources:
Commands run:
Passing checks:
Failing checks:
Skipped checks:
Security/dependency notes:
CI parity notes:
Agent strategy/runtime adapter notes:
Implementation pattern notes:
Recommended follow-up:
```
