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
  - For a frontier-only SDLC roster, install `templates/adapters/codex/sdlc-*.toml` into `~/.codex/agents/` with `sdlc agents install-codex --frontier`.
  - Restart or reload Codex after installing new custom-agent files before validating runtime discovery.
  - Codex custom agents inherit the MCPs exposed by the current developer environment. Treat adapter MCP text as policy guidance, not a hard access-control boundary.
  - Parent prompts must state the repository, safe-edit boundary, allowed MCP/tool scope, and Git authority for each spawned agent.
  - Agents return sanitized SDLC feedback drafts; the parent orchestrator submits through AirteraCode MCP or local fallback.
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
  - `~/.augment/agents/*.md` for reusable personal SDLC subagents
  - `.augment/agents/*.md`
- Notes:
  - Map Augment agents to portable roles and model tiers.
  - Install the shared SDLC Auggie roster with `sdlc agents install-auggie`; this defaults to user-level `~/.augment/agents`.
  - Leave subagent `model` unset when `auggie models list` reports only the default model. Use `sdlc agents install-auggie --model-profile frontier-gpt` only after the local Auggie registry confirms the configured GPT IDs are available.
  - Recommended frontier GPT tier mapping when available:
    - `fast`: `gpt-5.1`
    - `standard-light`: `gpt-5.2`
    - `standard`: `gpt-5.4`
    - `deep`: `gpt-5.5`
    - `consensus`: independent `standard`/`deep` reviewers selected by risk
  - Keep tool allowlists and write access aligned with `delegation-patterns.md`.
  - Parent prompts must state the repository, safe-edit boundary, allowed MCP/tool scope, and Git authority for each spawned agent.
  - Agents return sanitized SDLC feedback drafts; the parent orchestrator submits through AirteraCode MCP or local fallback.

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
