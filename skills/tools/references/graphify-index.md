
# graphify-index

## Description
Optionally build or update a knowledge graph or retrieval index for larger projects.

## Purpose
Reduce repeated broad scanning when relationships between modules, docs, PRDs, features, Memory Bank routing files, and tasks become hard to track.

## Optional status
This skill is optional. It is a memory and context-management accelerator, not a required part of the core workflow.

## Use when
- tools retrieval-approach guidance has approved graph/index tooling or the user explicitly asks to evaluate it as an exploratory option.
- The repo has enough code/docs that repeated context loading is expensive.
- Features have cross-cutting dependencies.
- Memory Bank routing files are not enough to choose the right context packet.
- The agent repeatedly needs wide searches to answer relationship questions.
- You are returning to a large project after time away and durable docs are not enough.

## Behavior
- Build or update the graph using the selected graphing/indexing tool.
- Store generated files in a predictable location, such as `docs/knowledge-graph/`.
- Summarize key nodes, relationships, freshness, and limits in a human-readable report.
- Record graph location and freshness in `docs/context-state.md` or `docs/memory-bank/contextIndex.md`.

## Rules
- The graph is not a source of truth.
- Code, tests, application model, PRDs, ADRs, feature `context.md` files, context-state, and Memory Bank routing files take precedence.
- Do not choose Graphify merely because retrieval may help; use tools retrieval-approach guidance to decide whether graph/index tooling is the right shape.
- Do not make Graphify or any graph tool mandatory for small projects.
- Use graph output to decide what source files/docs to load next, not to replace loading them.

## Next skills
Usually context selection or graphify-query guidance.
