---
name: implementation
description: 'Router skill for coding phases: diagnosis, safe edit boundary, execution, TDD, technical approach, and implementation pattern selection.'
user-invocable: true
---

# implementation

## Purpose
Route coding work to the smallest safe implementation stack. This is the umbrella for coder/implementer behavior underneath `run-sdlc`.

## Use When
- `run-sdlc` determines the current phase is implementation.
- A bugfix needs diagnosis before edits.
- A plan needs execution with a safe edit boundary.
- TDD, project implementation patterns, or technical approach decisions matter.

## Behavior
1. Confirm the work class, target outcome, relevant connected impact, current plan when one is needed, and available proof.
2. Select the minimal implementation references from `references/`.
3. Set or confirm the safe edit boundary before modifying files.
4. Execute in small reviewable increments, using TDD when behavior is testable and risk warrants it. Follow the affected behavior beyond the named file when evidence shows a connected path.
5. Hand off to `review` and verification after edits.

## Reference Selection

| Trigger or surface | Load reference |
| --- | --- |
| Broken behavior, unknown root cause, failing tests, regression, environment mismatch | `references/diagnose.md` |
| Any code/doc edit with scoped files, commands, or dirty worktree risk | `references/safe-edit-boundary.md` |
| Approved plan ready for coding | `references/execute-plan.md` |
| Behavior can be specified through failing tests or regression coverage | `references/tdd.md` |
| Architecture, dependency, persistence, runtime, deployment, or stack choice changes | `references/technical-approach.md` |
| Forms, tables, API handlers, data fetching, errors, tests, layouts, feature modules, or local project patterns | `references/implementation-patterns.md` |

## Handoffs
- Use `review` for spec compliance, code quality, design, threat, agent-work, and release reviews.
- Use `quality` for deterministic checks and evidence.
- Escalate back to `run-sdlc` when scope, risk, or consent gates change.

## Required Output
```text
Implementation scope:
Work class and dirty surfaces:
References selected:
Safe edit boundary:
Commands allowed:
Files likely touched:
Verification expectation:
Outcome, connected impact, and proof:
Review handoff:
Stop condition:
```

## Stop Rules
- Resolve a material uncertainty about expected behavior, scope, or authority before dependent edits. A separate approved plan is unnecessary when the requested change and proof are already clear.
- Stop before behavior edits only when the intended outcome or a material connected impact is unclear enough to change the implementation.
- Stop if diagnosis changes the work class or exposes protected surfaces.
- Stop if implementation needs new dependencies, migrations, secrets, external services, destructive commands, or public contract changes without approval.
