# AI / Agent Security Checklist

Use when work touches LLMs, agents, MCPs, tool calls, retrieval/RAG, generated skills, runtime adapters, automation authority, external tools, or sensitive data.

## Scope
- Feature/change:
- Work class:
- Data involved:
- Agents/tools involved:
- External services/MCPs:

## Trust Boundaries
- User input:
- Retrieved/indexed content:
- Tool outputs:
- File/network access:
- Secrets/credentials:
- Runtime adapters:

## Checks
| Risk | Check | Status | Notes |
| --- | --- | --- | --- |
| Prompt/tool injection | Untrusted content cannot override instructions or tool policy | pass / fail / n/a |  |
| Excessive agency | Destructive, costly, privacy-sensitive, or external actions require approval | pass / fail / n/a |  |
| Tool overreach | Tools are allowlisted and scoped to the task | pass / fail / n/a |  |
| Sensitive data leakage | Prompts, logs, traces, errors, and examples do not expose secrets/private data | pass / fail / n/a |  |
| Insecure output handling | Model output is validated before use as code/SQL/shell/HTML/config/decision | pass / fail / n/a |  |
| Retrieval poisoning | Index/source freshness, ownership, and trust are defined | pass / fail / n/a |  |
| Cross-tenant/context bleed | Context access is scoped to the intended repo/user/customer | pass / fail / n/a |  |
| Skill/tool supply chain | Skills, MCPs, scripts, packages, and adapters are reviewed before activation | pass / fail / n/a |  |
| Dependency/license | New dependencies are approved and license/security risk is known | pass / fail / n/a |  |
| Observability | Logs/traces support debugging without leaking sensitive data | pass / fail / n/a |  |

## Required Mitigations
-

## Residual Risk
-

## Approval
- Human approval required: yes / no
- Approver:
- Waiver/follow-up:
