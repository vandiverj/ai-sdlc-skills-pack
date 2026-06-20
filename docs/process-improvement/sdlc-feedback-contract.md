# SDLC Feedback Contract

Status: v1 local contract
Schema: `airtera.sdlc.feedback.v1`
Primary tool name: `sdlc_feedback`
Local fallback: `.ai-local/sdlc-cache/sdlc-feedback.jsonl`

## Purpose

Capture passive, sanitized SDLC improvement signals from real agent work so the process can improve over time without asking developers to run research tasks.

This is not a command transcript, code archive, ticket mirror, or product telemetry stream. It records process signals that later process-learning review can aggregate and promote deliberately.

## Allowed Content

- repository identifier or path hint
- task summary
- route/work classification and route fit
- source pointers, such as file paths or artifact paths
- checks run and verification caps
- evidence gaps
- friction and human corrections
- agent missed steps
- suggested process action
- branch, commit, dirty flag
- runtime and model tier labels

## Disallowed Content

- raw source code
- raw diffs or patches
- raw logs
- raw ticket text or comments
- database output or records
- secrets, credentials, tokens, or customer data
- full prompts, full chat transcripts, or copied private conversations

The event must set `rawContentIncluded` to `false`. Validators must reject events that set it to `true` or include known raw-content fields.

## Event Shape

```json
{
  "schemaVersion": "airtera.sdlc.feedback.v1",
  "eventType": "task-completion",
  "timestamp": "2026-06-20T00:00:00.000Z",
  "repoId": "www_dev",
  "repoPathHint": "www_dev",
  "taskSummary": "extract one safe repeated code pattern",
  "workClass": "standard",
  "routeUsed": "standard",
  "routeFit": "right-sized",
  "sensitivity": "internal",
  "rawContentIncluded": false,
  "sourcePointers": [
    {
      "kind": "path",
      "pointer": "fingerprint_client_emp_expanded.asp"
    }
  ],
  "evidence": {
    "checksRun": [
      "git diff --check"
    ],
    "caps": [
      "no runnable ASP test harness"
    ],
    "evidenceGaps": [
      "manual ASP verification required"
    ]
  },
  "signals": {
    "friction": [
      "manual verification planning"
    ],
    "humanCorrections": [],
    "agentMissedSteps": []
  },
  "suggestedAction": "review if repeated"
}
```

## Local Fallback Commands

```bash
sdlc feedback add --task "<task>" --source "<file-or-artifact>" --route standard --route-fit right-sized --friction "<sanitized friction>" --suggested-action "review if repeated"
sdlc feedback validate
sdlc feedback export --out .ai-local/sdlc-cache/sdlc-feedback-export.json
sdlc feedback test
```

## MCP Implementation

The AirteraCode MCP exposes a separate `sdlc_feedback` tool rather than overloading the existing MCP feedback tool. The existing tool can stay focused on MCP/code-parsing improvement notes.

Implemented v1 behavior:

- accept one sanitized event matching `airtera.sdlc.feedback.v1`,
- validate required fields,
- reject `rawContentIncluded: true`,
- reject known raw-content field names,
- persist to a separate SDLC feedback store or collection,
- return a stable event id plus validation status,
- avoid automatic codebase enrichment in v1.

Review tool:

- `list_sdlc_feedback` lists bounded metadata for candidate review.

Optional later tools:

- `summarize_sdlc_feedback` for process-learning review packets,
- `promote_sdlc_feedback_candidate` after human-reviewed process-learning disposition.

## Promotion Rule

One feedback event is only a signal. Durable skill or workflow updates require process-learning review across repeated signals, clear owner/artifact placement, validation, and a rollback or deprecation path.
