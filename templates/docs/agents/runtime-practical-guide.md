# Runtime Practical Guide

Purpose: keep the SDLC portable across VS Code extensions, terminal CLIs, and direct Codex sessions without changing the process contract.

## Common Rule

Use the same SDLC evidence commands everywhere. Runtime choice only changes how the agent is invoked and how local tools are available.

## Augment Extension

- Use `run-sdlc` from the chat panel for task routing and implementation.
- Keep the feature branch human-controlled.
- Ask for `sdlc workspace status` when multiple repositories are open in the VS Code workspace.
- Ask for `sdlc qa script --task "..."` before QA handoff so the output can be pasted into YouTrack.
- Ask for `sdlc git packet` at the end. Commit/push only after explicit human approval.

## Auggie CLI

- Run from the repository or workspace root when terminal access is more reliable than the editor extension.
- Start with `sdlc readiness`, `sdlc context restore`, and `sdlc run start --task "..."`.
- Use the same packets as Augment: touched, impact, verify, smoke, QA script, final gate, and git packet.
- Keep merge/deploy/release actions outside the CLI unless the human gives a project-specific process.

## Codex Direct

- Prefer repo-local commands and the SDLC helper CLI.
- Use rendered/browser verification when UI changes can be inspected locally.
- Record caps explicitly when the sandbox, missing services, or missing credentials prevent full verification.

## Terminal-Only Agent

- Generate evidence packets even when no browser or IDE context exists.
- Use manual smoke packets to document what could and could not be checked.
- Produce human-readable Markdown QA scripts; do not assume QA testers will use AI.
