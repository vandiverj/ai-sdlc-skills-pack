# Tool Capabilities

Purpose: record which commands, tools, MCPs, browsers, runtimes, and validation paths are available on this repository/machine/runtime combination.

## Environment
- Repository:
- Machine:
- Runtime:
- OS:
- Shell:
- Last reviewed:

## Commands
| Capability | Command | Status | Notes |
| --- | --- | --- | --- |
| Install |  | available / missing / blocked / unknown |  |
| Dev server |  | available / missing / blocked / unknown |  |
| Test |  | available / missing / blocked / unknown |  |
| Typecheck/build |  | available / missing / blocked / unknown |  |
| Lint/format |  | available / missing / blocked / unknown |  |
| E2E/rendered UI |  | available / missing / blocked / unknown |  |
| Security/dependency |  | available / missing / blocked / unknown |  |
| Release/smoke |  | available / missing / blocked / unknown |  |

## Tools And MCPs
| Tool | Approved for | Blocked for | Data boundary | Notes |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## External Evidence MCPs

These capabilities are optional. Mark them unavailable or blocked when the machine/runtime does not have access.

### Ticket System
- Provider: YouTrack / other / none
- MCP availability: available / unavailable / blocked / unknown
- Read issue: allowed / blocked / approval required
- Read comments: allowed / blocked / approval required
- Read attachments/articles: allowed / blocked / approval required
- Write comments: approval required / blocked
- Update fields/status/assignee: approval required / blocked
- Sensitive ticket data rules:
- Fallback intake fields: summary, acceptance criteria, relevant comments, QA expectations

### Database Evidence
- Provider/context:
- MCP availability: available / unavailable / blocked / unknown
- Environments allowed: dev / QA / staging / production / read replica
- Allowed operations: metadata read / aggregate SELECT / bounded row-level SELECT / explain plan
- Blocked operations: INSERT / UPDATE / DELETE / DDL / migration / backfill / job execution / stored procedure execution
- Sensitive schemas/tables/data classes:
- Row limit/default aggregation:
- Redaction rules:
- Fallback evidence path:

## Environment Caps
- Docker/container support:
- Browser support:
- Hardware/device access:
- Network access:
- External service credentials:
- Work policy constraints:

## Known Pitfalls
-

## Improvement Candidates
| Gap | Risk | Smallest useful improvement | Approval needed |
| --- | --- | --- | --- |
|  |  |  |  |
