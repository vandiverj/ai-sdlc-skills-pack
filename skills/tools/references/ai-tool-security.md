# AI Tool Security Boundaries

Use when choosing or approving MCPs, connectors, hosted tools, local agents, retrieval indexes, generated adapters, or any external tool that may receive code, prompts, logs, private data, or credentials.

## Checks
- What data leaves the repository/machine?
- Is the tool approved for personal, work, team, or production data?
- Does the tool store, index, train on, or forward data?
- What credentials or file/network access can it use?
- What actions can it perform without human approval?
- How will outputs be verified against project artifacts?
- What is the rollback/disable path?
- For ticket systems: can it read private comments, attachments, users, projects, or write comments/status/fields?
- For database tools: which environments, schemas, operations, row limits, and redaction rules apply?

## Output
```text
Tool:
Data boundary:
Allowed use:
Blocked use:
Approval needed:
Verification required:
Disable/rollback path:
```

For YouTrack/ticket MCPs and read-only database MCPs, also include:

```text
External evidence security:
Tool:
Data boundary:
Access mode:
Allowed use:
Blocked use:
Approval needed:
Redaction required:
Verification required:
Disable/rollback path:
```
