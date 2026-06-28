# AirteraCode Feedback Improvement Implementation Plan

Plan status: Draft
Work class and risk level: Standard, medium risk
Target issue or task: Convert reviewed standard MCP/context-engine feedback from June 18-26, 2026 into a bounded context-engine improvement plan.

## Scope

This plan targets the AirteraCode context-engine repository at `/Users/jerrickvandiver/context-engine`.

Primary feedback source:

- Postgres table `outcome_feedback`
- Unreviewed standard MCP/context-engine rows: 41 of 53
- Dominant feedback kinds: `missing_context`, `outcome`, `test_result`, `agent_diff`

Out of scope:

- SDLC process workflow changes except routing SDLC-shaped feedback away from standard `outcome_feedback`
- Product repository fixes in ReactUI, MainsiteCoreAPI, www_dev, or engineering-context
- New retrieval infrastructure, new database services, or broad schema redesign

Related guidance:

- [AirteraCode Feedback Loop Guide](airteracode-feedback-loop-guide.md)
- [SDLC Feedback Contract](sdlc-feedback-contract.md)

## Related Contract Spec

Not required for external API behavior unless MCP tool response schemas change. If a slice changes public MCP response fields, update the relevant tool contract/tests in context-engine before implementation.

## Assumptions

- Postgres remains the context-engine backing store.
- `outcome_feedback` remains the standard MCP/context-engine raw feedback inbox.
- `sdlc_feedback` remains separate from context-engine feedback.
- Local Git status is the most trusted source for current worktree dirtiness when index overlay state is stale or unavailable.
- Generated artifacts should not disappear from search entirely, but operational/runbook queries should strongly prefer source docs and configuration files.

## Human Attention Items

Recommended default unless corrected:

Question: Should the first implementation cycle prioritize freshness/path correctness before ranking quality?
Recommendation: Yes. Implement workspace freshness and path normalization first.
Why this fits current evidence: The highest-risk feedback says agents may trust stale or empty slices and incorrect clean-worktree overlay state.
Tradeoff or risk: Ranking improvements will wait one cycle, but correctness failures carry higher risk than noisy retrieval.
Default action if approved or not corrected: Execute Slice 1 and Slice 2 before ranking changes.

Question: Should standard MCP feedback rows that are clearly SDLC runtime/process results be migrated automatically?
Recommendation: No automatic migration in the first pass. Add routing warnings and leave historical rows intact until reviewed.
Why this fits current evidence: Rows 21-25 are SDLC-shaped, but automatic migration can hide audit history.
Tradeoff or risk: Manual review must clean old rows later.
Default action if approved or not corrected: Add validation/reporting that flags likely wrong-loop rows for review.

Needs decision before work:

Question: Should `refresh_workspace` perform live Git status checks for every call, or only when explicitly requested/when overlay claims clean state?
Recommendation: Start with conditional live Git checks when overlay reports clean state for a configured local checkout and the request is for worktree mode or `force=true`.
Why this fits current evidence: This directly addresses false-clean reports while limiting per-call cost.
Tradeoff or risk: Conditional checks are more complex than always checking; always checking may be slower on large repos.
Default action if approved: Implement conditional live Git checks with timing in telemetry.

## Files To Modify

Likely context-engine files:

- `ctx-mcp/mcp_server/workspace.py`: path resolution, workspace refresh execution, tool response diagnostics.
- `ctx-mcp/mcp_server/tools.py` or tool registration modules: response shaping and feedback routing warnings where applicable.
- `ctx-mcp/mcp_server/sdlc_feedback.py`: only if routing warnings or helper utilities need shared constants.
- `ctx-indexer/indexer/feedback_lifecycle.py`: add report grouping for likely wrong-loop rows and active repeated themes.
- `ctx-indexer/indexer/*retrieval*` or ranking modules: task-sensitive retrieval boosts and generated-artifact suppression.
- `migrations/*`: only if new persisted status fields are required; avoid schema changes unless tests prove current fields cannot represent the behavior.
- `tests/test_*workspace*.py`, `tests/test_phase*_mcp_tools.py`, `tests/test_feedback_lifecycle.py`, `tests/test_sdlc_feedback.py`: regression coverage.

Files expected not to change:

- Product repositories (`ReactUI`, `MainsiteCoreAPI`, `www_dev`) except as read-only fixtures if explicitly approved.
- Token files under `ctx/secrets`.
- `.agents` runtime skills beyond follow-up documentation after implementation evidence exists.

## Slice 1: Workspace Freshness And Dirty-State Truth

Problem:
`refresh_workspace` has repeatedly returned `refresh_status: ok` with `overlay_layers` showing zero worktree/staged/untracked changes while local Git showed modified files.

Approach:

1. Add a focused stale-overlay detector for configured local checkouts.
2. When `refresh_workspace(force=true)` or worktree-aware requests report clean overlay state, compare against a bounded live Git status check.
3. Return explicit diagnostics when overlay state and live Git disagree.
4. Make local Git status the stated source of truth in the response when disagreement exists.
5. Record telemetry for disagreement count and check duration.

Acceptance criteria:

- A dirty ReactUI-style fixture reports nonzero dirty state or an explicit `overlay_status: stale_or_unavailable`.
- A clean fixture remains clean without warning.
- Tool response never implies a clean worktree when live Git says modified files exist.
- Tests cover staged, unstaged, and untracked files.

Verification:

```bash
cd /Users/jerrickvandiver/context-engine
PYTHONPATH=ctx-mcp:ctx-indexer:. .venv/bin/python -m pytest tests/test_phase25_mcp_tools.py tests/test_feedback_lifecycle.py -q
```

## Slice 2: Windows And Multi-Repo Path Normalization

Problem:
Feedback reports `repo_not_found`, stale `/Users/...` paths, failed slices for existing files, and poor behavior for `C:\WebSite`, `C:\WebSite\ReactUI`, `engineering-context`, `MainsiteCoreAPI`, and `www_dev`.

Approach:

1. Centralize path normalization for:
   - Windows drive-letter paths,
   - POSIX paths,
   - repo-prefixed relative paths,
   - multi-repo workspace roots.
2. When a workspace root contains multiple known child repos, return a diagnostic listing candidate repos instead of a bare `repo_not_found`.
3. Prefer configured checkout aliases over stale physical paths when resolving `get_file_slice`.
4. Include `requested_path`, `resolved_repo`, `normalized_path`, and `content_status` in slice responses.
5. Add regression fixtures for the known repo names from feedback.

Acceptance criteria:

- `get_file_slice` resolves existing files from both Windows-style and repo-relative paths.
- `engineering-context` is treated as a concrete repo when configured.
- Multi-repo roots produce actionable candidate repo diagnostics.
- Empty/missing slices include a reason that distinguishes missing file, stale index, generated/ignored file, and unsupported path.

Verification:

```bash
cd /Users/jerrickvandiver/context-engine
PYTHONPATH=ctx-mcp:ctx-indexer:. .venv/bin/python -m pytest tests/test_phase2_mcp_tools.py tests/test_phase25_mcp_tools.py tests/test_index_status.py -q
```

## Slice 3: `get_file_slice` Freshness And Response Reliability

Problem:
Rows report stale content after edits, path-only responses, empty slices after refresh, slow C# slices, and file-not-found for existing files.

Approach:

1. Add `content_status` to `get_file_slice` responses if not already stable enough:
   - `current`
   - `stale_index`
   - `worktree_unavailable`
   - `file_not_found`
   - `empty_range`
   - `generated_or_ignored`
2. For `workspace_mode=worktree`, prefer direct local file reads when the configured checkout is available.
3. If falling back to indexed content, disclose that fallback in the response.
4. Add timeout and partial-result behavior for expensive file slice paths.

Acceptance criteria:

- After editing a fixture file and forcing refresh, worktree mode returns current content or an explicit unavailable/stale status.
- Existing files do not return path-only content.
- C# and JSX slice fixtures return requested line ranges with bounded latency.

Verification:

```bash
cd /Users/jerrickvandiver/context-engine
PYTHONPATH=ctx-mcp:ctx-indexer:. .venv/bin/python -m pytest tests/test_bytes.py tests/test_phase25_mcp_tools.py -q
```

## Slice 4: Retrieval Ranking For Runbooks, Docs, And Exact Implementation Files

Problem:
Operational docs, AGENTS deployment guidance, publish profiles, package scripts, exact C# helpers, FRG helper ASP files, and engineering-context docs are often missed or buried by unrelated chunks.

Approach:

1. Add task-sensitive boosts for deployment/runbook queries:
   - `AGENTS.md`
   - engineering-context docs
   - `package.json` scripts
   - `*.pubxml`
   - webpack publish config
   - deployment docs and runbooks
2. Add exact implementation boosts for:
   - C# controller/helper/test symbols,
   - route fragments and HTTP method attributes,
   - classic ASP helper filenames and include relationships,
   - React component/action-row filenames.
3. When `repo_path` is specified, penalize unrelated repos unless cross-repo expansion is explicitly useful.
4. Add search explanations showing why a top result was ranked.

Acceptance criteria:

- Deployment query fixtures surface AGENTS/runbook/config artifacts above generated bundles.
- LC-style C# and classic ASP query fixtures surface exact helper/controller files in the top results.
- Engineering-context queries return engineering-context docs or say the repo is unavailable.

Verification:

```bash
cd /Users/jerrickvandiver/context-engine
PYTHONPATH=ctx-mcp:ctx-indexer:. .venv/bin/python -m pytest tests/test_phase2_mcp_tools.py tests/test_cards.py tests/test_ingest_tree.py -q
```

## Slice 5: Generated-Artifact Suppression For Search And Trace

Problem:
Deployment/runbook searches are noisy because generated bundles, minified assets, hashed Webpack output, dependency manifests, and published API output dominate results.

Approach:

1. Add generated-artifact classification during indexing or query-time ranking.
2. Suppress generated artifacts by default for runbook/deployment/context discovery queries.
3. Keep an escape hatch to include generated artifacts when the task asks about bundle output, deployed artifact verification, or source-map/runtime behavior.
4. Surface a count of suppressed generated results when suppression materially changes ranking.

Acceptance criteria:

- SSM/deployment query fixtures rank runbooks and config above generated bundles.
- Bundle-specific queries can still retrieve generated assets when requested.
- Responses disclose when generated artifacts were suppressed.

Verification:

```bash
cd /Users/jerrickvandiver/context-engine
PYTHONPATH=ctx-mcp:ctx-indexer:. .venv/bin/python -m pytest tests/test_typescript_import.py tests/test_phase2_mcp_tools.py -q
```

## Slice 6: Trace And Grep Precision

Problem:
`trace_feature` and `grep_index` return unrelated repos or miss useful React/C# routes and implementation relationships.

Approach:

1. Extend existing accepted issues:
   - `trace-feature-react-flow-seeding`
   - `controller-route-fragment-indexing`
2. Add seeds for React components/hooks/action rows, C# controllers/helpers/DI implementations, and classic ASP include/helper relationships.
3. Make `grep_index` degrade with partial results rather than HTTP 500 where feasible.
4. Add repo-scoped tests to prevent unrelated monorepo results from outranking exact target repo hits.

Acceptance criteria:

- React flow fixtures produce relevant component/action path traces.
- C# route fragment fixtures find controller methods and helper implementations.
- Classic ASP helper fixtures include direct helper/include candidates.
- Targeted `grep_index` failures return structured partial/failure information, not an opaque HTTP 500.

Verification:

```bash
cd /Users/jerrickvandiver/context-engine
PYTHONPATH=ctx-mcp:ctx-indexer:. .venv/bin/python -m pytest tests/test_phase2_mcp_tools.py tests/test_asp_import.py tests/test_roslyn_import.py -q
```

## Slice 7: Feedback-Loop Routing Guard

Problem:
Some SDLC runtime/process feedback landed in standard `outcome_feedback`. That makes context-engine review noisy and hides SDLC workflow signals from `sdlc_feedback`.

Approach:

1. Add lifecycle report detection for likely wrong-loop rows:
   - `system: "sdlc"`
   - cycle/runtime scout fields,
   - route-fit/process-friction fields matching `airtera.sdlc.feedback.v1`
2. Add a warning to the `feedback` MCP tool response when payload shape appears SDLC-specific.
3. Do not reject or migrate in v1; return guidance to use `sdlc_feedback` next time.
4. Add a report section for wrong-loop candidates.

Acceptance criteria:

- Submitting SDLC-shaped payload to standard `feedback` returns a non-blocking warning.
- `feedback_lifecycle report` groups wrong-loop candidates.
- Existing standard feedback behavior remains compatible.

Verification:

```bash
cd /Users/jerrickvandiver/context-engine
PYTHONPATH=ctx-mcp:ctx-indexer:. .venv/bin/python -m pytest tests/test_feedback_lifecycle.py tests/test_sdlc_feedback.py tests/test_phase2_mcp_tools.py -q
```

## Test-First Plan

Use test-first implementation per slice:

1. Write a failing regression test from one or two representative feedback rows.
2. Implement the smallest code change.
3. Re-run the focused test.
4. Run the broader verification group for the slice.
5. Link the original `outcome_feedback` rows to a reviewed `feedback_issue`.

TDD exception:
Ranking changes may need a small fixture/golden update before the implementation is clear. In that case, first add an explicit failing expectation in the nearest existing retrieval test.

## Feedback Lifecycle Updates

Before coding:

```bash
cd /Users/jerrickvandiver/context-engine
PYTHONPATH=ctx-indexer:. .venv/bin/python -m indexer.feedback_lifecycle --database ctx report
```

For each accepted cluster:

1. Create or update a `feedback_issue`.
2. Link representative `outcome_feedback` rows.
3. Mark implemented only after a commit exists.
4. Mark verified only after focused and regression tests pass.

Candidate issues:

| Issue key | Source rows | Priority | Action |
| --- | --- | --- | --- |
| `workspace-overlay-refresh-visibility` | 20, 32, 37, 43, 50, 52 | high | Continue accepted issue; implement Slice 1. |
| `windows-multirepo-path-normalization` | 14, 15, 17, 19, 27, 30, 31, 38, 45 | high | Create follow-up issue; implement Slices 2 and 3. |
| `runbook-doc-ranking` | 16, 28, 33, 47 | high | Create issue; implement Slice 4. |
| `generated-artifact-search-noise` | 29 | normal | Create issue if reproduced; implement Slice 5 after Slice 4. |
| `implementation-symbol-routing-precision` | 41, 44, 46, 48 | high | Extend accepted indexing/trace issues; implement Slice 6. |
| `feedback-loop-routing-guard` | 21, 22, 23, 24, 25 | normal | Create issue; implement Slice 7. |

## Security And Privacy

- Do not query or print token files.
- Do not dump raw `notes` in user-facing reports unless sanitized and needed.
- Keep database queries read-only except lifecycle commands explicitly creating/linking reviewed feedback issues.
- Generated-artifact suppression must not hide security-relevant generated files when the user asks about deployed/runtime output.
- Path diagnostics must avoid exposing secrets or private token paths.

## Production Readiness

Release boundary:

- One context-engine branch and PR for Slices 1-3 if possible.
- Separate PR for ranking/suppression Slices 4-6.
- Separate small PR for feedback-loop routing guard if it touches MCP tool responses.

Rollback:

- Freshness/path changes: revert the PR; local shell/Git remains fallback.
- Ranking changes: disable boosts/suppression behind config or revert ranking patch.
- Feedback routing guard: downgrade warning to report-only if clients are confused.

Observability:

- Log overlay/live-Git disagreement counts.
- Include generated-artifact suppression counts in debug/explanation output.
- Report wrong-loop feedback candidates in lifecycle reports.

## Verification Commands

Focused commands are listed per slice. Final context-engine verification before merge:

```bash
cd /Users/jerrickvandiver/context-engine
PYTHONPATH=ctx-mcp:ctx-indexer:. .venv/bin/python -m pytest tests/test_sdlc_feedback.py tests/test_feedback_lifecycle.py tests/test_phase2_mcp_tools.py tests/test_phase25_mcp_tools.py tests/test_knowledge_candidates.py -q
```

If DB-backed tests or migrations are touched:

```bash
cd /Users/jerrickvandiver/context-engine
PYTHONPATH=ctx-mcp:ctx-indexer:. .venv/bin/python -m pytest tests/test_index_status.py tests/test_drift.py tests/test_retention.py -q
```

If indexing/ranking changes are touched:

```bash
cd /Users/jerrickvandiver/context-engine
PYTHONPATH=ctx-mcp:ctx-indexer:. .venv/bin/python -m pytest tests/test_asp_import.py tests/test_roslyn_import.py tests/test_typescript_import.py tests/test_cards.py tests/test_ingest_tree.py -q
```

## Documentation Updates

Context-engine docs:

- Update `IMPLEMENTATION.md` feedback lifecycle section with any new issue keys and review flow changes.
- Update `OPERATIONS.md` if `refresh_workspace` diagnostics or runbook-query behavior changes.
- Add examples for interpreting `content_status`, stale overlay warnings, and generated suppression counts.

Skills pack docs:

- Update [AirteraCode Feedback Loop Guide](airteracode-feedback-loop-guide.md) only after implementation proves any new review commands or lifecycle behavior.
- Do not duplicate context-engine operational details in reusable SDLC skills.

## Artifact Lifecycle

This plan is a durable process-improvement planning artifact until the context-engine issues are implemented or rejected. After closeout, keep a short implementation report and either:

- mark this plan superseded by the report, or
- remove it if all actionable details are represented in context-engine issues and docs.

## Safe-Edit Boundary

Implementation should edit only context-engine code, tests, migrations if required, and context-engine docs. Product repo files and token files are read-only unless a separate user-approved task changes that boundary.

## Checkpoints

1. After Slice 1-3 tests pass, review whether stale/freshness feedback rows can be linked and accepted as addressed.
2. After Slice 4-6 tests pass, run representative retrieval smoke queries against known feedback tasks.
3. After Slice 7, submit one dry-run or test feedback payload for each loop and confirm routing guidance.
4. Before merge, run final verification and produce a short feedback lifecycle disposition summary.

## Stop Conditions

Stop and ask for approval if:

- A migration is required for behavior that could be represented without schema changes.
- Live Git checks add unacceptable latency.
- Ranking changes require indexing new sensitive files or gitignored operational docs.
- Tool response schema changes would break existing MCP clients.
- Any test requires raw ticket text, secrets, customer data, or production database output.
