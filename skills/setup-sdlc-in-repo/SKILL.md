---
name: setup-sdlc-in-repo
description: 'Set up or refresh repository instructions and verification commands for AI-assisted development when onboarding is requested.'
user-invocable: true
---

# Set up repository guidance

Inspect the target repository's instructions, existing build/test commands, and actual runtimes. Preserve its product decisions, unrelated edits, and established documentation structure.

## Minimum setup

Create or update a concise `AGENTS.md` containing non-obvious constraints, exact relevant commands, generated/private paths, and links to necessary deeper guidance. Reuse existing commands, including native Xcode/Swift scripts where present. A repository does not need a copied SDLC manual or template tree.

Use an optional local profile only for command/context information that cannot be inferred reliably. Keep generated run evidence and scratch artifacts in an ignored location. Do not silently change Git identity or global configuration.

## Add only when needed

- Long-running work: an existing context-state document or compact checkpoint.
- Consequential decisions: a decision record in the repository's existing location.
- Repeated project-specific implementation constraints: a focused pattern reference.
- Configured specialist agents: the relevant runtime adapter, preserving user model selection and access boundaries.
- Shared multi-repository knowledge: approved retrieval settings with a direct-source fallback.
- Human QA: a tester-facing script for the relevant workflow.

Use `context/references/repository-bootstrap-template.md` for an explicitly requested expanded bootstrap, `agents/references/runtime-adapter-rules.md` for runtime mapping, and `quality/references/quality-automation.md` when verification commands need design. These paths are relative to the skills root. Read only the relevant reference.

## Verification and handoff

Check changed paths and instructions for conflicts. Run the documented narrow check when feasible; report unavailable tools. Validate instruction/skill discovery in a fresh session when runtime configuration changed. State what was installed, what remains optional, and the commands the next agent should use.

Proceed with authorized local setup. Ask only for missing authority before new dependencies, services, global configuration, or external actions. Do not turn an empty optional template field into a blocker.
