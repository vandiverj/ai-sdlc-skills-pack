# Runtime Adapters

## Status
Draft / Active / Needs Review

## Purpose
Map the portable SDLC and agent strategy to the IDEs, extensions, CLIs, and agent runtimes used by this project.

## Source-of-truth rule
Portable files own the strategy:

- `AGENTS.md`
- `docs/ai-sdlc-workflow.md`
- `docs/agents/agent-strategy.md`
- `docs/agents/agent-catalog.md`
- `docs/agents/model-tier-policy.md`
- `docs/agents/delegation-patterns.md`
- `docs/agents/learning-loop.md`
- portable role definitions from the shared skills pack, when available

Runtime-specific files are adapters and should stay thin.

Adapters may translate model names, tool names, context-passing mechanics, permission syntax, and known runtime caps. They should not silently broaden repository boundaries, write access, Git authority, evidence requirements, stop conditions, or final judgment ownership.

## Runtimes

### Codex
- Adapter files:
  - `AGENTS.md`
  - `~/.codex/agents/*.toml` for reusable personal SDLC subagents
  - `.codex/agents/*.toml` only for repo-specific overrides or team-shared Codex agents
- Notes:
  - Use the portable SDLC skills and docs as source of truth.
  - Use Codex-native subagents for bounded read-only exploration, review, or verification only when the current Codex environment supports them.
  - Keep Codex custom-agent files thin adapters over portable roles such as `read-only-code-scout`.
  - For hosted lower-tier models, confirm the assigned scope is allowed to leave the local environment.
  - For LM Studio/local providers, prefer an adapter that inherits the parent Codex provider/model when the parent session is already local. Treat LM Studio-pinned custom agents as experimental until the current Codex surface can spawn them; use `codex exec --oss --local-provider lmstudio` for direct LM Studio scout runs.
  - Prefer prompt templates for role-separated phases before duplicating role text.

### Pi
- Adapter files:
  - prompt packets generated from portable roles and SDLC templates
- Notes:
  - Treat each prompt as a bounded adapter for the assigned phase.
  - Keep project prompts focused on the target repository and ordinary product/task intent.
  - State repository boundary, allowed tools, Git authority, required evidence, and caps.

### VS Code / Copilot
- Adapter files:
  - `.github/copilot-instructions.md`
  - `.github/instructions/*.instructions.md`
- Notes:
  - Keep instructions short and link to portable SDLC docs.
  - Map custom agents or subagents to roles from `agent-catalog.md` when supported.

### Augment
- Adapter files:
  - `.augment/agents/*.md`
- Notes:
  - Map Augment agents to portable roles and model tiers.
  - Keep tool allowlists and write access aligned with `delegation-patterns.md`.

### Claude Code
- Adapter files:
  - `.claude/agents/*.md`
- Notes:
  - Map project agents to portable roles and keep tool permissions narrow.

### Other tools
- Adapter files:
  - TBD
- Notes:
  - Document how the runtime reads instructions, chooses models, delegates, and restricts tools before adding files.

## Adapter checklist

```text
Runtime:
Portable role implemented:
Source role file:
Source prompt template:
Model tier mapping:
Tool permissions:
Write scope:
Forbidden actions:
Evidence expected:
Known runtime caps:
Owner:
Last reviewed:
```

## Model tier mappings

```text
deterministic:
fast:
standard:
deep:
consensus:
```

## Last updated
- Date:
- Updated because:
- Confidence:
