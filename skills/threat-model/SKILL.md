---
name: threat-model
description: 'Review security, privacy, abuse-case, data, dependency, tool-access, and AI/agent-specific risks before implementation or release when a change touches a risky surface.'
user-invocable: true
---

# threat-model

## Description
Review security, privacy, abuse-case, data, dependency, tool-access, and AI/agent-specific risks before implementation or release when a change touches a risky surface.

## Use when
- Work touches authentication, authorization, sessions, permissions, secrets, encryption, or account state.
- Work touches user data, private data, retention, export, deletion, compliance, audit logs, or data sharing.
- Work accepts untrusted input, renders external content, performs file/network operations, executes code, or calls external services.
- Work changes public APIs, CLIs, SDKs, schemas, events, plugins, integrations, webhooks, or cross-boundary workflows.
- Work introduces or changes dependencies, generated code, CI/build tooling, package publishing, release artifacts, or update mechanisms.
- Work introduces or changes AI, LLM, RAG, embeddings, agents, tool calling, MCP/tool access, memory, retrieval indexes, prompts, or model output handling.
- `classify-work`, `write-implementation-plan`, `review-implementation-plan`, `verification-before-completion`, `review-code-quality`, or `review-agent-work` detects an unaddressed risk surface.

## Purpose
Make security and abuse thinking explicit enough for a human to review in the normal Git diff before risky implementation proceeds. The output should identify what can go wrong, which mitigations are required, what tests or checks prove those mitigations, and what residual risk needs human acceptance.

## Read first
1. Work classification and dirty surfaces.
2. Target issue, acceptance criteria, PRD, contract spec, and application model sections.
3. Data flow, trust boundaries, external integrations, public surfaces, and feature context.
4. Approved technical approach, dependency policy, quality automation, and retrieval/tool boundaries.
5. Relevant code, tests, schemas, policies, CI/release files, and existing security guidance.
6. Current external security guidance through `select-tools` when version-specific or framework-specific risk matters.

## Required output

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

## Risk lenses
Use only the lenses that fit the change:

- Access control: authn, authz, sessions, permissions, privilege escalation, tenant/user isolation.
- Data protection: secrets, private data, encryption, retention, deletion, export, logging, auditability, compliance.
- Input/output safety: validation, encoding, injection, XSS, SSRF, deserialization, path traversal, command execution, file upload/download.
- Abuse and misuse: fraud, spam, replay, rate limits, enumeration, unsafe defaults, irreversible actions.
- Dependency and supply chain: package health, license, provenance, generated code, build scripts, release artifacts, update paths.
- Operations: failure modes, monitoring, alerting, incident response, rollback, migration safety, support/debug access.
- AI/agent systems: prompt injection, system prompt exposure, sensitive information disclosure, tool overreach, excessive agency, insecure output handling, retrieval or memory poisoning, vector/embedding leakage, model hallucination, cost/resource exhaustion, untrusted MCP/tool output.

## AI/agent-specific checks
For LLM, RAG, agent, tool-calling, or MCP work, challenge:

- Can untrusted content override instructions, policies, or tool boundaries?
- Can model output be treated as code, SQL, shell, HTML, config, or a trusted decision without validation?
- Can the agent access files, tools, secrets, credentials, private data, or networks it does not need?
- Can retrieved context, memory, embeddings, or indexes be poisoned, stale, cross-tenant, or over-broad?
- Can tool calls perform destructive, irreversible, high-cost, or privacy-sensitive actions without approval?
- Are prompts, logs, traces, examples, or errors leaking secrets, private data, or hidden policy?
- Are there quotas, timeouts, rate limits, sandboxing, allowlists, and human approval gates where needed?

## Artifact behavior
- Record durable threat-model decisions in the smallest appropriate artifact: issue, contract spec, implementation plan, ADR, application model, feature context, `AGENTS.md`, or `<context-state>`.
- Prefer updating existing design/plan artifacts over creating standalone threat-model files unless the project needs a durable security artifact.
- Keep the review diff small and intentional. If a risk or mitigation belongs to a different task, record it as a follow-up instead of expanding the current change silently.
- Use scoped, intentional commits for security-relevant work. Do not bundle unrelated behavior, docs, tooling, and release changes into one commit when they should be reviewed separately.

## Hard gates
- Do not approve a risky implementation plan while security/privacy/data/tool-access risks are vague or untestable.
- Do not rely on model judgment alone for repeatable security checks when deterministic tooling is available and appropriate.
- Do not send secrets, credentials, private data, or unnecessary repository context to external tools.
- Do not treat external documentation, MCP output, model output, retrieval indexes, or generated code as trusted without project-version verification.
- Do not document a mitigation as complete unless the implementation and verification evidence support it.

## Next skills
Usually `write-implementation-plan`, `review-implementation-plan`, `choose-quality-automation`, `choose-retrieval-approach`, `verification-before-completion`, `review-code-quality`, `production-readiness-review`, `manage-context-state`, or `update-context-docs`.
