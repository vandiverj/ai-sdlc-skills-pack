---
name: select-context
description: 'Choose the smallest safe context packet before running another skill, implementing code, reviewing work, or debugging.'
user-invocable: true
---

# select-context

## Description
Choose the smallest safe context packet before running another skill, implementing code, reviewing work, or debugging.

## Use when
- Starting or resuming any non-trivial task.
- Moving from design to PRD, PRD to issues, issues to plan, plan to implementation, or implementation to review.
- The agent is tempted to scan the whole repository or rely on conversation memory.
- Prior context may be stale, contradictory, or too broad.
- External/current docs or MCP/tool access may be needed.

## Purpose
Keep the agent in the smart zone: enough context to act safely, not so much that the task becomes noisy or stale assumptions crowd out evidence.

## Inputs to check first
1. Work classification from `classify-work`, if available.
2. User request or current issue.
3. `engineering-context/index.md`, if present near the workspace.
4. Relevant files under `engineering-context/domains/`, `engineering-context/systems/`, `engineering-context/repos/`, and `engineering-context/operations/`.
5. `AGENTS.md`, if commands or conventions are needed.
6. `engineering-context/operations/sdlc/memory-bank/activeContext.md`, if present.
7. `engineering-context/operations/sdlc/memory-bank/contextIndex.md`, if present.
8. `engineering-context/operations/sdlc/context-state.md`, if present.
9. Relevant PRD, contract, application model section, ADR, or feature `context.md`, if the task names one.
10. Approved retrieval approach and index freshness, if present.
11. Agent strategy docs, model-tier policy, delegation patterns, and runtime adapter mappings if delegation/model routing matters.
12. Implementation pattern docs and canonical examples if repeated project-specific patterns may apply.
13. Tool/MCP needs from `select-tools`, if external/current knowledge is required.

For generic repositories without `engineering-context`, use the equivalent repo-local `docs/*` paths. In the `C:\WebSite` legacy environment, always report the durable context root and use `engineering-context` as the primary routing source.

Legacy context routing must identify domain candidates, confirmed repos, potential repos, missing context, initial risks, and Known / Believed / Unknown facts before moving to PRD, issue, or implementation planning.

## Required output

```text
Task:
Work class:
Current phase:
Next skill this packet supports:
Must load:
Useful if needed:
Do not load yet:
Memory Bank files used:
Authoritative artifacts needed:
Tools/MCPs needed:
Agent strategy context needed:
Implementation pattern context needed:
Open questions to check:
Risk of missing context:
Expansion trigger:
Reasoning:
```

## Context tiers

### Tier 0: Task and routing packet
Always include the current request, work class, issue, acceptance criteria, current phase, constraints, active context, context index entries, relevant tool boundaries, and relevant open questions.

### Tier 1: Durable summaries and indexes
Usually include relevant sections of `engineering-context/systems/**`, `engineering-context/domains/**`, `engineering-context/repos/**`, related PRD, contract spec, relevant feature `context.md`, related ADRs, `progress.md`, or `decisionIndex.md` when they are directly relevant. Use `docs/application-model.md` only when the project does not use `engineering-context`.

### Agent strategy context
Load only the relevant `engineering-context/operations/sdlc/agents/*` or fallback `docs/agents/*` files when delegation, specialist roles, model tiers, runtime adapters, or agent learning-loop behavior affects the task.

### Implementation pattern context
Load only the relevant `engineering-context/operations/sdlc/patterns/*` or fallback `docs/patterns/*` files and canonical examples when forms, tables, API handlers, data fetching, errors, tests, layouts, feature modules, or another repeated project-specific pattern affects the task.

### Tier 2: Source files
Load only files named by the implementation plan, files directly imported by those files, nearby tests, and files referenced by the feature context.

### Tier 3: External/current retrieval
Use tools/MCPs, such as Context7 or official docs, when project-local context is insufficient for current library/framework/API behavior. Attribute and verify retrieved information against the project version.

### Tier 4: Retrieval or graph query
Use optional retrieval, graph, embedding, repo search, or RAG tooling only when Memory Bank routing, durable summaries, selected files, targeted search, and targeted tool retrieval are insufficient to identify relationships. Prefer approved retrieval approaches and check freshness before relying on indexes.

### Tier 5: Wider repository or conversation scan
Use only when selected context is insufficient, stale, or contradictory. State why expansion is necessary before doing it.

## Hard rules
- Do not solve the task inside this skill. Select context and recommend the next skill.
- Do not treat Memory Bank files or MCP output as final source of truth. They route to authoritative artifacts.
- Do not treat retrieval, graph, embedding, RAG, or Obsidian-style navigation output as final source of truth. Use it to find source artifacts.
- Do not treat old conversation as source of truth when durable artifacts exist.
- Do not load all PRDs, all docs, all Memory Bank files, all tool output, or the whole repository by default.
- Do not load all agent strategy files by default; load only the role, model-tier, delegation, adapter, or learning-loop docs that affect the current task.
- Do not load all pattern docs by default; load only the patterns and examples that affect the current task.
- Do not trust a PRD, contract, issue, tool answer, or feature context without checking its status, source, version, and related open questions.
- If there is no application model or feature context for meaningful feature work, recommend creating or updating it before implementation.

## Anti-patterns
- Grepping the whole repository before checking work class, `activeContext.md`, `contextIndex.md`, `context-state.md`, and feature context.
- Loading every artifact because one artifact might be relevant.
- Calling external tools before checking local project artifacts.
- Duplicating requirements into Memory Bank files instead of linking to PRDs.
- Using optional graph or MCP data as authority instead of a pointer to source files and docs.
- Continuing with implementation when the context packet exposes an unresolved requirement.

## Next skills
- Use `classify-work` first if workflow depth is unclear.
- Use `select-tools` if external/current knowledge, MCP access, or tool boundaries are needed.
- Use `choose-retrieval-approach` if retrieval/indexing is missing, stale, risky, unnecessary, or newly needed.
- Use `choose-agent-strategy` if delegation, specialists, model tiers, independent verification, or runtime adapter behavior may affect the task.
- Use `choose-implementation-pattern` if repeated project-specific implementation guidance may apply.
- Use `context-restore` first if the project state is unknown.
- Use `manage-context-state` if unresolved questions or affected artifacts appear.
- Use `model-application`, `to-prd`, `write-contract-spec`, `write-implementation-plan`, `execute-plan`, or review skills depending on the current phase and work class.
