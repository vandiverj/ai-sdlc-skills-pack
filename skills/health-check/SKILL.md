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
- Known skipped checks and why.

## Rules
- Do not automatically fix code.
- Do not install dependencies without approval.
- Do not assume TypeScript, Node, pnpm, or any specific stack.
- Report command, result, exit code, and relevant output.
- If a useful check exists but was not run, explain why.
- If no project commands are documented, recommend `setup-agent-instructions` or documentation updates.

## Output
```text
Project command sources:
Commands run:
Passing checks:
Failing checks:
Skipped checks:
Security/dependency notes:
CI parity notes:
Recommended follow-up:
```