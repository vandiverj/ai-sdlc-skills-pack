# Cycle 1B AirteraCode Knowledge Gateway Implementation Report

Status: implemented
Promotion state: Provisional
Implemented: 2026-06-19
Parent plan: [codex-local-model-sdlc-overview.md](codex-local-model-sdlc-overview.md)
Related fallback contract: [knowledge-candidate-contract.md](knowledge-candidate-contract.md)

## Boundary

Cycle 1B implements the AirteraCode MCP knowledge gateway stream that Cycle 1 intentionally deferred.

This cycle implemented two tracks:

1. `.agents` SDLC pack changes in this repository.
2. AirteraCode MCP changes in `/Users/jerrickvandiver/context-engine`.

Personal fixture note: an early local machine test repository was used to exercise SDLC behavior. It is not a fixture owned by, required by, or hardcoded into the reusable SDLC skills pack. Cycle 1B validation should use generic synthetic candidates and, when needed, an approved disposable fixture or repo-local dry run.

## Implementation Status

Cycle 1B is implemented as of 2026-06-19.

Implemented in `.agents`:

- `templates/schemas/sdlc-knowledge-candidate.schema.json` defines the required candidate envelope.
- `sdlc learn candidate-add` writes fallback candidates to `.ai-local/sdlc-cache/knowledge-candidates.jsonl`.
- `sdlc learn candidate-validate` validates JSON and JSONL candidate records.
- `sdlc learn candidate-export` exports fallback candidates for MCP review/import.
- Process-learning reviewer guidance now asks for source-linked knowledge candidates when reusable learning should be reviewed later.

Implemented in `/Users/jerrickvandiver/context-engine`:

- `validate_knowledge_candidate` validates candidate envelopes without persistence.
- `submit_knowledge_candidate` validates and persists accepted candidates as `review_status = candidate`.
- `list_knowledge_candidates` returns review metadata without raw detailed candidate payload by default.
- `knowledge_candidate` table is created by `016_knowledge_candidates.sql`.
- Operations guidance documents the candidate/non-authoritative boundary.

The gateway validates the envelope and persistence boundary. It does not prove candidate content correctness, promote candidates, tune retrieval, or edit source-of-truth artifacts.

## Improvement Hypothesis

If reusable SDLC learnings can be submitted through a small AirteraCode MCP gateway that validates the knowledge-candidate envelope, persists source-linked records, and returns structured errors without making the MCP a source of truth, then future process-learning and context-retrieval work can improve without scattering unreviewed learnings across prompts, chat logs, or shared docs.

## Failure Mode Classification

- wrong context: reusable learnings are captured without source links or owner artifacts.
- stale evidence: future agents reuse old process observations without confidence, drift, or decay metadata.
- over-process: knowledge capture becomes ceremony if the MCP requires more than the existing candidate envelope.
- unsafe repo change: sensitive project/client facts leak into shared `.agents` knowledge.
- tool/runtime mismatch: agents assume the MCP exists even when the fallback JSONL path is the only available path.

## Evidence Summary

Local evidence reviewed:

- [knowledge-candidate-contract.md](knowledge-candidate-contract.md)
- [templates/docs/agents/knowledge-layer-contract.md](../../templates/docs/agents/knowledge-layer-contract.md)
- [codex-local-model-sdlc-overview.md](codex-local-model-sdlc-overview.md)
- `/Users/jerrickvandiver/context-engine/AGENTS.md`
- `/Users/jerrickvandiver/context-engine/ctx-mcp/mcp_server/server.py`
- `/Users/jerrickvandiver/context-engine/ctx-mcp/mcp_server/auth.py`
- `/Users/jerrickvandiver/context-engine/tests/test_pack_schema.py`
- `/Users/jerrickvandiver/context-engine/migrations/`

Context-engine observations:

- MCP tools are registered in `ctx-mcp/mcp_server/server.py` through `ToolDefinition` and `tool_registry`.
- Client capability is controlled by `allowed_tool_tier` in `ctx-mcp/mcp_server/auth.py`.
- Tests use pytest with monkeypatched DB helpers for many tool contract checks.
- Migrations are SQL files under `migrations/`.
- Context-engine implementation happened in its own focused repo session and was validated from this `.agents` session through live MCP calls and focused pytest.

## Affected Surfaces

- SDLC knowledge-candidate contract and helper commands.
- MCP tool schema and validation responses.
- MCP persistence schema or append-only storage path.
- MCP tests and smoke checks.
- Process-learning reviewer output path.
- Runtime/tool capability documentation.

## Candidate Approaches Considered

### Candidate A: SDLC-Only JSONL Fallback

New capability or behavior: Add CLI validation/export helpers around `.ai-local/sdlc-cache/knowledge-candidates.jsonl`.

Why reject as complete Cycle 1B: This is useful, but it does not implement the AirteraCode MCP gateway stream. Keep it as the no-MCP fallback and `.agents` half of the work.

### Candidate B: Minimal MCP Candidate Submission Tool

New capability or behavior: Add one MCP tool that accepts a candidate envelope, validates required fields, persists the record, and returns structured validation status.

Why choose: It implements the smallest gateway promised by Cycle 1B while preserving source-of-truth boundaries and avoiding retrieval/consolidation scope creep.

### Candidate C: Full Knowledge Retrieval And Consolidation Layer

New capability or behavior: Add candidate submission, search, consolidation, anchor drift checks, confidence decay, and retrieval feedback in one pass.

Why reject for Cycle 1B: Too broad. That belongs to later Cycle 3 knowledge/retrieval work after submission and validation are proven.

## Selected Approach

Use Candidate B plus the necessary `.agents` fallback alignment from Candidate A.

Cycle 1B implemented only:

- candidate envelope validation,
- candidate submission,
- append-only or table-backed persistence,
- structured validation errors,
- duplicate-source detection if cheap,
- read/status/list helper for validation,
- no automatic promotion,
- no retrieval ranking,
- no source-of-truth editing,
- no sensitive-data storage beyond declared sensitivity/redaction fields.

## `.agents` Repository Implementation

### Scope

Keep `.agents` changes small and portable. This repo should define the candidate shape, fallback behavior, and CLI handoff to MCP when available. It should not depend on context-engine internals.

### Implemented Changes

1. Add a machine-readable schema:
   - `templates/schemas/sdlc-knowledge-candidate.schema.json`
   - Match the required fields in [knowledge-candidate-contract.md](knowledge-candidate-contract.md).
   - Allow optional fields already named in the contract.

2. Add CLI helper commands:
   - `sdlc learn candidate-validate --file <json|jsonl>`
   - `sdlc learn candidate-add --claim "..." --source <path> --owner <artifact> [--out <path>]`
   - `sdlc learn candidate-export --repo .`

3. Keep fallback path stable:
   - `.ai-local/sdlc-cache/knowledge-candidates.jsonl`
   - This remains the no-MCP path and the export/import bridge to context-engine.

4. Update process-learning guidance:
   - A process-learning reviewer may propose a knowledge candidate.
   - The candidate must cite source artifacts and owner artifact.
   - The candidate must not store client/customer facts in shared `.agents` docs.
   - MCP submission is optional; fallback JSONL remains valid.

5. Add a handoff reference for MCP submission:
   - Describe the expected MCP tool name and response shape.
   - State that the MCP validates the envelope but does not claim content correctness.

### `.agents` Acceptance Criteria Status

- Met: JSON schema defines required fields and parses successfully.
- Met: CLI validation handles JSON and JSONL.
- Met: candidate add writes under ignored `.ai-local/sdlc-cache/knowledge-candidates.jsonl`.
- Met: export output validates against the context-engine candidate validator without rewriting fields.
- Met: existing Cycle 1 dry-run behavior was smoke-checked and still broadens correctly in dirty worktrees.

### `.agents` Verification Commands

```bash
git diff --check
node --check scripts/sdlc/lib/learning.mjs
node ~/.agents/scripts/sdlc/sdlc.mjs learn candidate-validate --file <sample-jsonl>
node scripts/test-skill-files.mjs
```

Use the PowerShell skill-file test when running on the primary Windows maintenance environment. On macOS, record a cap if PowerShell is unavailable.

## AirteraCode MCP Implementation For `/Users/jerrickvandiver/context-engine`

### Context-Engine Constraints

Follow `/Users/jerrickvandiver/context-engine/AGENTS.md`:

- Work one task at a time.
- Do not weaken path safety, per-client tokens, no-shell-tool rule, frozen tool schemas, or task-assignment boundaries.
- Do not store secrets in git or Postgres.
- Use Python 3.12 and pytest.
- DB-backed tests may need Podman escalation in that repo.
- The MCP must not become a source of truth over local code/tests/docs/contracts.

### Implemented Data Model

Table-backed implementation:

```sql
CREATE TABLE knowledge_candidate (
  id bigserial PRIMARY KEY,
  schema_version text NOT NULL,
  candidate_kind text NOT NULL,
  candidate_class text NOT NULL,
  claim text NOT NULL,
  source_artifacts jsonb NOT NULL,
  anchors jsonb NOT NULL,
  task_run_evidence jsonb NOT NULL,
  applies_to jsonb NOT NULL,
  confidence text NOT NULL,
  confidence_last_confirmed timestamptz NOT NULL,
  decay_policy jsonb NOT NULL,
  drift_status text NOT NULL,
  sensitivity text NOT NULL,
  owner_artifact text NOT NULL,
  suggested_action text NOT NULL,
  optional_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_by_client_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  source_hash text NOT NULL,
  review_status text NOT NULL DEFAULT 'candidate'
);
```

Implemented indexes:

- `(review_status, created_at DESC)`
- `(candidate_kind, candidate_class)`
- GIN indexes for `source_artifacts` and `applies_to`
- unique `(source_hash, submitted_by_client_id)` for idempotent duplicate submission

The `.agents` JSONL fallback remains available when the MCP is unavailable.

### MCP Tools

Add these tools to `ctx-mcp/mcp_server/server.py`.

#### `submit_knowledge_candidate`

Purpose: Validate and persist one candidate.

Input schema:

```json
{
  "type": "object",
  "properties": {
    "candidate": { "type": "object" },
    "dry_run": { "type": "boolean" }
  },
  "required": ["candidate"]
}
```

Response shape:

```json
{
  "schema": "airteracode.knowledge_submission.v1",
  "status": "accepted | rejected | dry_run",
  "candidate_id": "optional",
  "errors": [
    {
      "field": "claim",
      "code": "missing_required | invalid_type | forbidden_sensitivity | invalid_value",
      "message": "human readable"
    }
  ],
  "warnings": [],
  "source_hash": "sha256...",
  "review_status": "candidate"
}
```

Authority:

- Available only to an approved tier. Prefer `full` initially unless the context-engine owner adds a dedicated capability flag.
- No write to source repos.
- No source-of-truth promotion.

#### `validate_knowledge_candidate`

Purpose: Validate without persistence.

This may be implemented as `submit_knowledge_candidate` with `dry_run: true`, or as a separate tool if clearer for agents.

#### `list_knowledge_candidates`

Purpose: Return recent candidate metadata only.

Input:

```json
{
  "limit": 20,
  "owner_artifact": "optional",
  "review_status": "optional"
}
```

Do not return raw sensitive candidate content by default. Return metadata and IDs unless the client is approved for detail reads.

### Validation Rules

Required fields:

- `schemaVersion`
- `kind`
- `class`
- `claim`
- `sourceArtifacts`
- `anchors`
- `taskRunEvidence`
- `appliesTo`
- `confidence`
- `confidenceLastConfirmed`
- `decayPolicy`
- `driftStatus`
- `sensitivity`
- `ownerArtifact`
- `suggestedAction`

Allowed sensitivity values:

- `public`
- `internal`
- `sensitive`
- `restricted`

Cycle 1B should accept only `public` and `internal` by default unless context-engine configuration explicitly allows more.

Allowed review status:

- initial persisted value must be `candidate`.

Forbidden behavior:

- No automatic promotion into docs, skills, prompts, or source code.
- No storage of raw secrets, credentials, customer row data, private ticket text, or proprietary logs.
- No broad retrieval/indexing requirement in Cycle 1B.
- No dependency on local model consolidation.

### Context-Engine Test Coverage

Focused tests were added under `tests/test_knowledge_candidates.py`.

Non-DB unit tests:

- valid envelope passes validation,
- missing required field returns structured error,
- invalid sensitivity is rejected,
- `dry_run` returns `dry_run` and does not persist,
- forbidden sensitive content is rejected or requires explicit configuration,
- tool appears only for the intended tier.

DB-backed tests:

- accepted candidate inserts one row,
- duplicate source hash returns warning or existing candidate metadata,
- list tool returns metadata with limit,
- raw sensitive details are not returned by default.

Suggested commands:

```bash
.venv/bin/python -m pytest tests/test_knowledge_candidates.py -q
.venv/bin/python -m pytest tests/test_pack_schema.py tests/test_pathsafety_auth.py -q
```

Run DB-backed pytest with the context-engine repo's normal Podman escalation if the test touches Postgres.

### Validation Evidence

Validation completed on 2026-06-19:

- Live MCP `validate_knowledge_candidate` accepted a valid internal candidate with `status = dry_run`, no errors, and no warnings.
- Live MCP `submit_knowledge_candidate` with `dry_run: true` returned `status = dry_run` and no `candidate_id`.
- Live MCP rejected malformed candidates with structured missing-field errors.
- Live MCP rejected sensitive candidates without opt-in with `forbidden_sensitivity`.
- Live MCP rejected secret-like content with `secret_like_content`.
- Live MCP accepted one internal review candidate and returned `candidate_id = 1`.
- Live MCP duplicate submission returned the same candidate id, validating idempotency.
- Live MCP `list_knowledge_candidates` filtered by `kind`, `class`, `owner_artifact`, and `review_status`.
- Live MCP negative class filter returned no candidates.
- Live MCP sensitive list filter returned no candidates without opt-in.
- Live MCP list output remained metadata-only and did not expose raw source artifacts, task-run evidence, or decay policy.
- `.agents` fallback candidate JSONL validated locally and exported successfully.
- The exported `.agents` fallback candidate validated through live MCP with no errors or warnings.
- Focused context-engine checks passed: `18 passed in 32.62s` for `tests/test_knowledge_candidates.py tests/test_schema.py`.

The only validation not performed from this Codex client was standard-tier denial because the active MCP client is authenticated as `full`.

### Context-Engine Implementation Steps Completed

1. Add validation module, for example `ctx-mcp/mcp_server/knowledge_candidates.py`.
2. Add tests for pure validation before persistence.
3. Add migration `016_knowledge_candidates.sql` if using Postgres.
4. Add persistence helpers using existing DB helper patterns.
5. Register MCP tool(s) in `server.py`.
6. Add tier exposure policy.
7. Add tests for tool registration, validation, and persistence.
8. Add short operations note in `OPERATIONS.md` describing candidate storage, review status, and sensitivity boundary.
9. Run focused tests and record evidence.

## Quality Oracle Ladder

Best proof:

- context-engine unit and MCP tool tests pass for validation, rejection, dry-run, persistence, and list behavior.
- `.agents` candidate schema validation accepts exported fallback records.

Good proof:

- manual MCP smoke submits a synthetic public/internal candidate and receives a structured accepted response.
- malformed candidate returns field-specific errors.

Fallback proof:

- JSONL fallback candidate validates locally and can be imported later.

Unavailable proof:

- retrieval quality improvement,
- offline consolidation usefulness,
- future-agent behavior improvement.

Do not claim:

- MCP-stored candidates are true,
- candidates are promoted,
- sensitive project facts are safe without review,
- retrieval is improved.

## Process Weight Budget

New commands:

- `.agents`: candidate validate/add/export helpers.
- context-engine: candidate validate/submit/list MCP tools.

New concepts:

- MCP-persisted candidate remains non-authoritative.
- review status starts as `candidate`.

New files/artifacts:

- `.agents` JSON schema and helper docs.
- context-engine validation module, migration, tests, and operations note.

New human approvals:

- required before storing sensitive/restricted candidate content.
- required before promoting any candidate into source-of-truth docs.

Removed complexity:

- reduces ad hoc learning capture in chat logs and scattered docs.
- creates a mechanical migration path from JSONL fallback to MCP.

Net process weight: neutral. It adds a gateway but removes ambiguity around how reusable learnings are captured and validated.

## Ten-Loop Review Log

| Loop | Lens | Evidence consulted | Weakness found | Revision made | Residual risk |
| --- | --- | --- | --- | --- | --- |
| 1 | Scope | overview Cycle 1B section | MCP work could grow into retrieval/consolidation | limited Cycle 1B to submission and validation | retrieval still deferred |
| 2 | Safety | context-engine AGENTS.md | secrets and path safety are hard invariants | no source repo writes, no secrets, no shell tool | sensitivity classifier may be imperfect |
| 3 | Portability | knowledge fallback contract | `.agents` must not require MCP | JSONL fallback remains first-class | duplicate validation logic |
| 4 | Evidence | Cycle 1 report | no MCP readiness proof yet | require focused context-engine tests | DB tests may need escalation |
| 5 | Data model | migrations list | new storage must fit existing migration flow | propose `016_knowledge_candidates.sql` | exact schema may need owner review |
| 6 | Tooling | `server.py` tool registry | tools are tier-gated, schemas frozen by tests | add explicit tool schemas and tier policy | tier may need dedicated capability later |
| 7 | Reviewability | knowledge contract | MCP must not claim content correctness | structured response says validation only | humans may overtrust stored records |
| 8 | Usability | process-learning flow | candidate capture could be too heavy | keep required fields identical to existing envelope | add helper command only if useful |
| 9 | Repo boundary | user correction on personal fixture | personal fixture could leak into shared plan | remove named personal fixture as required fixture | no standard fixture chosen yet |
| 10 | Rollback | two-repo split | context-engine and `.agents` can drift | define JSONL/export bridge and shared schema | version mismatch remains possible |

## Acceptance Criteria

`.agents` track:

- Met: contract and schema define the same required fields.
- Met: fallback JSONL path remains documented and usable.
- Met: optional MCP submission guidance is documented without making MCP mandatory.
- Met: no personal-fixture-specific requirement is introduced.

context-engine track:

- Met: MCP validates all required fields and returns structured errors.
- Met: accepted candidates persist with provenance, sensitivity, owner artifact, confidence, drift, decay, and review status.
- Met: invalid or forbidden candidates do not persist.
- Met: candidate records are non-authoritative and start as `candidate`.
- Met: tests cover valid, invalid, dry-run, duplicate, list filtering, and persistence paths.
- Met: operations docs explain review/promotion boundary.

## Validation Plan

Use generic synthetic candidates first. Example candidate themes:

- public SDLC process learning from Cycle 1 dry-run validation,
- internal tooling observation with sanitized repo names,
- invalid candidate missing `sourceArtifacts`,
- rejected sensitive candidate with placeholder secret-like content.

Do not require a named personal fixture. If a fixture is needed, use an approved disposable repo or a repo-local dry run selected at implementation time.

## Rollback Path

`.agents`:

- Revert schema/helper docs or commands.
- Keep existing JSONL fallback contract if MCP work is deferred.

context-engine:

- Disable new MCP tools from `tool_registry`.
- Revert migration before deployment, or add a forward migration that disables use while preserving rows if already deployed.
- Keep persisted candidates non-authoritative; no source-of-truth docs require rollback.

## Human Approval Needed

- Approval before committing or pushing `.agents` and `/Users/jerrickvandiver/context-engine` changes.
- Approval before adding dependencies or changing MCP auth/tier policy.
- Approval before storing sensitive/restricted knowledge candidates.
- Approval before promoting any candidate into shared docs, skills, prompts, or repo configuration.
