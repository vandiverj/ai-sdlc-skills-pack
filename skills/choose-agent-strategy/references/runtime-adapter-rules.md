# Runtime Adapter Rules

Purpose: define how to translate portable agent definitions into runtime-specific files without making those adapters the source of truth.

This reference is owned by `choose-agent-strategy`. Load it when a project wants Codex, Pi, Copilot, Augment, Claude Code, or another runtime to use specialized agents or role-separated phases.

## Source Of Truth

Portable source files own the role behavior:

```text
.agents/agents/*.md
skills/choose-agent-strategy/references/portable-agent-definition-schema.md
templates/prompts/sdlc/*.md
project docs/agents/*.md, when installed downstream
```

Runtime adapters translate those files into a tool-specific format. They do not invent policy.

## Adapter Shape

Each adapter should state:

```text
Runtime:
Portable role implemented:
Source role file:
Source prompt template, if any:
Model tier mapping:
Tool permissions:
Write scope:
Forbidden actions:
Evidence expected:
Known runtime caps:
Owner:
Last reviewed:
```

Keep the adapter short enough that future policy updates happen in the portable role or project agent docs.

## Supported Translation

Adapters may translate:

- model-tier names into runtime model names,
- tool names into runtime command or MCP names,
- file format and frontmatter,
- runtime-specific permission syntax,
- how the runtime receives context packets,
- known tool caps such as no browser access, no shell access, or no commit authority.

Adapters may not silently change:

- repository boundaries,
- write access,
- Git authority,
- evidence requirements,
- stop conditions,
- role purpose,
- who owns final judgment.

If the runtime needs a broader authority than the portable role allows, update the portable definition through `update-agent-definitions` or record a temporary compatibility exception.

## Runtime Notes

### Codex

- Prefer portable skills and prompt templates directly.
- Use `AGENTS.md` for project-local instructions and discovery.
- Do not duplicate full role definitions inside project instructions unless the runtime cannot access the portable source.

### Pi

- Treat Pi prompts as runtime adapters for the assigned phase.
- Keep fixture/project prompts normal: do not expose skill-pack testing context unless Pi is explicitly testing the workflow itself.
- Constrain repository boundaries and Git authority in every prompt.

### Copilot / VS Code

- Use concise instruction files that link to portable docs.
- Map roles only when the project actually uses Copilot customization for agent behavior.

### Augment / Claude Code / Other Agent Runtimes

- Create runtime-specific agent files only for roles the project will use.
- Keep each file derived from one portable role unless the runtime forces a combined role.
- Record unsupported capabilities as caps instead of adding hidden assumptions.

## Review Checklist

Before adding or updating an adapter, verify:

- The project actually uses that runtime.
- The adapter points to the portable role or project docs it implements.
- Tool permissions and write scope are no broader than the portable role.
- Model mappings use abstract tiers where possible.
- Known runtime caps are explicit.
- The adapter does not duplicate large SDLC policy that belongs in skills or docs.
- A reviewer can tell what changed by reading a small diff.
