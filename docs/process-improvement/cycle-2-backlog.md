# Cycle 2 SDLC Backlog

Status: candidate backlog
Source: Cycle 1 dry-run validation against `DacService`

These items are not Cycle 1 blockers. They are deferred candidates to review during Cycle 2 planning.

## Candidates

### Mixed-Scope QA Mode

- Observation: A docs task with unrelated dirty source files correctly broadened from `tiny-docs` to `standard`, but the preflight still reported `QA mode: docs-process` while testing surfaces were `service-behavior, docs-process`.
- Why it matters: The route and human gate are correct, but the QA mode can understate the mixed dirty-tree condition until the task is scoped.
- Candidate improvement: When the effective route is broadened by unrelated dirty files and surfaces include both requested-task and dirty-tree surfaces, report `qaMode` as `mixed-scope` or `workflow` until `--files` scopes the task.
- Evidence: Dirty-tree preflight with changed source files `src/DacService.BLL/Models/Common/SiteType.cs` and `src/DacService.BLL/Models/EnrollmentResponse.cs`.
- Priority: low.
- Promotion state: candidate.

### Agent-Plan-Only Journal Completeness

- Observation: Running only `sdlc agents plan` creates a partial journal; `sdlc task journal-check` then warns that `promptAnalysis` and `localFirst` are missing.
- Why it matters: The warning is technically accurate, but it can look like a defect when an agent-plan-only run intentionally has not created the full dry-run packet.
- Candidate improvement: Either have `agents plan` preserve prompt/local-first data, or mark agent-plan-only journals as partial so `journal-check` can distinguish expected partial state from a quality gap.
- Evidence: `cycle-1-post-commit-wording` journal-check warned on missing `promptAnalysis` and `localFirst` after an agent-plan-only run.
- Priority: medium.
- Promotion state: candidate.
