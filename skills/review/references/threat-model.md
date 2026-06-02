# Threat Model Review

Use when work touches auth, permissions, secrets, private data, retention, export, deletion, compliance, untrusted input, external content, file/network/code execution, public APIs, schemas, plugins, integrations, dependencies, generated code, CI/build/release, AI, LLMs, RAG, embeddings, agents, tool calling, MCP access, memory, retrieval indexes, prompts, or model output handling.

## Read First
- Work classification and dirty surfaces.
- Issue, PRD, contract, model, data flow, trust boundaries, external integrations, and feature context.
- Approved technical approach, dependency policy, quality automation, retrieval/tool boundaries, relevant code/tests/schemas/policies/CI.

## Risk Lenses
- Access control: authn, authz, sessions, permissions, privilege escalation, tenant/user isolation.
- Data protection: secrets, private data, encryption, retention, deletion, export, logging, auditability, compliance.
- Input/output safety: validation, encoding, injection, XSS, SSRF, deserialization, path traversal, command execution, file upload/download.
- Abuse and misuse: fraud, spam, replay, rate limits, enumeration, unsafe defaults, irreversible actions.
- Dependency and supply chain: package health, license, provenance, generated code, build scripts, release artifacts, update paths.
- Operations: failure modes, monitoring, alerting, incident response, rollback, migration safety, support/debug access.
- AI/agent systems: prompt injection, system prompt exposure, sensitive information disclosure, tool overreach, excessive agency, insecure output handling, retrieval or memory poisoning, vector/embedding leakage, hallucination, cost/resource exhaustion, untrusted tool output.
- External evidence MCPs: YouTrack/ticket privacy, ticket write authority, database environment boundary, read-only row-level exposure, query redaction, stale read replicas, and the distinction between observed database state and desired product behavior.

## Output
```text
Threat model status: Draft / Approved / Needs Review / Not Required
Scope:
Work class and risk surfaces:
Assets and data involved:
Actors and trust boundaries:
Entry points and outputs:
Abuse cases:
Security/privacy risks:
AI/agent/tool risks:
Dependency/supply-chain risks:
Required mitigations:
Security acceptance criteria:
Required tests/checks:
Residual risk:
Needs human approval:
Artifacts to update:
Next skill:
```
