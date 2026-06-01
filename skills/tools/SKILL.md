---
name: tools
description: 'Router skill for tool selection, retrieval/RAG/graph decisions, indexing, querying, and tool trust boundaries.'
user-invocable: true
---

# tools

## Purpose
Select external tools and retrieval approaches with clear trust boundaries and freshness rules.

## Use When
- A task needs external tools, MCPs, connectors, retrieval, RAG, graph indexing, semantic search, or knowledge-navigation decisions.

## Reference Selection

| Trigger or surface | Load reference |
| --- | --- |
| Choose external tools, MCPs, connectors, or trust boundaries | `references/select-tools.md` |
| AI/MCP/connector/tool security, data boundary, or approval risk needs review | `references/ai-tool-security.md` |
| Decide whether retrieval/RAG/graph/indexing is justified | `references/retrieval-approach.md` |
| Build or update a graph/retrieval index | `references/graphify-index.md` |
| Query a graph/retrieval index | `references/graphify-query.md` |

## Handoffs
- Use `quality` for tool-result verification and evidence gaps.
- Use `review` for tool trust, security, or release concerns.
- Escalate to `run-sdlc` when tool choice adds dependencies, services, cost, privacy, or security risk.

## Required Output
```text
Tool task:
Tools selected:
Trust boundaries:
Freshness/privacy constraints:
Evidence required:
Next skill:
```

## Stop Rules
- Do not install, authenticate, call paid services, or change hosted infrastructure without approval.
- Do not treat external/tool output as source truth without verification against project artifacts.
