# Security Route Triggers

Purpose: move security from guidance-only into route selection and evidence requirements.

These triggers do not always replace the base route. They add a high-risk/security overlay to the route selected for the task.

## Trigger List

Escalate when task text, profile metadata, diff contents, or runtime actions involve:

- secrets or credentials,
- new dependency, package, plugin, connector, or tool install,
- external API call, webhook, network call, or third-party service,
- MCP/tool install or expanded tool permission,
- YouTrack/ticket MCP access to private ticket content, comments, attachments, users, or write-capable issue actions,
- database MCP access to non-public data, production/staging state, proprietary schemas, row-level data, or query results,
- credentialed write action such as push, publish, deploy, or production mutation,
- production repository or production-impacting release,
- cross-repo release order,
- generated runtime adapter, agent, or skill surface,
- prompt/tool injection risk from untrusted input or user content,
- broad file mutation or destructive command.

## Required Classification Effects

- Risk level: raise to High-risk when the trigger can affect secrets, production, users, data, supply chain, or irreversible state.
- Required gates: include consent gate before risky action.
- Threat model status: required when data, auth, external integration, dependency, tool, prompt injection, or production risk is present.
- Required verification: include the narrow deterministic check plus any security/supply-chain/contract check available.
- Evidence packet level: include the trigger, approval/cap status, and mitigation.

## Evidence Shape

```text
Security/tool triggers:
- 

Consent gates:
- 

Mitigations or caps:
- 
```

## Do Not Escalate Solely For

- local read-only inspection,
- existing dependency use with no version/config change,
- docs-only mentions of tools or credentials with no exposure or action,
- test-only fake secrets that are clearly synthetic and committed intentionally.
