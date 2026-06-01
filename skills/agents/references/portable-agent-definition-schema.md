# Portable Agent Definition Schema

Purpose: define the fields expected in `.agents/agents/*.md` specialized agent definitions.

This reference is owned by the `agents` router's strategy guidance. Load it when creating, reviewing, or updating a portable agent definition.

## Folder Rule

`agents/` contains Markdown files defining specialized agents.

Do not put generic strategy notes, route maps, schemas, or runtime-adapter notes directly in `agents/` unless the file itself defines an agent role. Supporting material belongs under the owning skill's `references/` folder or project documentation.

The portable definition is the source of truth for the role. Skill files decide when to invoke the role; runtime adapters translate the role for a specific tool.

## Required Sections

Each portable agent definition should include:

```text
# Agent: <Display Name>

## Purpose
## Use When
## Do Not Use When
## Default Access
## Required Context
## Workflow
## Output
## Hard Rules
```

## Recommended Fields

Use these concepts inside the sections above:

- role id or display name,
- purpose,
- when to use,
- when not to use,
- default model tier,
- escalation tier,
- allowed tools,
- disallowed tools,
- write access,
- repository boundary,
- required context,
- expected output,
- verification or evidence duties,
- escalation triggers,
- stop conditions,
- runtime adapter notes.

## Runtime Adapter Rule

Portable agent definitions are source material. Runtime adapters should stay thin and map the portable role into a specific environment:

```text
.pi/agents/*.md
.codex/agents/*.toml
.augment/agents/*.md
```

Runtime adapters may translate tool names, permission syntax, model names, and file format, but they must not silently broaden authority or become the hidden source of truth.

If an adapter needs a capability that is not present in the portable definition, update the portable definition first or record the adapter as a temporary compatibility exception.

## Review Checklist

Before adding or changing a portable agent definition, verify:

- The role has a distinct failure mode it prevents.
- A focused skill or deterministic command is not enough.
- Context and write boundaries are explicit.
- The output is reviewable by an orchestrator or human.
- Verification duties are stated when the role affects completion claims.
- Runtime-specific behavior is kept out unless clearly marked as adapter guidance.
- The definition gives the orchestrator enough evidence to decide whether the role completed, capped, or must be reviewed by another specialist.
