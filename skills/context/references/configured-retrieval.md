## Curated Knowledge Retrieval

When an approved context MCP is available, use it first for cross-repo
engineering knowledge:

- Search with `search_knowledge` before manually scanning a local
  engineering-context checkout.
- Load specific docs with `get_context_doc` when a context id or path is known.
- Use `list_context_by_repo` or `list_context_by_domain` to find relevant
  curated context before broader repository search.

Treat MCP results as pointers to curated source artifacts, not hidden memory.
The Git-versioned engineering-context repository remains the editable curated
source. If MCP is unavailable or stale, fall back to configured local context
roots and record the freshness cap.

When a task pack is retrieved with `get_task_context`, record the returned
`pack_ref` in the run state alongside the packet. It is the only handle that
links a later outcome back to the retrieval that produced it, and the phase that
retrieves context is rarely the phase that finishes the work — an unrecorded
`pack_ref` cannot be recovered afterward. Reporting the outcome is
`run-sdlc/references/outcome-reporting.md`.

Propose new durable facts through the context/knowledge candidate flow when
available. Apply existing user authorization when updating curated context; ask only when the configured review boundary requires additional authority.

