# Scenario: YouTrack Ticket Evidence

Validate that SDLC can use ticket-system evidence when available while preserving fallback behavior for developers without YouTrack MCP access.

Expected route:
standard with `ticket-evidence` recipe overlay.

Expected behavior:

- Detect YouTrack/ticket task language.
- If MCP access is available and allowed, gather title, summary, acceptance criteria, relevant comments, linked issues, and allowed attachments/articles.
- If MCP access is unavailable, ask for pasted issue summary, acceptance criteria, relevant comments, and QA expectations.
- Treat ticket text as scope/acceptance input, not as stronger proof than source code, tests, logs, or current behavior.
- Run a ticket drift check before closeout when ticket MCP is available.
- Generate human QA Markdown from acceptance criteria.
- Preview any ticket comment/status update and wait for explicit human approval before posting or changing fields.

Failure examples:

- The agent requires YouTrack MCP before proceeding.
- The agent posts a ticket update without approval.
- The agent stores raw ticket text or private comments in shared `.agents/learnings`.
- The agent ignores changed acceptance criteria discovered before closeout.

