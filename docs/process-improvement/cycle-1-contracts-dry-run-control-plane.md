# Cycle 1 Implementation Plan: Contracts And Dry-Run Control Plane

Status: Draft implementation plan
Promotion state: Candidate
Parent plan: [codex-local-model-sdlc-overview.md](codex-local-model-sdlc-overview.md)
Last updated: 2026-06-18

## Purpose

Cycle 1 turns the local-model SDLC overview into concrete contracts and dry-run helper behavior without granting delegated agents write authority.

The goal is to prove the portable control-plane shape before automating agent execution:

```text
human intent + repo facts + task risk + available tools
-> route recommendation
-> role/context packet
-> runtime adapter check
-> model capability inventory
-> evidence expectations
-> human-readable next action
```

This cycle should make the workflow easier to understand and easier to implement later. It should not create a second SDLC, a broad new command surface, or a hidden automation path.

## Scope

In scope:

- drift audit of existing agent, skill, template, adapter, and CLI packet surfaces,
- documentation contracts,
- template/schema examples,
- small dry-run helper command additions,
- existing CLI extension points,
- local-only generated outputs under ignored `.ai-local` paths,
- portability checks for Codex `codex exec`, Claude Code, and manual packet fallback,
- initial local model inventory for `google/gemma-4-26b-a4b-qat`,
- no-MCP fallback for knowledge candidates.

Out of scope:

- write-capable local agent automation,
- direct local model execution,
- learned routing,
- automatic model promotion,
- exact dollar cost modeling,
- AirteraCode MCP implementation,
- Codex custom subagent UX,
- broad language-specific worker catalog,
- commit, push, deploy, migration, ticket write, dependency install, or external-service automation.

## Implementation Hypothesis

Hypothesis:
If Cycle 1 defines portable contracts and adds small dry-run helpers around the existing `sdlc` CLI, then future delegated-agent work can be tested with less human orchestration burden and less Codex-specific lock-in.

Failure mode it addresses:
The overview is too broad to implement safely in one step. Without concrete contracts, later agent automation would bake in unclear packet formats, runtime assumptions, stale model confidence, and hidden human coordination.

Expected agent behavior change:
Agents receive bounded packets with clear scope, evidence, tool permissions, output fields, and stop rules before any delegated work begins.

Expected developer experience change:
The developer can stay on the normal teaching path:

```text
sdlc start --task "<task>"
sdlc next --task "<task>"
sdlc prove --task "<task>"
sdlc finish-ready --task "<task>"
```

Advanced commands exist only to inspect or generate dry-run artifacts.

Expected code-quality change:
No production code behavior changes in Cycle 1. Quality improves indirectly by making future delegation reviewable, scoped, and evidence-backed before execution.

How we will know it worked:
Another developer can read the Cycle 1 artifacts, run or inspect dry-run helper outputs, understand the recommended route, and see what evidence would be required before implementation.

How it could make things worse:
It could create too many documents, duplicate existing packet behavior, or make developers learn internal model-routing details before they need them.

## Existing Local Surfaces

Relevant existing files and modules:

- `bin/sdlc`
- `scripts/sdlc/sdlc.mjs`
- `scripts/sdlc/lib/cli.mjs`
- `scripts/sdlc/lib/agentpackets.mjs`
- `scripts/sdlc/lib/adapters.mjs`
- `scripts/sdlc/lib/tools.mjs`
- `scripts/sdlc/lib/profile.mjs`
- `scripts/sdlc/lib/localreview.mjs`
- `templates/adapters/codex/agent.toml`
- `templates/adapters/pi/agent.md`
- `templates/docs/agents/runtime-adapters.md`
- `templates/docs/agents/model-tier-policy.md`
- `templates/docs/agents/delegation-patterns.md`
- `templates/schemas/sdlc-context-packet.schema.json`

Current helpful commands already exist:

```text
sdlc agents plan --task "<task>"
sdlc agents packet --role <role> --task "<task>"
sdlc agents lint --packet <path>
sdlc adapter doctor --runtime <runtime>
sdlc adapter profile --runtime <runtime>
sdlc tools inventory --repo <path>
sdlc context project --task "<task>" --phase <phase>
```

Cycle 1 should reuse these where possible instead of inventing replacement commands.

## Candidate Approaches Considered

### Candidate A: Documentation-Only Contracts

New capability or behavior:
Create the contracts as Markdown and schemas only.

Coding-quality impact:
Low immediate impact, but creates a clear target.

Platform/tool support impact:
High portability because no runtime assumptions are introduced.

Repo configurability impact:
Good, but untested.

No-install fallback:
Excellent.

Evidence and validation path:
Manual review only.

Cost/risk:
Low cost, but high chance the contracts remain abstract.

Why reject as the only approach:
It does not sufficiently reduce human orchestration burden or prove that the helper CLI can compile usable packets.

### Candidate B: Dry-Run CLI Helpers Over Existing Modules

New capability or behavior:
Add small helper behavior for packet generation, adapter checking, and model inventory while keeping all work read-only/dry-run.

Coding-quality impact:
Improves future delegation quality by making packet and runtime boundaries inspectable.

Platform/tool support impact:
Builds on existing Node CLI modules and existing fallback commands.

Repo configurability impact:
Good; outputs can live under `.ai-local` and use repo profile data where available.

No-install fallback:
Manual packet templates still work.

Evidence and validation path:
Run CLI smoke checks, inspect generated packets, lint outputs, and compare against expected contracts.

Cost/risk:
Moderate, because even small CLI additions need maintenance.

Why choose:
It is the smallest implementation path that produces real feedback.

### Candidate C: Full Agent Runtime Prototype

New capability or behavior:
Invoke `codex exec` or local models directly from the helper CLI in Cycle 1.

Coding-quality impact:
Potentially useful later.

Platform/tool support impact:
Risky early because runtime-specific execution details would dominate the contract.

Repo configurability impact:
Requires more configuration before the contracts are stable.

No-install fallback:
Weak.

Evidence and validation path:
Would need runtime and model availability before proving the packet shape.

Cost/risk:
High for Cycle 1.

Why reject for now:
It crosses the Cycle 1 stop line. Execution belongs after contracts and dry-run artifacts are proven.

## Selected Approach

Use Candidate B with documentation from Candidate A.

Cycle 1 should create the core contracts and add only small dry-run CLI support where it extends existing surfaces cleanly.

## Cycle 1 Review Verdict

Verdict: revise before implementation.

The current repository already contains substantial SDLC agent infrastructure. Cycle 1 should not begin by creating many new contract documents in parallel. The stronger starting point is to identify current sources of truth, remove or mark abandoned paths, and then promote only the minimum contracts needed to stabilize later cycles.

Key review findings:

1. Portable role definitions already exist in `agents/*.md` for five core roles.
2. `agent-contracts/independent-reviewer.md` is explicitly a legacy compatibility copy and may be stale against `agents/independent-reviewer.md`.
3. `templates/docs/agents/agent-catalog.md` defines more roles than the portable `agents/` folder and CLI packet generator currently support.
4. `templates/prompts/sdlc/*.md` already provides role prompt packet shapes for the five core roles.
5. `scripts/sdlc/lib/agentpackets.mjs` already generates role packets for the five core handoff roles, so Cycle 1 should improve and align that existing behavior rather than introduce a separate packet system.
6. `scripts/sdlc/lib/adapters.mjs` already has adapter doctor/profile behavior, but it is generic and does not yet distinguish `codex-exec`, `claude-code`, and `manual-packet` as concrete Cycle 1 targets.
7. The proposed contract list is useful as a backlog, but too broad as the first implementation step unless Slice 0 collapses, promotes, or defers overlapping artifacts.

Cycle 1 should therefore start with a foundation audit and ownership map:

```text
portable source of truth
-> prompt/template projection
-> runtime adapter projection
-> CLI-generated packet projection
-> process-improvement draft or historical note
```

No new durable contract should be promoted until this chain is clear for the artifact it affects.

## Firm Foundation Starting Point

The first actionable Cycle 1 objective is not "write all contract docs." It is:

```text
Make existing agent roles, templates, runtime adapters, and CLI packets agree on the smallest stable contract needed for read-only/dry-run delegation.
```

This changes the order of work:

1. Audit existing artifacts and identify the current source-of-truth chain.
2. Decide what to keep, align, merge, mark legacy, or retire.
3. Align the existing five core role definitions and packet templates.
4. Align the existing CLI packet generator and linter with those definitions.
5. Add runtime capability checks only where existing adapter support is too generic.
6. Create new process-improvement contract docs only for gaps not already owned by a durable artifact.

The default bias is to update existing owners, not create new owners.

## Implementation Slices

### Slice 0: SDLC Agent/Skill/Template Drift Audit

Before creating new contracts, audit the existing SDLC agent, skill, template, adapter, and CLI surfaces for drift, duplication, abandoned paths, and legacy compatibility copies.

Audit surfaces:

1. `agents/*.md`
2. `agent-contracts/*`
3. `templates/docs/agents/*`
4. `templates/prompts/sdlc/*`
5. `templates/adapters/*`
6. `skills/agents/references/*`
7. `skills/run-sdlc/*`
8. `scripts/sdlc/lib/agentpackets.mjs`
9. `scripts/sdlc/lib/adapters.mjs`
10. `README.md`, `SUMMARY.md`, `WORKFLOW.md`, and router maps that describe agent routing.

Audit questions:

- Which artifact is the current source of truth for each portable role?
- Which files are compatibility copies, downstream templates, runtime adapters, or generated examples?
- Which roles exist in templates but not portable agent definitions?
- Which role fields differ across `agents/`, templates, prompts, and CLI-generated packets?
- Which CLI-generated packets omit fields now required by the planned contracts?
- Which runtime adapters duplicate durable policy instead of pointing to portable sources?
- Which paths are likely abandoned and should be retired, merged, or clearly marked legacy?
- Which terms differ from the glossary or parent overview?

Known initial drift signals:

- `agent-contracts/independent-reviewer.md` is marked as a legacy compatibility copy and differs from `agents/independent-reviewer.md`.
- `templates/docs/agents/agent-catalog.md` lists specialist roles such as `context-explorer`, `implementation-planner`, `test-engineer`, `spec-compliance-reviewer`, `code-quality-reviewer`, `contract-reviewer`, `threat-modeler`, `production-readiness-reviewer`, and `doc-sync-reviewer` that do not have matching portable definitions in `agents/`.
- `scripts/sdlc/lib/agentpackets.mjs` supports the five current handoff roles only.
- `templates/prompts/sdlc/*.md` supports the same five current role prompts plus `evidence-packet.md`.
- `templates/adapters/*` point to `.agents/agents/{{AGENT_ID}}.md`, so they should not be expanded to roles that do not have portable source definitions.
- `sdlc adapter doctor` exists, but its current runtime profiles are generic and not yet sufficient for a `codex-exec` / `claude-code` / `manual-packet` portability smoke.

Required output:

```text
Artifact:
Current role:
Owner/source-of-truth status:
Drift found:
Action: keep / align / merge / promote / mark legacy / retire
Reason:
Blocking before Slice 1: yes/no
```

Expected cleanup plan:

- a table of artifacts to keep as source of truth,
- a table of compatibility copies that need alignment or retirement,
- a table of template/runtime adapter updates needed after contract decisions,
- a list of paths that should not receive new Cycle 1 contract work until their role is clarified.

Create:

```text
docs/process-improvement/cycle-1-sdlc-drift-audit.md
```

Acceptance:
Slice 1 cannot create new durable contract docs until Slice 0 identifies the current source-of-truth chain for portable agent definitions, downstream templates, runtime adapters, and CLI-generated packets. If cleanup would be risky or broad, Slice 0 may produce an approved cleanup plan instead of making the cleanup immediately.

### Slice 1: Cycle 1 Contract Documents

Create or update only after Slice 0 identifies the owning artifact for each contract. Prefer updating existing durable owners over creating new process-improvement documents.

Minimum Cycle 1 contracts:

1. `docs/process-improvement/three-tier-routing-matrix.md`
2. `docs/process-improvement/sdlc-local-model-glossary.md`
3. `docs/process-improvement/role-done-contracts.md`
4. `docs/process-improvement/intent-traceability-contract.md`
5. `docs/process-improvement/agent-response-packet-contract.md`
6. `docs/process-improvement/structured-claims-failure-attribution.md`
7. `docs/process-improvement/runtime-adapter-contract.md`
8. `docs/process-improvement/runtime-capability-matrix.md`
9. `docs/process-improvement/model-capability-drift-revalidation.md`
10. `docs/process-improvement/deterministic-tooling-inventory.md`
11. `docs/process-improvement/sdlc-friction-token-human-orchestration-audit.md`
12. `docs/process-improvement/knowledge-candidate-contract.md`

Potential consolidation:

- `role-done-contracts.md`, `agent-response-packet-contract.md`, and `structured-claims-failure-attribution.md` may collapse into one packet contract if Slice 0 shows the current packet generator and prompt templates already combine those concerns.
- `runtime-adapter-contract.md` and `runtime-capability-matrix.md` may collapse into one runtime capability contract if `scripts/sdlc/lib/adapters.mjs` remains the primary implementation surface.
- `three-tier-routing-matrix.md`, `model-capability-drift-revalidation.md`, and local model inventory may share one model-routing/profile contract until Cycle 2 proves a need to split them.
- `knowledge-candidate-contract.md` should remain a process-improvement draft until the separate AirteraCode MCP session owns the MCP implementation details.

Acceptance:
Each contract names required fields, optional fields, source of truth, forbidden claims, validation path, and no-install fallback.

### Slice 2: Template And Schema Seeds

Create or update:

1. `templates/config/local-models.example.json`
2. `templates/config/runtime-capabilities.example.json`
3. `templates/docs/agents/agent-response-packet-contract.md`
4. `templates/docs/agents/runtime-adapter-contract.md`
5. `templates/docs/agents/knowledge-layer-contract.md`

Potential schemas if useful:

1. `templates/schemas/sdlc-agent-response-packet.schema.json`
2. `templates/schemas/sdlc-runtime-capabilities.schema.json`
3. `templates/schemas/sdlc-local-models.schema.json`
4. `templates/schemas/sdlc-knowledge-candidate.schema.json`

Acceptance:
Templates are portable and contain placeholders, not product-specific facts.

### Slice 3: Dry-Run Agent Packet Improvements

Existing surface:

```text
sdlc agents packet --role <role> --task "<task>"
sdlc agents lint --packet <path>
```

Cycle 1 target behavior:

```text
sdlc agents packet --role <role> --task "<task>" --dry-run
```

Expected behavior:

- generates a packet without invoking any agent,
- writes under `.ai-local/sdlc-runs/<task-id>/agents/` unless `--out` is supplied,
- includes intent trace fields,
- includes role done contract,
- includes allowed tools and forbidden actions,
- includes evidence contract,
- includes required response packet fields,
- includes runtime/model recommendation as advisory only,
- includes stop conditions and escalation triggers,
- records no claim that work was executed.

Implementation notes:

- Prefer extending `scripts/sdlc/lib/agentpackets.mjs`.
- Current packet generation is already non-executing; Cycle 1 should first make that explicit with stronger "packet only / not executed" labeling and lint rules.
- `--dry-run` may be accepted as a clarity alias, but it should not create a second packet path.
- Do not add model execution.
- Do not add write authority.

Acceptance:
`sdlc agents lint --packet <path>` can detect missing required sections.

### Slice 4: Runtime Adapter Check

Existing surface:

```text
sdlc adapter doctor --runtime <runtime>
sdlc adapter profile --runtime <runtime>
```

Cycle 1 target behavior:

```text
sdlc runtime adapter-check --runtime codex-exec
```

Pragmatic implementation option:
Either add the new alias or document that `sdlc adapter doctor --runtime codex-exec` is the Cycle 1 command. Prefer the alias only if it improves teachability without duplicating logic.

Current evidence:
`sdlc adapter doctor --runtime codex` and `sdlc adapter doctor --runtime claude-code` already return JSON, but the result is still generic. Cycle 1 should make these runtime IDs explicit:

```text
codex-exec
claude-code
manual-packet
```

Expected fields:

```text
Runtime:
Invocation method:
Supports structured output:
Supports noninteractive execution:
Supports local provider:
Supports MCP:
Supports hooks/events:
Supports sandbox/tool boundaries:
Supports response schema enforcement:
Supports usage/token capture:
Known caps:
Fallback:
Recommended next artifact:
```

Acceptance:
The check returns a comparable result for `codex-exec`, `claude-code`, and `manual-packet`.

### Slice 5: Local Model Inventory

Cycle 1 target behavior:

```text
sdlc models inventory
```

Initial known model:

```text
google/gemma-4-26b-a4b-qat
```

Inventory fields:

```text
Model id:
Model family:
Model version/build:
Runtime:
Provider/source:
Quantization:
Context window:
Runs fully local:
Hardware profile:
Tool-call support:
Structured-output reliability:
Best suspected roles:
Weak/forbidden roles:
Privacy/logging notes:
Metadata source:
Fields requiring local measurement:
Last evaluated:
```

Implementation notes:

- The first version can read from `templates/config/local-models.example.json` or a repo-local `.ai-local/local-models.json`.
- Do not require network access or LM Studio API access in Cycle 1.
- Web-researched metadata can be added manually to the template later.
- Local-measurement fields stay `unknown` until evaluated.

Acceptance:
The command can print the seed model profile and mark unknown fields honestly.

### Slice 6: Knowledge Candidate No-MCP Fallback

Cycle 1 should define the fallback shape used until the separate AirteraCode MCP session implements candidate submission.

Fallback file:

```text
.ai-local/sdlc-cache/knowledge-candidates.jsonl
```

Candidate envelope:

```text
schemaVersion:
kind:
class:
claim:
sourceArtifacts:
anchors:
taskRunEvidence:
appliesTo:
confidence:
confidenceLastConfirmed:
decayPolicy:
driftStatus:
sensitivity:
ownerArtifact:
suggestedAction:
```

Acceptance:
The fallback contract matches the intended MCP envelope closely enough that later migration is mechanical.

### Slice 7: Friction And Human-Orchestration Audit

Cycle 1 should create the audit shape before running broad experiments.

First measured categories:

1. Re-explaining task intent and scope after context shifts.
2. Manually selecting and summarizing relevant files/context.
3. Manually deciding which model/agent should do which subtask.
4. Manually turning agent output into a verification checklist.
5. Manually reconciling review findings, uncertainty, and next actions.

Suggested record:

```text
Task:
Route:
Step:
Friction category:
Manual action count:
Estimated minutes:
Token/turn signal:
Evidence gap:
Could helper reduce this: yes/no/unknown
Candidate helper:
```

Acceptance:
The audit can be filled out from one real or fixture task without requiring a heavy survey.

## Command Contract Summary

Cycle 1 command targets:

```text
sdlc agents packet --role <role> --task "<task>" --dry-run
sdlc agents lint --packet <path>
sdlc adapter doctor --runtime codex-exec
sdlc adapter doctor --runtime claude-code
sdlc adapter doctor --runtime manual-packet
sdlc models inventory
```

Optional aliases only if low weight:

```text
sdlc runtime adapter-check --runtime <runtime>
```

Do not add:

```text
sdlc agents run
sdlc models recommend
sdlc retrieval challenge
sdlc knowledge submit-to-mcp
```

Those belong to later cycles or separate AirteraCode MCP work.

## Quality Oracle Ladder

Best proof:
CLI smoke tests produce dry-run packets and adapter/model inventory outputs that match the documented contracts.

Good proof:
Manual inspection confirms another developer can understand the teaching path, generated packet, runtime caps, and fallback behavior.

Fallback proof:
Contracts and templates are complete enough to perform manual packet handoff without CLI changes.

Unavailable proof:
Actual local model execution quality and write-capable delegation are not proved in Cycle 1.

Human-only proof:
Whether the command path is teachable enough for another developer.

Do not claim:
Do not claim token savings, model quality, local automation safety, or AirteraCode MCP readiness from Cycle 1 alone.

## Process Weight Budget

New commands:
At most one new command group or alias should be added. Prefer extending existing `agents`, `adapter`, and future `models` surfaces.

New concepts:
No new concepts beyond the overview. Cycle 1 operationalizes existing terms.

New files/artifacts:
Contract docs, templates, optional schemas, and small local `.ai-local` example outputs.

New decisions required:
Exact field names, schema strictness, output formats, and whether `runtime adapter-check` should be an alias or documentation-only.

New context loaded:
Only the Cycle 1 plan, parent overview, existing CLI modules, and selected templates.

New human approvals:
None for dry-run docs and CLI helpers. Approval is required before any future dependency install, network/API use, local model execution, write-capable agent work, commit, or push.

Removed complexity:
Reduces repeated planning about packet shape, runtime boundaries, and model inventory.

Net process weight:
Neutral if helper additions stay small; heavier if every output becomes a mandatory artifact for small tasks.

Why the weight is worth it:
It creates the smallest stable surface for future delegation experiments.

## Implementation Order

1. Run Slice 0 drift audit across current agent, skill, template, adapter, and CLI packet surfaces.
2. Produce a cleanup/alignment plan with keep, align, merge, promote, mark legacy, and retire decisions.
3. Resolve or explicitly defer blocking drift before creating new durable contracts.
4. Create Cycle 1 contract docs.
5. Add template/config seeds.
6. Extend or document `sdlc agents packet --dry-run`.
7. Extend `agents lint` to check required Cycle 1 sections.
8. Extend `adapter doctor` profiles for `codex-exec`, `claude-code`, and `manual-packet`.
9. Add a minimal `models inventory` command or document the first static inventory file if CLI support is not worth it yet.
10. Add knowledge candidate fallback contract.
11. Add friction audit template.
12. Run CLI smoke checks and Markdown validation.
13. Review whether Cycle 2 can begin or Cycle 1 needs another pass.

## Validation Plan

Run document checks:

```text
git diff --check
rg -n "[[:cntrl:]]" docs/process-improvement/cycle-1-contracts-dry-run-control-plane.md
```

Run repo skill checks when PowerShell is available:

```text
node scripts/test-skill-files.mjs
```

Run CLI smoke checks after implementation:

```text
node scripts/sdlc/sdlc.mjs agents packet --role verification-worker --task "Cycle 1 dry-run packet smoke" --dry-run --repo .
node scripts/sdlc/sdlc.mjs agents lint --packet <generated-packet> --repo .
node scripts/sdlc/sdlc.mjs adapter doctor --runtime codex-exec --repo . --json
node scripts/sdlc/sdlc.mjs adapter doctor --runtime claude-code --repo . --json
node scripts/sdlc/sdlc.mjs adapter doctor --runtime manual-packet --repo . --json
node scripts/sdlc/sdlc.mjs models inventory --repo . --json
```

If a target command is not implemented yet, record it as a Cycle 1 implementation task, not as validation evidence.

Run audit checks before Slice 1:

```text
find agents agent-contracts templates/docs/agents templates/prompts/sdlc templates/adapters -type f | sort
rg -n "Portable source|legacy|Compatibility note|Default model tier|Write access|Expected output|Evidence" agents agent-contracts templates/docs/agents templates/prompts/sdlc templates/adapters scripts/sdlc/lib/agentpackets.mjs scripts/sdlc/lib/adapters.mjs
node scripts/sdlc/sdlc.mjs agents packet --role verification-worker --task "Cycle 1 baseline packet smoke" --repo . --out /private/tmp/cycle1-baseline-packet.md
node scripts/sdlc/sdlc.mjs adapter doctor --runtime codex --repo . --json
node scripts/sdlc/sdlc.mjs adapter doctor --runtime claude-code --repo . --json
```

The audit should record what these baseline commands already prove and what they do not prove. For example, current `agents packet` proves packet generation exists, but it does not prove local model execution, response schema enforcement, runtime-specific invocation, or token savings.

## Rollback Path

- Contract docs can be revised or removed before promotion.
- New templates can be reverted independently.
- CLI additions should be isolated to small functions and route entries.
- Generated `.ai-local` outputs are local scratch artifacts and can be deleted.
- If `models inventory` proves too early, keep the static config template and defer CLI support.

## Acceptance Criteria

Cycle 1 is complete when:

- the Slice 0 drift audit has identified current sources of truth, legacy copies, template drift, runtime adapter drift, and CLI packet gaps,
- blocking cleanup has been completed or explicitly deferred with a reason and owner,
- the contracts exist and are internally consistent,
- role packets can be generated or manually assembled from the contracts,
- runtime adapter capability checks identify caps and fallbacks,
- the Gemma seed model is represented without overstated capability,
- the knowledge candidate fallback envelope exists,
- the friction audit shape exists,
- no write-capable local automation has been added,
- no AirteraCode MCP implementation has been mixed into this session,
- another developer can follow the teaching path without reading every SDLC process document.

## Open Questions For Cycle 1

- Should `sdlc runtime adapter-check` be added as an alias, or should Cycle 1 standardize on existing `sdlc adapter doctor`?
- Should `sdlc agents packet --dry-run` write a file by default, or print to stdout unless `--out` is supplied?
- Which response packet fields should be hard lint failures versus warnings?
- Should local model inventory be JSON-only first, or should it also render Markdown?
- Should transcripts default to discard, summarize, or local-only retention during Cycle 1 dry runs?
- Which exact Gemma metadata should be researched before implementation, and which must wait for local measurement?

## Promotion State

Cycle 1 starts as `Candidate`.

It can move to `Experiment` after the contract docs and dry-run helper behavior are implemented and smoke-tested.

It can move to `Provisional` only after a fixture or real task shows that the packet/runtime/model inventory flow reduces human orchestration burden without weakening evidence.
