# choose-retrieval-approach

## Description
Choose, review, or revise whether a project needs an optional retrieval, indexing, graph, embedding, RAG, semantic search, or human knowledge-navigation layer, and if so define its scope, trust boundaries, freshness model, privacy constraints, source-of-truth rules, lifecycle usage, and tool choices.

## Use when
- Starting or scaling a project where code, docs, PRDs, contracts, ADRs, feature contexts, Memory Bank routing files, or domain knowledge may become too large or cross-cutting for reliable manual context selection.
- `select-context` repeatedly cannot identify the right artifacts with Memory Bank routing, durable docs, file names, and targeted search.
- A project needs local or hosted retrieval across source files, durable artifacts, external/domain docs, generated docs, multiple packages, or multiple related repositories.
- The user asks about adding RAG, embeddings, vector search, knowledge graphs, Graphify, Obsidian, semantic search, repo retrieval, or a knowledge base.
- `classify-work`, `select-tools`, `select-context`, `model-application`, `write-implementation-plan`, or `review-agent-work` detects context-selection failures, stale indexes, retrieval drift, privacy risk, or unclear retrieval ownership.

## Purpose
Decide whether retrieval infrastructure is worth its cost before adding it. Retrieval should help agents and humans find the authoritative artifacts to load; it must not become hidden memory or a competing source of truth.

## Read first
1. Work classification, context depth, and evidence of context-selection pain.
2. `docs/memory-bank/contextIndex.md`, `activeContext.md`, and `docs/context-state.md`, if present.
3. Existing application model, PRDs, contracts, ADRs, feature context files, AGENTS.md, README/developer docs, and repo layout.
4. Existing search/index/retrieval tooling, generated docs, Graphify outputs, Obsidian vault conventions, MCP/repo tools, or CI/indexing workflows.
5. Privacy, secrets, data retention, hosting, compliance, cost, and access constraints.
6. Current external docs through `select-tools` when version-specific retrieval tooling, licenses, security posture, or hosting behavior matters.

## Required output

```text
Retrieval decision needed:
Decision scope:
Inputs considered:
Context-selection pain:
Existing retrieval/indexing:
Source-of-truth boundaries:
Privacy and access constraints:
Options considered:
Recommended approach:
Retrieval shape:
Index/update cadence:
Allowed sources:
Disallowed sources:
Lifecycle usage:
Why:
Tradeoffs:
Risks and mitigations:
Rejected options:
Needs human approval:
Future reconsideration triggers:
Artifacts to update:
Next skill:
```

## Decision criteria
Add or expand retrieval only when there is evidence that it prevents likely expensive failure:

- Repo, docs, or domain knowledge are too large for reliable manual context selection.
- Many features, packages, contracts, ADRs, or workflows share concepts and dependencies.
- Agents repeatedly miss relevant artifacts or load too much context.
- Cross-repository, generated-doc, external-doc, or domain knowledge retrieval is genuinely needed.
- Humans need a navigation/search interface over durable artifacts.
- Current Memory Bank/context indexes are correct but insufficient.

Prefer no new retrieval layer when:

- `rg`, file names, Memory Bank indexes, feature contexts, and durable docs are enough.
- The project is small, early, or changing too quickly to keep an index fresh.
- Retrieval would become a second source of truth.
- The team cannot keep indexes updated.
- Privacy, secrets, cost, hosting, or access risks outweigh the benefit.
- The only justification is that RAG, embeddings, graphs, or Obsidian seem useful.

## Retrieval shapes
Choose the smallest useful shape:

- No retrieval layer: use Memory Bank, context index, feature contexts, file names, and targeted search.
- Local lexical search: `rg`, generated indexes, docs table of contents, or static search.
- Local graph/index: Graphify-like relationships between artifacts, concepts, modules, and decisions.
- Local embeddings/vector search: fuzzy semantic retrieval over approved local sources.
- Hybrid graph and embeddings: relationship traversal plus semantic retrieval for large or cross-cutting projects.
- MCP/repo retrieval: external tool-assisted retrieval with explicit access boundaries.
- Hosted retrieval/vector database: only when justified by scale, collaboration, or product needs.
- Human navigation layer: Obsidian or similar as an optional viewer over plain repo artifacts, not a required memory system.

## Source-of-truth rules
- Retrieval output is a pointer, not proof.
- Claims used for design, implementation, verification, or completion must trace back to code, tests, code-local docs, PRDs, contracts, ADRs, application model, feature context, AGENTS.md, context-state, or Memory Bank routing files.
- Generated indexes, graph reports, embeddings, vector stores, Obsidian backlinks, and MCP answers must not outrank authoritative artifacts.
- If retrieval exposes contradictions, stale docs, or missing links, update `docs/context-state.md` and route to the owning artifact.

## Approval behavior
Ask for human approval before accepting:

- New retrieval dependencies, vector databases, hosted services, MCP servers, indexing jobs, CI workflows, background sync, or cross-repo access.
- Indexing private user data, secrets, proprietary docs, production data, or external documents with unclear rights.
- Retrieval that changes agent workflow, completion evidence, privacy posture, cost, hosting, or developer setup.
- A human-facing tool requirement such as Obsidian if the repo would no longer remain plain-Markdown portable.

Do not require approval for using existing local `rg`, documented repo search, or already-approved local indexes within their documented boundaries.

## Artifact updates
After approval, route updates to the owning artifacts:

- `AGENTS.md` owns retrieval commands, allowed sources, privacy boundaries, and when agents may use retrieval.
- `docs/memory-bank/contextIndex.md` owns when to use retrieval and where indexes/reports live.
- `docs/context-state.md` owns stale indexes, deferred retrieval decisions, privacy concerns, and reconsideration triggers.
- `docs/decisions/` owns durable rationale when retrieval adds dependencies, services, hosted infrastructure, CI jobs, or major workflow changes.
- `docs/application-model.md` owns retrieval architecture only when retrieval is part of the application or development system model.
- `docs/knowledge-graph/` or equivalent owns generated retrieval reports when a graph/index tool is approved.
- `select-tools` owns per-task tool access boundaries.

## Lifecycle integration
- `classify-work` should mark `retrievalApproachChanged` when retrieval is missing, stale, changing, risky, or newly relevant.
- `select-context` should use retrieval only after Memory Bank routing, durable summaries, selected files, and targeted search are insufficient.
- `select-tools` should define access boundaries before external, hosted, or MCP retrieval is used.
- `graphify-index` and `graphify-query` are implementation options after this skill approves a graph/index approach.
- `write-implementation-plan` should include retrieval/index updates only when the task changes retrieval sources, commands, or freshness expectations.
- `verification-before-completion` should verify retrieval/index freshness only when retrieval surfaces changed or completion depends on them.

## Hard rules
- Do not add RAG, embeddings, graphs, hosted search, or Obsidian by default.
- Do not make optional retrieval mandatory for Micro/Tiny work or ordinary feature work.
- Do not index secrets, credentials, production data, private user data, or unnecessary repository context.
- Do not let retrieval summaries replace loading authoritative artifacts.
- Do not require a human interface like Obsidian for an AI-native workflow unless the human explicitly wants it.
- Do not choose Graphify, vector search, or any particular tool before proving a retrieval layer is needed.
- Do not claim retrieval freshness without current evidence.

## Next skills
Usually `select-context`, `select-tools`, `graphify-index`, `graphify-query`, `model-application`, `write-implementation-plan`, `manage-context-state`, `setup-agent-instructions`, or `update-context-docs`.
