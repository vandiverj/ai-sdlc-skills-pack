# AirteraCode Feedback Loop Guide

Status: operational guidance
Audience: agents maintaining or reviewing the AirteraCode context engine and SDLC skills pack

## Purpose

AirteraCode has two feedback loops. They share the MCP service boundary, but they do not have the same purpose, schema, review queue, or promotion path. Do not treat a clean result in one loop as evidence that the other loop has no feedback.

## Loop Selection

Use this decision table before checking or submitting feedback.

| Situation | Tool or table | Purpose |
| --- | --- | --- |
| Context engine missed files, returned stale slices, ranked poor context, had retrieval gaps, parser/indexer behavior was wrong, or a context-engine tool result helped/hurt the task | `feedback` MCP tool, `outcome_feedback` Postgres table | Improve the AirteraCode MCP context engine, parsing, indexing, retrieval, and tool behavior. |
| SDLC route was too heavy/light, verification gates were confusing, subagent handoff helped/hurt, process friction appeared, or model/runtime choices need later process review | `sdlc_feedback` MCP tool, `sdlc_feedback` Postgres table, local JSONL fallback only when MCP is unavailable | Improve the reusable SDLC workflow, routing, verification, agent strategy, and model/runtime guidance. |

## Standard MCP Context-Engine Feedback

Primary MCP tool:

```text
mcp__airteracode.feedback
```

Allowed kinds:

```text
outcome
agent_diff
test_result
missing_context
```

Primary Postgres tables:

```text
outcome_feedback
feedback_issue
feedback_issue_link
feedback_disposition_event
```

Review model:

- `outcome_feedback` is the raw standard MCP/context-engine feedback inbox.
- `feedback_issue` is the reviewed, deduplicated improvement issue.
- `feedback_issue_link` links reviewed issues back to raw feedback rows.
- An `outcome_feedback` row with no `feedback_issue_link` is unreviewed standard MCP feedback.
- `feedback_issue.status` tracks disposition such as accepted, deferred, implemented, or verified.

Use standard MCP feedback for context-engine improvements, not SDLC process tuning.

## SDLC Process Feedback

Primary MCP tool:

```text
mcp__airteracode.sdlc_feedback
```

Review MCP tool:

```text
mcp__airteracode.list_sdlc_feedback
```

Primary Postgres table:

```text
sdlc_feedback
```

Local fallback when MCP is unavailable:

```text
.ai-local/sdlc-cache/sdlc-feedback.jsonl
```

Review model:

- `sdlc_feedback` stores sanitized SDLC process events for later process-learning review.
- `list_sdlc_feedback` is the first review path when the MCP exposes it.
- The JSONL file is only a portable fallback/export bridge. It is not proof that MCP/Postgres has those rows.
- A clean `list_sdlc_feedback` result says nothing about standard MCP feedback in `outcome_feedback`.

Use SDLC feedback for workflow improvements, not context-engine parser/retrieval defects.

## Checking Feedback State

Prefer MCP list tools when available. Query Postgres when:

- the user explicitly asks for backing-store truth,
- the relevant MCP list tool is not exposed,
- MCP results appear inconsistent with expected persistence,
- or review needs raw lifecycle linkage across tables.

Run read-only queries from the context-engine repo:

```bash
cd /Users/jerrickvandiver/context-engine
podman-compose exec -T db psql -v ON_ERROR_STOP=1 -U ctx -d ctx
```

Count both loops:

```sql
SELECT 'outcome_feedback' AS table_name, count(*) FROM outcome_feedback
UNION ALL SELECT 'feedback_issue', count(*) FROM feedback_issue
UNION ALL SELECT 'feedback_issue_link', count(*) FROM feedback_issue_link
UNION ALL SELECT 'sdlc_feedback', count(*) FROM sdlc_feedback
UNION ALL SELECT 'knowledge_candidate', count(*) FROM knowledge_candidate;
```

Summarize unreviewed standard MCP feedback without dumping raw notes:

```sql
SELECT
  of.feedback_kind,
  count(*) AS total,
  count(*) FILTER (WHERE fil.outcome_feedback_id IS NULL) AS unlinked,
  min(of.reported_at) FILTER (WHERE fil.outcome_feedback_id IS NULL) AS oldest_unlinked,
  max(of.reported_at) FILTER (WHERE fil.outcome_feedback_id IS NULL) AS newest_unlinked
FROM outcome_feedback of
LEFT JOIN feedback_issue_link fil ON fil.outcome_feedback_id = of.id
GROUP BY of.feedback_kind
ORDER BY of.feedback_kind;
```

List recent standard MCP feedback review state without note payloads:

```sql
SELECT
  of.id,
  of.reported_at,
  of.client_id,
  of.feedback_kind,
  of.success,
  COALESCE(array_length(of.items_missing, 1), 0) AS missing_count,
  COALESCE(array_length(of.items_used, 1), 0) AS used_count,
  CASE WHEN fil.outcome_feedback_id IS NULL THEN 'unlinked' ELSE 'linked' END AS review_link
FROM outcome_feedback of
LEFT JOIN feedback_issue_link fil ON fil.outcome_feedback_id = of.id
ORDER BY of.reported_at DESC, of.id DESC
LIMIT 30;
```

List reviewed standard MCP issues:

```sql
SELECT
  fi.id,
  fi.issue_key,
  fi.category,
  fi.status,
  fi.priority,
  fi.owner,
  fi.first_seen_at,
  fi.last_seen_at,
  count(fil.outcome_feedback_id) AS linked_feedback,
  fi.implemented_commit,
  fi.verified_at
FROM feedback_issue fi
LEFT JOIN feedback_issue_link fil ON fil.feedback_issue_id = fi.id
GROUP BY fi.id
ORDER BY fi.updated_at DESC;
```

Use the lifecycle helper for a fuller standard MCP feedback report:

```bash
PYTHONPATH=ctx-indexer:. .venv/bin/python -m indexer.feedback_lifecycle --database ctx report
```

## Safety Rules

- Do not read or print token files to discover database access.
- Do not dump raw `notes` unless the user explicitly asks and the content is sanitized enough to share.
- Do not store raw source, raw diffs, ticket text, database output, secrets, customer data, or full prompts in either loop.
- Treat Postgres query results as operational evidence, not durable source-of-truth documentation until reviewed and promoted.
- Keep MCP/context-engine fixes in the context-engine lifecycle. Keep SDLC workflow fixes in process-learning and the skills pack lifecycle.

## Common Failure Mode

Wrong path:

```text
User asks whether the context engine has new feedback.
Agent calls list_sdlc_feedback only.
Agent concludes there is no feedback.
```

Correct path:

```text
Ask which loop is meant, or check both when ambiguous.
For SDLC workflow feedback, use list_sdlc_feedback and the sdlc_feedback table.
For context-engine feedback, inspect outcome_feedback and feedback_issue linkage.
Report the two results separately.
```
