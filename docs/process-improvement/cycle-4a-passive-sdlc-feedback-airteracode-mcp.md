# Cycle 4A Implementation Plan: Passive SDLC Feedback Through AirteraCode MCP

Status: Implemented
Promotion state: Candidate
Parent plan: [codex-local-model-sdlc-overview.md](codex-local-model-sdlc-overview.md)
Prior cycle: [cycle-4-implementation-report.md](cycle-4-implementation-report.md)
Related stream: [cycle-1b-airteracode-knowledge-gateway.md](cycle-1b-airteracode-knowledge-gateway.md)
Last updated: 2026-06-20

## Purpose

Cycle 4A corrects the Cycle 4 measurement UX. The SDLC should improve from normal use without making the developer manually run calibration commands or act as the research operator.

The goal is to let agents submit small, structured, sanitized SDLC process feedback events through the AirteraCode MCP during normal task completion. AirteraCode MCP becomes the central company gateway for feedback collection, while `.agents` retains a local JSONL fallback and the portable contract.

Cycle 4A should answer:

```text
normal coding task
-> agent follows SDLC skills
-> agent emits compact sdlc_feedback event
-> AirteraCode MCP validates and persists the event
-> local .ai-local fallback if MCP is unavailable
-> periodic process-learning review finds repeated signals
-> reviewed SDLC improvements update skills, helpers, routing, repo setup, or model profiles
```

It should not answer by collecting raw source code, raw ticket text, customer data, database output, full prompts, or by automatically rewriting SDLC rules from one feedback event.

## Planning Scope

Work class:
Standard SDLC process improvement with MCP contract and data-boundary impact.

References selected:
- [codex-local-model-sdlc-overview.md](codex-local-model-sdlc-overview.md)
- [cycle-4-measurement-pilot-read-only-counterpoint.md](cycle-4-measurement-pilot-read-only-counterpoint.md)
- [cycle-4-implementation-report.md](cycle-4-implementation-report.md)
- [cycle-1b-airteracode-knowledge-gateway.md](cycle-1b-airteracode-knowledge-gateway.md)
- [sdlc-friction-token-human-orchestration-audit.md](sdlc-friction-token-human-orchestration-audit.md)
- [model-capability-drift-revalidation.md](model-capability-drift-revalidation.md)
- [structured-claims-failure-attribution.md](structured-claims-failure-attribution.md)
- [sdlc-knowledge-feedback.md](sdlc-knowledge-feedback.md)

Artifacts to read/update during implementation:
- `.agents`:
  - new SDLC feedback contract doc: [sdlc-feedback-contract.md](sdlc-feedback-contract.md),
  - new JSON schema under `templates/schemas/`,
  - new local feedback helper module,
  - `scripts/sdlc/lib/cli.mjs`,
  - `scripts/sdlc/README.md`,
  - relevant process-learning/run-sdlc guidance so agents submit feedback naturally.
- AirteraCode MCP:
  - MCP tool registry and schema definitions,
  - validation helpers,
  - persistence migration or store layer,
  - focused tests for `sdlc_feedback`,
  - list/review/report tool only if the existing review path needs it.

Decisions resolved by this plan:
- Tool name: `sdlc_feedback`.
- Use the same AirteraCode MCP service, not a separate MCP.
- Use a separate tool and logical collection/table from existing MCP parser-feedback.
- Use sanitized event envelopes only in v1.
- Keep local fallback JSONL when MCP is unavailable.
- Keep promotion manual: feedback can recommend process changes, not apply them.

Approval gate:
Human approval is needed before implementation starts in AirteraCode MCP, before adding persistence migrations, before submitting live feedback from real tasks, and before commit or push in either repository. No raw source upload, customer data capture, database capture, ticket write, model invocation, dependency install, deploy, merge, or production migration is approved by this plan.

Next phase:
Use `sdlc_feedback` during normal Standard+ work, then review repeated feedback through process-learning before promoting durable SDLC rule changes.

Stop condition:
Stop if implementation requires raw-code capture, raw ticket/database capture, automatic SDLC rule mutation, broad retrieval/indexing infrastructure, or use of AirteraCode MCP internals as the source of SDLC policy.

## Implementation Hypothesis

Hypothesis:
If agents can submit small sanitized `sdlc_feedback` events during normal work, then repeated process signals can be reviewed and used to improve SDLC skills, helper CLI behavior, routing, repository setup, and lower/local-model delegation without asking the developer to run manual measurement commands.

Failure mode it addresses:
Cycle 4 proved a measurement helper but required the developer to understand and operate the measurement protocol. That is not realistic under normal job load and short rollout timelines.

Expected agent behavior change:
Agents should identify notable SDLC feedback during natural task completion, emit a compact event through MCP or fallback JSONL, and keep the user-facing handoff focused on the actual coding result.

Expected developer experience change:
The developer should use the SDLC normally. Feedback capture should be passive unless the agent needs a human decision about sensitivity, approval, or a process change.

Expected code-quality change:
Repeated real-world signals should improve task routing, context loading, verification selection, safe edit boundaries, and model-tier choices over time.

How we will know it worked:
Normal Standard+ tasks produce valid `sdlc_feedback` events without manual calibration commands. Repeated events can be reviewed into candidate process changes, and the SDLC can distinguish local/lower-model candidate roles from tasks that need top-frontier orchestration.

How it could make things worse:
It could leak sensitive context, create noisy low-value events, make every final response heavier, or let one-off feedback churn durable skill guidance.

## Failure Mode Classification

- over-process: passive capture becomes another ceremony if agents over-report trivial tasks.
- unsafe repo change: feedback stores raw code, ticket text, customer data, or database output.
- poor handoff: events are too vague for process-learning review.
- stale evidence: feedback is stored without source pointers, commit, route, or evidence state.
- tool/runtime mismatch: agents assume AirteraCode MCP is available and fail when fallback is needed.
- hidden assumption: feedback is mistaken for proof that a process change is correct.

## Selected Architecture

### Tool

Use a dedicated AirteraCode MCP tool:

```text
sdlc_feedback
```

The name is intentionally short and specific. It is easier for agents to select than overloading an existing generic `feedback` tool.

### Storage Boundary

Use the same AirteraCode MCP service and deployment boundary, but store SDLC feedback in a separate logical collection/table from current MCP-improvement feedback.

Rationale:
- Existing MCP feedback is about improving MCP code parsing/retrieval behavior.
- SDLC feedback is about improving agent process quality, routing, verification, and model-tier decisions.
- They can share auth, validation style, operational ownership, and review infrastructure, but their schemas and consumers differ.

### Fallback

When MCP is unavailable, write local JSONL:

```text
.ai-local/sdlc-cache/sdlc-feedback.jsonl
```

Fallback rows must validate against the same envelope as MCP submissions and must be exportable for later MCP import or review.

## Feedback Envelope V1

Required fields:

- `schemaVersion`: `airtera.sdlc.feedback.v1`
- `eventType`: `task-completion`, `friction`, `route-fit`, `verification-gap`, `context-gap`, `agent-miss`, or `process-suggestion`
- `timestamp`
- `repoId`
- `taskSummary`
- `workClass`
- `routeUsed`
- `routeFit`: `right-sized`, `too-heavy`, `too-light`, `unknown`
- `sensitivity`: `public`, `internal`, or `restricted`
- `rawContentIncluded`: must be `false` for v1
- `sourcePointers`
- `evidence`
- `signals`
- `suggestedAction`

Optional fields:

- `repoKind`
- `branch`
- `commit`
- `dirty`
- `agentRuntime`
- `modelTier`
- `modelId`
- `checksRun`
- `caps`
- `evidenceGaps`
- `humanCorrections`
- `candidateDelegation`
- `relatedFeedback`
- `redactionNotes`
- `fallbackSource`

Example:

```json
{
  "schemaVersion": "airtera.sdlc.feedback.v1",
  "eventType": "task-completion",
  "timestamp": "2026-06-20T03:00:28.328Z",
  "repoId": "www_dev",
  "repoKind": "legacy-asp",
  "taskSummary": "Extract repeated placeholder-date normalization into a local helper",
  "workClass": "standard",
  "routeUsed": "standard",
  "routeFit": "right-sized",
  "sensitivity": "internal",
  "rawContentIncluded": false,
  "sourcePointers": [
    {
      "kind": "path",
      "pointer": "www_dev/fingerprint_client_emp_expanded.asp"
    }
  ],
  "evidence": {
    "checksRun": ["git diff --check"],
    "caps": ["no runnable ASP test harness", "line-ending warning"],
    "evidenceGaps": ["manual ASP verification required"]
  },
  "signals": {
    "friction": ["legacy no-test verification cap"],
    "humanCorrections": [],
    "candidateDelegation": {
      "candidate": true,
      "role": "read-only duplicate-code finder",
      "risk": "low",
      "reason": "mechanical repeated-pattern discovery"
    }
  },
  "suggestedAction": "review repeated legacy cleanup tasks as lower-tier/local read-only scan candidates"
}
```

## Privacy And Trust Boundary

Allowed by default:
- repo id or configured alias,
- task summary,
- route/work-class metadata,
- checks and caps,
- evidence gaps,
- friction categories,
- source pointers,
- branch/commit/dirty state,
- lower/local-model candidate role hints.

Forbidden by default:
- raw source code,
- raw diffs,
- raw ticket text,
- raw database output,
- customer/client data,
- secrets,
- credentials,
- private URLs with sensitive identifiers,
- full prompts or full chat transcripts.

If a future version needs source excerpts, it must be a separate approved schema version with explicit redaction rules and review.

## Candidate Approaches Considered

### Candidate A: Keep Cycle 4 Manual Calibration

New capability or behavior:
Continue using `sdlc calibrate add` and `pilot-report`.

Why reject as the main path:
It asks the developer to operate the measurement loop. That conflicts with the SDLC goal of reducing human intervention.

Keep:
The existing commands remain useful as local fallback, debugging, and report plumbing.

### Candidate B: Overload Existing MCP Feedback Tool

New capability or behavior:
Add SDLC fields to the existing MCP feedback tool.

Why reject:
The existing feedback tool is about improving MCP parsing/code-information behavior. SDLC feedback has different consumers, retention needs, and review cadence. Overloading increases the chance agents submit the wrong payload.

### Candidate C: Dedicated `sdlc_feedback` MCP Tool

New capability or behavior:
Add a specific MCP tool with a strict sanitized process-feedback envelope.

Why choose:
It matches the actual domain, keeps validation simple, and allows feedback review to evolve without coupling to MCP parser-improvement notes.

### Candidate D: Automatic Skill Rewriter

New capability or behavior:
Let accumulated feedback directly update SDLC skills.

Why reject:
Feedback is evidence, not authority. Durable process changes still need process-learning review, human approval, validation, and rollback.

## Implementation Status

### Slice 1: `.agents` Feedback Contract

Implemented: added a contract document and JSON schema for `airtera.sdlc.feedback.v1`.

Acceptance:
- Schema requires the v1 envelope fields.
- Schema forbids raw content in v1 through `rawContentIncluded: false`.
- Contract defines allowed/forbidden payload content.
- Contract states feedback is not proof and cannot auto-promote process changes.

### Slice 2: Local Fallback Helpers

Implemented helper support for:

```bash
sdlc feedback add
sdlc feedback validate
sdlc feedback export
sdlc feedback test
```

Acceptance:
- Writes JSONL to `.ai-local/sdlc-cache/sdlc-feedback.jsonl`.
- Validates JSON and JSONL rows against the same required envelope.
- Can export rows for MCP submission/review.
- Does not require AirteraCode MCP to be installed.

### Slice 3: Agent-Owned Capture Guidance

Implemented: updated relevant skills so agents decide when to emit feedback without asking the developer to run commands.

Initial trigger guidance:
- Standard+ task completion with a notable process signal.
- route mismatch or route uncertainty.
- missing verification or no-test cap.
- repeated human correction or clarification.
- context discovery failure.
- useful lower/local-model delegation candidate.
- unsafe or unavailable tool/runtime cap.

Tiny/Micro tasks should skip feedback unless there is a notable signal.

Acceptance:
- Final handoffs stay concise.
- Agents record feedback quietly when possible.
- MCP unavailable uses local fallback and reports only the cap if relevant.

### Slice 4: AirteraCode MCP `sdlc_feedback`

Implemented: added an MCP tool named `sdlc_feedback`.

Expected behavior:
- Accepts the v1 envelope.
- Validates required fields and forbidden raw-content boundary.
- Persists accepted events in a separate logical collection/table.
- Returns structured validation errors.
- Records submitter/client metadata.
- Does not enrich by reading source pointers in v1.

Acceptance:
- Valid event is accepted and persisted.
- Missing required field returns structured validation error.
- `rawContentIncluded: true` is rejected in v1.
- Source pointers are stored as pointers only.
- Tool access follows the existing MCP client auth/tier policy.

### Slice 5: Review And Reporting

Implemented first review path:

```text
list_sdlc_feedback
```

Future summarization/reporting may group by:
- repo id,
- task type,
- route fit,
- evidence gaps,
- friction category,
- candidate delegation role,
- model/runtime tier.

Acceptance:
- Reports show repeated signals without exposing raw sensitive content.
- Reports produce candidate process-learning prompts, not direct skill edits.

### Slice 6: Implementation Report

Implemented: created a Cycle 4A implementation report after both `.agents` fallback and AirteraCode MCP submission were validated.

Required report content:
- implemented `.agents` contract/fallback slices,
- implemented MCP slices,
- validation evidence,
- privacy boundary proof,
- unavailable/capped surfaces,
- first real or synthetic feedback event,
- next recommendation.

## Quality Oracle Ladder

Best proof:
One normal SDLC task emits a valid `sdlc_feedback` event through AirteraCode MCP, and a review/list path can retrieve sanitized metadata without raw code.

Good proof:
Local fallback writes and validates JSONL rows, MCP validation tests accept/reject synthetic events correctly, and MCP list path returns sanitized metadata.

Fallback proof:
Schema validation and docs-only plan if MCP implementation is not available in the current session.

Unavailable proof:
Long-term SDLC improvement signal. That requires repeated real use.

Do not claim:
Do not claim local/lower model readiness, process improvement, or route quality from event capture alone.

## Validation Target Plan

1. `.agents` schema and helper validation.
2. AirteraCode MCP focused unit tests for `sdlc_feedback`.
3. Synthetic accepted/rejected MCP submissions.
4. One real low-risk SDLC task event when approved.
5. Process-learning review after multiple real events.

## Verification Commands

Observed `.agents` checks:

```bash
git diff --check
node scripts/test-skill-files.mjs
rg -n -P "[\x00-\x08\x0B\x0C\x0E-\x1F]" README.md SUMMARY.md WORKFLOW.md skills/*/SKILL.md
node scripts/sdlc/sdlc.mjs feedback test --repo .
node scripts/sdlc/sdlc.mjs feedback validate --repo .
```

Observed AirteraCode MCP checks:

```bash
PYTHONPATH=ctx-mcp:ctx-indexer:. .venv/bin/python -m pytest tests/test_sdlc_feedback.py tests/test_knowledge_candidates.py -q
```

## Promotion Ladder

Initial state:
Candidate.

After `.agents` fallback and MCP validation tests:
Experiment. This is the current state.

After repeated real task events show useful process-learning signals without sensitive-content leakage:
Provisional.

Durable only after:
- repeated accepted process improvements,
- low false-positive/noise rate,
- no privacy boundary violations,
- clear rollback path,
- developer burden stays lower than manual measurement.

## Rollback Path

- Disable the `sdlc_feedback` MCP tool.
- Keep local fallback rows ignored under `.ai-local`.
- Stop agent-owned submission guidance.
- Leave existing Cycle 4 calibration helpers available for manual/debug use.
- Do not delete stored feedback without following AirteraCode data-retention policy.

## Human Approval Needed

Yes.

Approval is still needed before live feedback submission policies change, before broad rollout, and before commit or push. The implemented MCP tool and migration are local changes until committed and deployed through the normal repository process.
