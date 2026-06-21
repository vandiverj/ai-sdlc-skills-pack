# Cycle 7 Review: SDLC Skills And Agents

Date: 2026-06-20
Status: Draft findings
Promotion state: Review artifact

## Scope

This review inspected the current SDLC skills pack after Cycle 6 added the frontier Codex agent roster.

Files and surfaces reviewed:

- Top-level workflow docs: `README.md`, `SUMMARY.md`, `WORKFLOW.md`
- Router skills: `run-sdlc`, `classify-work`, `agents`, `review`, `process-learning`, and selected references
- Portable agent definitions under `agents/`
- Runtime adapters under `templates/adapters/`
- Downstream agent docs under `templates/docs/agents/`
- Agent prompt templates under `templates/prompts/sdlc/`
- Cycle 6 validation report: `docs/process-improvement/cycle-6-frontier-codex-agent-roster.md`

## Executive Summary

The SDLC has a coherent current architecture:

1. `run-sdlc` is the top-level orchestrator.
2. `classify-work` owns route depth, risk, dirty surfaces, gates, and evidence requirements.
3. Phase routers own specialized process areas.
4. Portable role files in `agents/` define specialist agents.
5. Runtime adapters translate those roles into Codex, Pi, Augment/Auggie, or other runtime shapes.
6. The parent agent keeps final judgment, human-facing decisions, commit/push authority, process mutation, and feedback submission.

The largest issue is not missing capability. It is drift between older public docs/templates and the newer router/reference and frontier-agent architecture. The pack now contains enough power to run the SDLC, but some developer-facing surfaces still name removed or consolidated skills as direct skills. Some templates also lag the feedback and response-packet contracts.

## Current Inventory

### Top-Level Skills

Current top-level skills:

```text
agents
caveman
classify-work
context
counterpoint
document-processing
find-skills
grill-me
implementation
improvement-loop
make-qa
planning
process-learning
quality
release
review
run-sdlc
sdlc-process-improvement
setup-sdlc-in-repo
test-skill-behavior
tools
vercel-react-best-practices
```

### Portable Agents

Current portable agent roles:

| Role | File | Primary boundary |
| --- | --- | --- |
| Context scout | `agents/context-scout.md` | read-only context packet |
| Read-only code scout | `agents/read-only-code-scout.md` | read-only source-linked discovery |
| Implementation planner | `agents/implementation-planner.md` | read-only plan |
| Implementation worker | `agents/implementation-worker.md` | bounded write |
| Verification worker | `agents/verification-worker.md` | approved commands, no edits |
| Independent reviewer | `agents/independent-reviewer.md` | read-only review |
| Security privacy reviewer | `agents/security-privacy-reviewer.md` | read-only deep risk review |
| QA handoff worker | `agents/qa-handoff-worker.md` | tester-readable handoff |
| Release handoff worker | `agents/release-handoff-worker.md` | Git/handoff only when authorized |
| Process learning reviewer | `agents/process-learning-reviewer.md` | read-only process recommendations |
| Feedback reporter | `agents/feedback-reporter.md` | sanitized feedback draft |

### Codex SDLC Adapters

The frontier Codex install set contains 11 hosted agents:

```text
sdlc_context_scout
sdlc_read_only_code_scout
sdlc_implementation_planner
sdlc_implementation_worker
sdlc_verification_worker
sdlc_independent_reviewer
sdlc_security_privacy_reviewer
sdlc_qa_handoff_worker
sdlc_release_handoff_worker
sdlc_process_learning_reviewer
sdlc_feedback_reporter
```

Two local-provider scout variants remain opt-in:

```text
sdlc_local_read_only_code_scout
sdlc_lmstudio_read_only_code_scout
```

Cycle 6 validated that hosted frontier agents are discoverable after Codex restart. LM Studio/local variants were intentionally not tested because LM Studio was off.

## Current SDLC Process Map

### Operating Model

The SDLC is a dependency graph, not a mandatory sequence. The top-level rule is:

```text
Use the minimum process that prevents the most likely expensive failure.
```

The human provides intent, constraints, approvals, product judgment, and release decisions. The parent agent orchestrates the route, delegates only when useful, verifies evidence, and stops at consent gates. Subagents and helper CLI packets are execution aids, not owners of final judgment.

### High-Level Flow

```text
Human request
-> run-sdlc, if the human wants the workflow driven
-> classify-work
-> route selection and dirty-surface decision
-> context/tools/agent strategy only as needed
-> planning/contract/model gates only as needed
-> safe edit boundary
-> implementation or bounded worker
-> verification evidence
-> review gates selected by risk and dirty surfaces
-> QA/release/process-learning handoff when needed
-> parent final synthesis
-> explicit human approval before commit/push or external action
```

### Work-Class Routes

| Work class | Current route shape |
| --- | --- |
| Micro | minimal context, implicit or one-line boundary, direct edit, smallest verification or documented inspection |
| Tiny | context, lightweight boundary, direct edit or execution, verification, doc sync only if dirty surfaces require it |
| Standard | context, optional pattern/tool/agent strategy, requirements source, implementation plan, safe boundary, execution, verification, spec/code review, dirty-doc updates |
| High-risk | all relevant gates, none skipped silently; security/privacy/data/contract/release/rollback review as applicable |
| Exploratory | context and tools, product/model exploration when needed, spike boundary, findings evidence, recommended next classification |
| Review-only | context, optional agent strategy, review references, verification only if safe and needed |
| Release/handoff | verification, release/readiness review, status hygiene, QA/handoff packet, explicit human approval for Git publication |

### Phase Ownership

| Phase | Owner |
| --- | --- |
| Top-level orchestration | `run-sdlc` |
| Work class, risk, dirty surfaces, gates | `classify-work` |
| Context restore/save/update/assertion | `context` |
| Product, PRD, issues, contracts, implementation plans | `planning` |
| Safe edit boundary, execution, TDD, diagnosis, implementation patterns | `implementation` |
| Verification, evidence, rendered evidence, health checks | `quality` |
| Spec/code/UX/security/agent/release/readiness review | `review` |
| Branch finish, release documentation, final Git handoff | `release` |
| Agent strategy, model tiers, runtime adapters, portable roles | `agents` |
| Tool/MCP/retrieval trust boundaries | `tools` |
| Process feedback and durable workflow improvements | `process-learning` |
| Skill-pack improvement cycles | `sdlc-process-improvement` |

### Agent Delegation Flow

```text
Parent agent classifies work and selects route
-> parent decides whether delegation reduces risk or context load
-> parent selects portable role and runtime adapter
-> parent provides repository boundary, allowed context, tool/MCP scope, write scope, Git authority, evidence expectations, and stop conditions
-> child agent returns role output, evidence, caps, and feedback draft when applicable
-> parent reconciles outputs against source artifacts and deterministic evidence
-> parent performs final human-facing recommendation
```

### Source-Of-Truth Stack

From strongest to weakest for SDLC behavior:

1. User request and explicit human approvals.
2. Repo-local source artifacts: code, tests, docs, contracts, issue/PRD/model artifacts, `AGENTS.md`.
3. Current runtime and tool evidence.
4. Router skills and selected references.
5. Portable agent definitions in `agents/`.
6. Downstream project `docs/agents/*`.
7. Runtime adapters such as `~/.codex/agents/*.toml`.
8. Process-learning events, feedback drafts, and historical run notes.

Runtime adapters should never silently outrank portable roles or repo-local source truth.

## Findings

### F1. Public Workflow Docs Still Expose Consolidated Skill Names As Direct Skills

Severity: High

Evidence:

- Current top-level skills are router-oriented: `agents`, `implementation`, `quality`, `review`, `tools`, `planning`, `process-learning`, etc.
- `WORKFLOW.md` still lists old direct skill names such as `choose-agent-strategy`, `choose-implementation-pattern`, `select-tools`, `select-context`, `write-implementation-plan`, `review-implementation-plan`, `verification-before-completion`, `review-agent-work`, `update-agent-definitions`, and `capture-process-event`.
- Those names now mostly exist as router-local references, not top-level skills.

Risk:

Developers may ask Codex or another runtime for a named skill that is not directly available. The runtime may fail discovery, choose a weaker fallback, or load broad process context to compensate.

Recommendation:

Create a public-doc cleanup pass that rewrites direct old skill names to router plus reference language. Example:

```text
agents -> choose-strategy reference
review -> agent-work reference
process-learning -> capture-event reference
implementation -> safe-edit-boundary reference
quality -> verification-before-completion reference
```

Keep the old names only as conceptual aliases where useful, and label them as references rather than direct skills.

### F2. Prompt Templates Lag The Portable Agent Feedback Contract

Severity: High

Evidence:

- Portable agents now include `SDLC feedback draft:` in their output contracts.
- Codex adapters ask agents to include a feedback draft when meaningful process friction or tool/runtime evidence appears.
- Several prompt templates under `templates/prompts/sdlc/` do not include `SDLC feedback draft:` in their return shape. The verification prompt is a clear example: its return packet ends at `Recommended next action:`, while `agents/verification-worker.md` requires a feedback draft when friction, caps, skipped evidence, or runtime issues appear.

Risk:

Parent-authored prompts can accidentally suppress the feedback block even when role definitions require it. This already appeared during Cycle 6, when the verification worker omitted the requested feedback draft.

Recommendation:

Update every role prompt template to include the same feedback draft field and condition used by the portable role. Then add a lightweight lint check for prompt templates that implement portable roles but omit the feedback field.

### F3. Agent Response Packet Contracts Are Split And Uneven

Severity: Medium

Evidence:

- `docs/process-improvement/agent-response-packet-contract.md` contains the richer Cycle 1 candidate contract with required fields such as `scopeHandled`, `structuredClaims`, `boundaryCheck`, and `capsRisks`.
- `templates/docs/agents/agent-response-packet-contract.md` contains a shorter downstream template with similar but less precise fields.
- Portable agents use role-specific output blocks rather than the shared response packet shape.

Risk:

Downstream projects may receive a weaker or older packet contract than the skills pack is internally using. Orchestrators then have to reconcile multiple handoff shapes manually.

Recommendation:

Promote one canonical response-packet contract into a router-owned reference or template, then make portable agent outputs either conform to it or explicitly extend it. Keep the downstream template generated from that source.

### F4. Agent Catalog Contains Conceptual Roles That Do Not Yet Have Portable Agents

Severity: Medium

Evidence:

`templates/docs/agents/agent-catalog.md` lists roles such as:

- `test-engineer`
- `spec-compliance-reviewer`
- `code-quality-reviewer`
- `contract-reviewer`
- `production-readiness-reviewer`
- `doc-sync-reviewer`

The portable `agents/` directory does not define those as separate agents. Their behavior currently lives mostly under the `review`, `quality`, `planning`, and `context` routers.

Risk:

This can be good conceptual coverage, but it is ambiguous whether those roles are planned future agents, router references, or downstream-only labels. Developers may expect adapters or subagents that do not exist.

Recommendation:

Add a status column or section to the downstream catalog:

```text
Portable agent / Router reference / Conceptual downstream role / Future candidate
```

Do not create all of these as agents by default. Prefer router references until repeated evidence shows a distinct delegated role prevents failures.

### F5. Naming Drift: `context-explorer` Versus `context-scout`

Severity: Medium

Evidence:

- Portable role: `context-scout`
- Codex agent: `sdlc_context_scout`
- Downstream catalog heading: `context-explorer`

Risk:

This is small but user-facing. It makes mappings harder to scan and can confuse install/test expectations.

Recommendation:

Choose one public role name. Prefer `context-scout` because it now exists as the portable file and Codex adapter. If `context-explorer` remains, mark it as an alias.

### F6. Runtime Adapter Duplication Is Mostly Intentional, But Needs Drift Checks

Severity: Medium

Evidence:

Each Codex adapter repeats:

- portable source pointer,
- model,
- sandbox mode,
- forbidden actions,
- feedback submission rule,
- role summary.

This is expected for runtime compatibility, but there is no visible automated check that adapter role names, portable source paths, or feedback clauses stay aligned with `agents/*.md`.

Risk:

The Cycle 6 catalog-mapping gap showed this class of drift is realistic. Future role changes can leave adapters stale even if TOML syntax still parses.

Recommendation:

Add an `sdlc agents lint` or repo validation check that compares:

- every portable role expected in `bounded-agent-catalog.md` has a matching Codex adapter when the frontier roster claims one,
- adapter `Portable source` exists,
- adapter name matches the filename convention,
- feedback parent-mediated rule appears in all SDLC adapters,
- sandbox mode is no broader than the portable role's default access.

### F7. Setup Guidance Still Mentions Older LM Studio Cap In A Narrow Place

Severity: Low

Evidence:

`setup-sdlc-in-repo` correctly says the LM Studio-pinned custom agent remains experimental and direct local runs should use `codex exec --oss --local-provider lmstudio`. Cycle 6 created frontier agents and deferred LM Studio.

Risk:

This is not wrong, but the setup skill's final paragraph is now denser than it needs to be. It mixes hosted frontier install guidance, local inherited provider guidance, and the LM Studio exception in one block.

Recommendation:

Split Codex setup guidance into:

1. hosted frontier default,
2. local-provider inherited scout,
3. LM Studio pinned adapter cap and direct `codex exec` fallback.

### F8. Helper CLI Surface Is Powerful But Hard To Mentally Bound

Severity: Medium

Evidence:

`run-sdlc/SKILL.md`, `README.md`, and `scripts/sdlc/lib/cli.mjs` expose a very broad helper command surface. The README now provides simple shortcuts, but the expert surface remains large.

Risk:

The helper CLI can reduce context load for experienced users, but new developers may perceive it as a mandatory command matrix rather than optional affordances. Agents may also run too many helper commands when the task is small.

Recommendation:

Keep the simple front door as canonical:

```text
sdlc start
sdlc next
sdlc prove
sdlc qa-ready
sdlc finish-ready
```

Move expert command lists behind `sdlc help expert` and route recipes. Public docs should emphasize "the agent chooses the small route" more than exhaustive command capability.

### F9. Legacy Compatibility Reference May Be Stale

Severity: Low

Evidence:

`README.md` mentions `agent-contracts/` as a legacy compatibility surface. The current inspected tree did not show an `agent-contracts/` directory in the tracked inventory.

Risk:

This looks like a leftover from earlier cycles. It can make users search for a missing directory.

Recommendation:

Either restore the directory if still needed, remove the README entry, or mark it as historical/removed.

## Intentional Duplication To Preserve

Not all duplication is harmful. These repetitions are useful and should remain, with drift checks:

- Portable agent files repeat common headings so every role is reviewable in isolation.
- Runtime adapters repeat boundary and forbidden-action language because the runtime needs a self-contained instruction file.
- Downstream `docs/agents/*` repeats strategy concepts because product repositories should not need to load the entire skills pack to understand local agent policy.
- `README.md`, `SUMMARY.md`, and `WORKFLOW.md` overlap because they serve different readers: quick start, baseline summary, and workflow map.

## Shortcomings Or Missing Capabilities

### Missing Automated Drift Detection

The pack validates skill frontmatter and TOML syntax, but it does not yet validate semantic alignment across:

- portable role files,
- bounded agent catalog,
- Codex adapters,
- downstream agent catalog,
- prompt templates,
- response packet templates.

This is the most valuable next automation target.

### No Canonical Role-To-Prompt Matrix

There is no single table that says:

```text
portable role -> prompt template -> Codex adapter -> downstream catalog role -> model tier
```

Cycle 6 partially filled this in through the catalog and install helper, but a matrix would make future role additions less error-prone.

### Feedback Contract Is Not Enforced

The feedback model is now clear: child agents draft, parent submits. However, prompt templates and tests do not enforce this consistently. A simple text-level lint would catch most misses.

### Public Docs Need A Consolidation Pass

The router consolidation succeeded structurally, but public docs still read partly like the pre-consolidation skill set. This is the biggest user-facing clarity issue.

## Recommended Next Steps

1. Public-doc consolidation cleanup:
   - Rewrite `README.md`, `SUMMARY.md`, `WORKFLOW.md`, and `templates/AGENTS.md` references from old direct skill names to current router/reference names.
   - Keep old names only as aliases where useful.

2. Add a role matrix:
   - Create `docs/process-improvement/agent-role-matrix.md` or a maintained section in `skills/agents/references/bounded-agent-catalog.md`.
   - Include portable file, Codex adapter, prompt template, downstream catalog role, model tier, default access, and status.

3. Align prompt templates:
   - Add `SDLC feedback draft:` to role prompt return blocks where missing.
   - Add tester entry path to QA prompt templates if a QA-specific prompt is introduced later.

4. Canonicalize response packets:
   - Promote the richer Cycle 1 contract or merge it with the downstream template.
   - Decide whether portable agents should share a common wrapper plus role-specific fields.

5. Add deterministic drift checks:
   - Adapter-to-role source path exists.
   - Frontier install list matches expected hosted adapters.
   - Catalog mappings match adapters.
   - Role prompt templates include required feedback and boundary fields.

6. Clarify conceptual roles:
   - Mark downstream catalog roles as `portable agent`, `router reference`, `conceptual role`, or `future candidate`.
   - Do not create agents for every reviewer concept until repeated evidence shows delegation value.

## Review Verdict

Verdict: pass-with-findings

The SDLC process is functionally coherent after Cycle 6. The frontier agent roster is present and validated. The main risk is documentation and template drift around the router consolidation and feedback contract, not a missing core process.

The next improvement cycle should be a consolidation and linting cycle rather than another agent expansion cycle.

## Cycle 7 Implementation Plan

Research grounding:

- NIST SSDF supports integrating secure practices into the SDLC with risk-based prioritization and continuous improvement rather than treating security as a separate checklist.
- OWASP SAMM supports lifecycle-wide, technology-agnostic, risk-driven software assurance improvement.
- Agile principles support working software as the primary progress measure, technical excellence, simplicity, and regular reflection.

Improvement hypothesis:

If public docs, role prompts, response packets, and adapter validation are aligned around the router/reference architecture and parent-mediated feedback contract, then future agents and Codex users will have less workflow confusion, fewer missing feedback drafts, and earlier detection of role/adapter drift without adding heavy process.

Failure mode classification:

- tool/runtime mismatch,
- poor handoff,
- stale evidence,
- over-process risk,
- missing deterministic validation.

Selected approach:

Implement a focused consolidation:

1. Rewrite public workflow surfaces away from obsolete direct skill names and toward current router/reference ownership.
2. Align role prompt templates with portable role output contracts.
3. Promote the downstream response-packet template to include structured claims, boundary checks, caps, and feedback draft behavior.
4. Mark downstream catalog roles as portable agents, router references, conceptual aliases, or future candidates.
5. Add deterministic `scripts/test-agent-contracts.mjs` validation for adapter/source/prompt/catalog drift.

Process weight budget:

- New commands: one validation command, `node scripts/test-agent-contracts.mjs`.
- New concepts: none; the change clarifies existing router/reference and parent-mediated feedback concepts.
- New files/artifacts: one small validation script.
- New human approvals: none beyond the existing commit/push gate.
- Removed complexity: public docs no longer present old reference names as direct top-level skills.
- Net process weight: neutral to lighter; one check replaces repeated manual drift inspection.

Quality oracle ladder:

- Best proof: deterministic lint catches known drift classes and standard docs/skill checks pass.
- Good proof: targeted `rg` checks show public docs no longer present old direct skill names as callable top-level skills.
- Fallback proof: manual inspection of changed public docs and prompt templates.
- Do not claim: downstream project adoption is proven without a separate downstream pilot.

Acceptance criteria:

- Public docs use current router/reference language for process ownership.
- Role prompt templates include `SDLC feedback draft:` and the condition for producing one.
- Downstream response packet contract includes feedback draft and parent-mediated submission rules.
- Catalog conceptual roles are not mistaken for installed portable agents.
- New deterministic contract check passes.
- Existing repo validation passes.

## Cycle 7 Implementation Result

Implemented changes:

- Rewrote public workflow surfaces to describe top-level routers and selected references instead of obsolete direct skill names.
- Removed a stale `agent-contracts/` README entry.
- Aligned role prompt templates with the portable-agent feedback draft contract.
- Updated the downstream agent response packet contract with structured claims, boundary checks, caps, and parent-mediated feedback rules.
- Marked downstream catalog roles as portable agents, router references, conceptual aliases, or future candidates.
- Added a role/source matrix to `skills/agents/references/bounded-agent-catalog.md`.
- Added `scripts/test-agent-contracts.mjs` and included it in the repository maintenance validation checklist.
- Standardized `agents/feedback-reporter.md` on the same "Do not submit feedback directly" hard-rule wording as the other portable agents.
- Captured a sanitized local feedback event with `sdlc feedback add`.

Validation evidence:

```text
git diff --check
node scripts/test-skill-files.mjs
node --check scripts/test-agent-contracts.mjs
node scripts/test-agent-contracts.mjs
node scripts/sdlc/sdlc.mjs feedback validate --repo .
control-character scan over docs, skills, agents, templates, and the new script
targeted retired-name scan over public/template docs
git status --short --branch
```

Observed validation result:

- Skill file check passed for 22 files.
- Agent contract check passed.
- Feedback validation reported 25 valid events and 0 invalid events.
- Control-character scan returned no matches.
- Retired direct-skill-name scan returned no matches in the public/template surfaces checked.

Deferred:

- No downstream repository pilot was run in this cycle.
- No new prompt templates were added for context scout, read-only scout, implementation planner, security/privacy reviewer, QA handoff worker, or feedback reporter.
- The remaining reference names `safe-edit-boundary`, `execute-plan`, and `verification-before-completion` appear only as explicitly labeled router references in `WORKFLOW.md`.
