
# graphify-query

## Description
Optionally query a knowledge graph or retrieval index when selected context is insufficient.

## Purpose
Find relationships without loading the whole repo, then point the agent toward the source files and docs that should be loaded next.

## Optional status
This skill is optional. It supports memory and context management for larger projects; it is not required for the core SDLC workflow.

## Use when
- tools retrieval-approach guidance has approved graph/index querying or the user explicitly asks to evaluate it as an exploratory option.
- Feature dependencies are unclear.
- You need to check impact across modules or docs.
- Selected context contradicts code.
- A change may affect multiple features.
- context selection needs help choosing the next source files or artifacts.
- `docs/memory-bank/contextIndex.md` is too sparse or stale to route the task.

## Example questions
- What features depend on this module?
- What modules touch this entity?
- What docs mention this validation strategy?
- What connects this workflow to persistence?
- Which PRDs, ADRs, feature contexts, or Memory Bank routing files mention this behavior?

## Output
- Query asked.
- Relevant nodes and relationships.
- Confidence.
- Source files/docs to load next.
- Any context-state or contextIndex updates needed.

## Rules
- Do not treat graph answers as authoritative.
- Do not continue from graph output alone when correctness matters. Load the cited source artifacts.
- Do not use graph querying as a default context step for small or ordinary work.
- If graph output exposes stale docs, stale Memory Bank routing, or contradictory relationships, mark affected artifacts in `docs/context-state.md`.

## Next skills
Usually context selection, context state/docs guidance, or the skill that needed the relationship answer.
