# setup-agent-instructions

## Description
Create or update `AGENTS.md` so coding agents have concise, durable project instructions.

## Use when
- Starting a project that will be worked on by AI coding agents.
- Build, test, lint, security, or contribution instructions are scattered or missing.
- The agent repeatedly guesses commands or project conventions.
- Workflow rules should be shared across Codex, Claude Code, Cursor, Aider, or other agents.
- Code-local documentation conventions need to be visible to agents.

## Purpose
Give agents a predictable onboarding file without bloating human-facing README files or duplicating deeper project docs.

## Output artifact
Usually `AGENTS.md` at the repository root. In monorepos or large projects, nested `AGENTS.md` files may be appropriate for subprojects with different commands or conventions.

## Read first
1. `README.md`.
2. Existing `AGENTS.md`, if present.
3. `docs/ai-sdlc-workflow.md`, `WORKFLOW.md`, or local workflow docs.
4. `docs/memory-bank/contextIndex.md`, if present.
5. CI configuration.
6. Build/test/lint configuration.
7. Approved quality automation decisions, if present.
8. Approved retrieval approach, allowed sources, and privacy boundaries, if present.
9. Agent strategy docs, model-tier policy, delegation patterns, and runtime adapters, if present.
10. Implementation pattern docs and canonical examples, if present.
11. Package, workspace, Makefile, Justfile, Taskfile, or equivalent project command files.
12. Security, deployment, contribution, or documentation-generation docs if present.

## Recommended sections
- Project overview.
- Repository layout.
- Setup commands.
- Build, test, lint, typecheck, format, and health commands.
- Retrieval/index commands, allowed sources, freshness expectations, and privacy boundaries when applicable.
- Agent strategy and runtime adapter pointers, including where model-tier mappings and specialist roles live.
- Implementation pattern pointers, including where project-specific forms, tables, APIs, tests, errors, or feature-structure guidance lives.
- Testing guidance, including narrow test commands and broad verification commands.
- Code style and architecture conventions that agents cannot easily infer.
- Code-local documentation conventions, such as TSDoc/JSDoc/docstrings and what must be documented.
- Security, privacy, dependency, and network-use gotchas.
- Required workflow gates from the AI SDLC process.
- PR, commit, branch, or release instructions.
- Files or directories agents should avoid changing without approval.

## Rules
- Keep `AGENTS.md` concise and actionable.
- Link to deeper docs instead of copying them.
- Include concrete commands and expected success signals.
- Do not include personal preferences that should be local-only.
- Do not duplicate full PRDs, application models, contracts, feature context files, or ADRs.
- If instructions differ by subproject, prefer nested `AGENTS.md` files over one confusing root file.

## Next skills
Usually `select-context`, `health-check`, or `context-save`.
