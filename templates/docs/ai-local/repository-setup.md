# Repository AI Setup

Purpose: first-run and machine/runtime setup profile for the AI SDLC. Keep this file local unless the repository explicitly approves sharing a sanitized template.

## Repository
- Name:
- Path:
- Source host: GitHub / GitLab / CodeCommit / local-only / other
- Classification: personal / work / team / production
- Shared with other developers: yes / no / unknown
- Production-impacting repository: yes / no / unknown
- Primary language/framework:
- Source-of-truth docs location:

## Runtime And Environment
- Active runtime:
- Operating system:
- Shell:
- Command style notes:
- Docker/container support:
- Browser/rendered review support:
- Hardware/device dependencies:
- Network/external service restrictions:
- Work/personal data boundary:

## Agentic Asset Root
- Global `.agents` path:
- Branch/version:
- Skills path:
- Agent contracts path:
- Tools/templates path:
- Runtime adapter targets:
- Runtime adapter generation policy:

## Documentation Locality
- Durable project docs:
- Shared terminology:
- Agent-local working docs:
- Local scratch policy:
- Local scratch ignore location: `.git/info/exclude` / project `.gitignore` / none
- Sanitized evidence/docs path:
- Implementation history:
- External context root:
- Shared local context root:
- Product context:
- Repo context:
- Product context index:
- Repo context index:
- Service map:
- Workflow map:
- Release order:
- Known failure modes:
- Generated artifacts:
- Scratch scripts: .ai-local/sdlc-scratch/scripts/
- Scratch script TTL: 7 days by default; cleanup is dry-run unless `--apply` is used

## Capability Profile
- Install command:
- Dev server command:
- Test command:
- Build command:
- Lint/typecheck/format commands:
- Rendered UI review command/tool:
- Accessibility review policy: optional / suggested / required
- QA/manual validation path:
- CI/preflight command:
- Deployment/smoke validation:
- Known flaky/noisy checks:
- Checks not runnable on this machine:

## Tool And Data Boundaries
- Approved tools/MCPs:
- Blocked tools/MCPs:
- Sensitive data restrictions:
- Work/personal sync restrictions:
- External API/service call policy:
- Dependency install policy:
- Secrets handling policy:

## External Evidence Capabilities
- Ticket system provider:
- Ticket MCP availability: available / unavailable / blocked / unknown
- Ticket read issue/comments/attachments:
- Ticket write comments: approval required / blocked
- Ticket update fields/status/assignee: approval required / blocked
- Ticket sensitive data rules:
- Ticket fallback intake fields:
- Database evidence provider/context:
- Database MCP availability: available / unavailable / blocked / unknown
- Database environments allowed:
- Database allowed operations:
- Database blocked operations:
- Database sensitive schemas/tables/data classes:
- Database row limit/default aggregation:
- Database redaction rules:
- Database fallback evidence path:

## Quality Capability Notes
- Available quality rails:
- Missing but valuable rails:
- Known noisy/flaky checks:
- Proposed improvements:

## Bootstrap Decision
- Ready for SDLC task intake: yes / no / conditional
- Blocking setup gaps:
- Non-blocking setup gaps:
- Shared-file changes proposed:
- Human approvals needed:
- Last reviewed:

## Future YAML Fields
This Markdown file is the first source. A future `.ai-local/repo-setup.yaml` may mirror stable fields for automation.
