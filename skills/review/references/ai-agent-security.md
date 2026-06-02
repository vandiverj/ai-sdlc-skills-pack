# AI / Agent Security Review

Use when work touches LLMs, agents, MCPs, tool calls, retrieval/RAG, generated skills, runtime adapters, automation authority, external tools, or sensitive data.

## Template
- `.agents/templates/docs/security/ai-agent-security-checklist.md`

## Review Lenses
- Prompt/tool injection.
- Excessive agency.
- Tool overreach.
- Sensitive data leakage.
- Insecure output handling.
- Retrieval or memory poisoning.
- Cross-tenant or cross-repository context bleed.
- Skill/tool supply-chain risk.
- Dependency/license risk.
- Trace/log privacy.
- Ticket-system privacy and workflow-state changes when YouTrack or another tracker MCP is available.
- Read-only database privacy, environment drift, row-level exposure, and accidental trust in observed state as desired behavior.

## Hard Gates
- Human approval is required for new external tools, MCPs, dependencies, hosted services, broad credentials, destructive actions, or production-affecting automation.
- Do not allow model output to become code, SQL, shell, HTML, config, release action, or trusted decision without validation.
- Do not activate generated skills, agents, or runtime adapters without review of tool/write boundaries.
- Do not post ticket comments, update ticket status/fields, or use database row-level production evidence without explicit approval and redaction boundaries.

## Output
```text
AI/agent security scope:
Trust boundaries:
Risks:
Required mitigations:
Residual risk:
Human approval required:
Next skill:
```
