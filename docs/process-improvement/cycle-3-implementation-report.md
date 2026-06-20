# Cycle 3 Implementation Report

Status: Implemented for deterministic retrieval and drift validation
Promotion state: Experiment
Parent plan: [cycle-3-knowledge-retrieval-adaptivity.md](cycle-3-knowledge-retrieval-adaptivity.md)
Last updated: 2026-06-19

## Improvement Scope

Implement Cycle 3 knowledge retrieval and adaptivity helpers without adding retrieval infrastructure, MCP retrieval, local-model execution, learned routing, or automatic knowledge promotion.

## Work Class

Standard SDLC process improvement.

## Failure Mode Addressed

- wrong context from captured knowledge not yet being measured as retrieval pointer quality,
- stale evidence from knowledge candidates without drift/decay review,
- weak verification from candidate validation proving envelope shape but not retrieval usefulness,
- tool/runtime mismatch from seed model inventory being easy to overread as capability evidence,
- over-process risk from making retrieval machinery durable before the deterministic ruler exists.

## What Changed

- Added `sdlc eval retrieval-run`, `sdlc eval retrieval-report`, and `sdlc eval retrieval-add`.
- Added `sdlc eval retrieval-test` for negative retrieval regressions.
- Added built-in Stage 1 deterministic retrieval cases for knowledge-candidate, tier-routing, and eval-helper references.
- Added retrieval result metrics: hit@k, precision@k, candidate artifacts, expected artifacts, missing expected artifacts, overreturned context, context bytes, and caps.
- Added `sdlc learn candidate-drift` to report invalid envelopes, missing anchors, missing source/anchor paths, time-expired confidence, stored-hash mismatches, and hash-unavailable caps.
- Added `sdlc learn candidate-test` for malformed-candidate, missing-anchor, and hash-mismatch regressions.
- `sdlc learn candidate-add` now stores `sha256` for existing local file anchors.
- Added `sdlc models revalidate` to report unknown model/profile fields and calibration-derived revalidation signals without promoting model routing.
- Added [retrieval-eval-contract.md](retrieval-eval-contract.md).
- Added `templates/schemas/sdlc-retrieval-eval-case.schema.json`.
- Added `templates/scenarios/knowledge-retrieval-deterministic-floor.md`.
- Updated knowledge candidate and model drift contracts with the new reporting commands.
- Updated `scripts/sdlc/README.md` with the Cycle 3 helper surfaces.

## Files Changed

- `scripts/sdlc/lib/scenarios.mjs`
- `scripts/sdlc/lib/learning.mjs`
- `scripts/sdlc/lib/models.mjs`
- `scripts/sdlc/lib/cli.mjs`
- `scripts/sdlc/README.md`
- `docs/process-improvement/cycle-3-knowledge-retrieval-adaptivity.md`
- `docs/process-improvement/cycle-3-implementation-report.md`
- `docs/process-improvement/retrieval-eval-contract.md`
- `docs/process-improvement/knowledge-candidate-contract.md`
- `docs/process-improvement/model-capability-drift-revalidation.md`
- `templates/schemas/sdlc-retrieval-eval-case.schema.json`
- `templates/scenarios/knowledge-retrieval-deterministic-floor.md`

## Evidence

Commands run:

```bash
node --check scripts/sdlc/lib/scenarios.mjs
node --check scripts/sdlc/lib/learning.mjs
node --check scripts/sdlc/lib/models.mjs
node --check scripts/sdlc/lib/cli.mjs
node scripts/sdlc/sdlc.mjs eval retrieval-run --repo . --out /private/tmp/cycle3-retrieval-eval.md
node scripts/sdlc/sdlc.mjs eval retrieval-run --repo . --json
node scripts/sdlc/sdlc.mjs eval retrieval-test --repo . --json
node scripts/sdlc/sdlc.mjs eval retrieval-add --name "cycle3 ad hoc eval smoke" --query "Find retrieval eval contract references" --pattern "retrieval eval" --file /private/tmp/cycle3-retrieval-cases.jsonl --repo .
node scripts/sdlc/sdlc.mjs eval retrieval-run --file /private/tmp/cycle3-retrieval-cases.jsonl --no-defaults --repo . --out /private/tmp/cycle3-retrieval-ad-hoc.md
node scripts/sdlc/sdlc.mjs learn candidate-validate --file .ai-local/sdlc-cache/knowledge-candidates.jsonl --repo .
node scripts/sdlc/sdlc.mjs learn candidate-test --repo . --json
node scripts/sdlc/sdlc.mjs learn candidate-drift --repo . --out /private/tmp/cycle3-candidate-drift.md
node scripts/sdlc/sdlc.mjs learn candidate-drift --repo . --json
node scripts/sdlc/sdlc.mjs models revalidate --repo . --out /private/tmp/cycle3-model-revalidate.md
node scripts/sdlc/sdlc.mjs models revalidate --repo . --json
node scripts/sdlc/sdlc.mjs scenario test --repo .
```

Observed results:

- Syntax checks passed for `scenarios.mjs`, `learning.mjs`, `models.mjs`, and `cli.mjs`.
- Default retrieval eval ran three deterministic cases.
- Retrieval eval reported no missing expected artifacts.
- Knowledge-candidate and tier-routing retrieval cases exceeded the initial context byte budget and recorded caps instead of claiming clean context economy.
- Ad hoc retrieval-add wrote `/private/tmp/cycle3-retrieval-cases.jsonl`, and retrieval-run consumed it with `--no-defaults`.
- Retrieval regression checks confirmed impossible expected artifacts fail and semantic-tail cases cap instead of passing.
- Existing knowledge candidate fallback JSONL validated successfully.
- Candidate regression checks confirmed malformed candidates, missing anchors, and hash mismatches are caught.
- Candidate drift report found one current internal candidate and recorded a cap because no anchor hash was stored.
- Model revalidation report marked the seed Gemma profile `needs-revalidation` because key fields remain unknown and no calibration rows exist for the model/runtime.
- Scenario test passed, including the new retrieval deterministic floor checks.

## Quality Oracle Ladder

Best proof:
Current-repo deterministic retrieval eval and scenario tests passed, with explicit context-budget caps.

Good proof:
Candidate validation and candidate drift reports show the fallback envelope remains valid and non-authoritative.

Fallback proof:
Ad hoc JSONL retrieval cases under `/private/tmp` can run without MCP, local models, hosted services, or new dependencies.

Unavailable proof:
Semantic-tail retrieval quality, MCP retrieval ranking, local-model consolidation, learned routing, model promotion, and token/cost reduction were not proven.

Do not claim:
Cycle 3 does not prove knowledge content correctness, semantic retrieval improvement, model fitness, or local automation safety.

## Process Weight And Adoption

New commands:
Three eval actions, one learn action, and one models action under existing command groups.

New concepts:
Retrieval eval case, deterministic floor, context economy, candidate drift report, model revalidation report.

Tiny-task bypass:
No ordinary Micro/Tiny route is required to run retrieval eval or drift reports.

No-install fallback:
Local `rg`, JSONL, and Markdown reports remain the baseline. If `rg` is unavailable, retrieval cases are capped for manual grading.

Net process weight:
Neutral-to-slightly-heavier for SDLC maintainers, justified because Cycle 3 builds the measurement surface before retrieval automation.

## Validation Target

Current repository deterministic checks and dry-run/helper packets. No configured external fixture or MCP retrieval target was used.

## Acceptance Criteria Mapping

- No-install and local-first implementation: met.
- Retrieval output reported as pointer quality, not proof: met.
- Stage 1 deterministic query cases graded against local search: met.
- Reports include hit@k, precision@k, context bytes, missing expected artifacts, overreturned context, and caps: met.
- Knowledge candidate validation still passes valid fallback records: met.
- Drift reporting flags staleness/caps without promotion: met.
- Model revalidation emits prompts without scorecard or routing promotion: met.
- No MCP retrieval, local model execution, sensitive indexing, dependency install, write-capable delegation, commit, push, merge, deploy, or release occurred: met.

## Rollback Path

- Revert `eval retrieval-*` additions in `scripts/sdlc/lib/scenarios.mjs` and CLI routing.
- Revert `learn candidate-drift` additions in `scripts/sdlc/lib/learning.mjs` and CLI routing.
- Revert `models revalidate` additions in `scripts/sdlc/lib/models.mjs` and CLI routing.
- Remove retrieval eval contract, schema, scenario, and README/contract references.
- Keep this report as historical evidence unless superseded.

## Human Approval Needed

Commit and push still require explicit human approval. No dependency install, MCP retrieval, local model execution, external service, ticket/database access, deployment, migration, merge, release, or destructive command was performed.
