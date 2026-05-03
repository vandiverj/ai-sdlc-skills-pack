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

Runtime-specific files are adapters and should stay thin.

## Runtimes

### Codex
- Adapter files:
  - `AGENTS.md`
- Notes:
  - Use the portable SDLC skills and docs as source of truth.
  - Use model/delegation features only when the current Codex environment supports them.

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
