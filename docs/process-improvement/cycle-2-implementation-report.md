# Cycle 2 Implementation Report

Status: Implemented for dry-run validation
Promotion state: Experiment
Parent plan: [cycle-2-measured-routing-response-validation.md](cycle-2-measured-routing-response-validation.md)
Last updated: 2026-06-19

## Improvement Scope

Implement Cycle 2 measured no-execution routing and response validation over the Cycle 1 dry-run control plane.

## Work Class

Standard SDLC process improvement.

## Failure Mode Addressed

- hidden assumption from docs/process tasks with unrelated non-doc dirty surfaces reporting only `docs-process`,
- poor handoff from agent-plan-only journals appearing incomplete,
- weak verification from delegated role responses lacking a checked response shape,
- stale evidence from advisory routing without route-fit/friction capture,
- tool/runtime mismatch from treating packet generation as execution evidence.

## What Changed

- `qaModeForSurfaces` now returns `mixed-scope` when docs/process and non-doc testing surfaces are both present.
- `sdlc qa mixed` is supported and generates a QA script that scopes docs/process and runtime surfaces separately.
- `sdlc agents plan` now emits a tier-routing receipt in JSON and Markdown.
- Normal written `sdlc agents plan` runs persist `promptAnalysis`, `localFirst`, `routingReceipt`, and a calibration next action in the journal.
- Generated agent packets include a tier-routing receipt and response-lint/calibration next-action guidance.
- `sdlc agents lint` checks for the tier-routing receipt in generated packets.
- `sdlc response lint --role-response` validates role response packets against required response fields and structured-claim hints.
- Calibration rows now accept optional `runtime`, `modelTier`, `retryCount`, `misrouteTax`, and `humanCorrection` fields.
- Added a generic fixture verify-only regression check for deterministic-tool-first verification routing.

Post-implementation correction:
Named personal fixture references were removed from reusable SDLC guidance and helper surfaces. Fixture validation now means an approved disposable fixture, configured pilot repository, or repo-local dry run selected for the current validation task.

## Files Changed

- `scripts/sdlc/lib/agentpackets.mjs`
- `scripts/sdlc/lib/calibration.mjs`
- `scripts/sdlc/lib/cli.mjs`
- `scripts/sdlc/lib/evidence.mjs`
- `scripts/sdlc/lib/help.mjs`
- `scripts/sdlc/lib/localreview.mjs`
- `scripts/sdlc/lib/qa.mjs`
- `scripts/sdlc/lib/scenarios.mjs`
- `scripts/sdlc/lib/units.mjs`
- `docs/process-improvement/cycle-2-measured-routing-response-validation.md`
- `docs/process-improvement/cycle-2-implementation-report.md`

## Evidence

Commands run:

```bash
node scripts/sdlc/sdlc.mjs agents plan --task "Cycle 2 routing receipt smoke" --repo . --json
node scripts/sdlc/sdlc.mjs scenario test --repo .
node scripts/sdlc/sdlc.mjs agents packet --role verification-worker --task "Cycle 2 routing receipt smoke" --repo . --dry-run --out /private/tmp/cycle2-routing-packet.md
node scripts/sdlc/sdlc.mjs agents lint --packet /private/tmp/cycle2-routing-packet.md --repo .
node scripts/sdlc/sdlc.mjs response lint --file .ai-local/sdlc-scratch/cycle2-good-response.md --role-response --repo . --json
node scripts/sdlc/sdlc.mjs response lint --file .ai-local/sdlc-scratch/cycle2-bad-response.md --role-response --repo . --json
node scripts/sdlc/sdlc.mjs agents plan --task "Cycle 2 agent plan journal smoke" --repo . --out /private/tmp/cycle2-agent-plan.md
node scripts/sdlc/sdlc.mjs task journal-check --task "Cycle 2 agent plan journal smoke" --repo . --json
node scripts/sdlc/sdlc.mjs qa mixed --task "docs update with unrelated source dirty files" --repo . --out /private/tmp/cycle2-mixed-qa.md
node --input-type=module -e 'import { qaModeForSurfaces } from "./scripts/sdlc/lib/units.mjs"; console.log(qaModeForSurfaces(["docs-process","service-behavior"], "docs update with unrelated source files"));'
node scripts/sdlc/sdlc.mjs calibrate add --route standard --route-fit right-sized --friction "route receipt and response lint smoke" --model-tier deterministic-tools --runtime manual-packet --out /private/tmp/cycle2-calibration.jsonl --repo .
```

Observed results:

- Agent-plan JSON includes `routingReceipt` with work class, risk signals, candidate tier, evidence contract, escalation triggers, fallback tier, and forbidden claims.
- Scenario test passed, including a generic fixture verify-only agent case with `verification-worker=recommended` and `tier=deterministic-tools`.
- Generated verification-worker packet lint passed.
- Good role response lint passed with `--role-response`.
- Bad role response lint blocked on missing required response fields and warned on unsupported test-pass language.
- Agent-plan-only journal check passed with `promptAnalysis` and `localFirst` present.
- Mixed docs/source surface inference returned `mixed-scope`.
- `sdlc qa mixed` generated a tester-readable mixed-scope QA script.
- Calibration row was written to `/private/tmp/cycle2-calibration.jsonl`.

## Quality Oracle Ladder

Best proof:
CLI smoke and scenario checks passed for routing receipt generation, packet lint, response role lint, journal completeness, and mixed-scope QA behavior.

Good proof:
Manual inspection of generated QA/script output confirms the new mode is human-readable and no runtime-agent execution was implied.

Fallback proof:
Manual-packet flow remains available and response fields can be checked from Markdown.

Unavailable proof:
Actual local model quality, token savings, runtime schema enforcement, write-capable delegation safety, and runnable fixture app behavior were not proven.

Do not claim:
Cycle 2 does not prove model promotion, learned routing, cost reduction, local-model safety, or production readiness.

## Fixture Validation

Fixture target:
Generic dry-run agent-routing scenario in the local scenario regression suite.

Changed SDLC behavior:
Tier-routing receipt and deterministic-tool-first verification recommendation.

Scenario exercised:
`approved fixture validation verify behavior`.

Expected evidence:
Route `standard`, `verification-worker` recommended, deterministic tool tier selected, no execution claim.

Actual evidence:
`scenario test` passed and reported `tier=deterministic-tools` for the generic fixture verify-only agent case.

Regression concerns:
This validates the dry-run routing/helper path, not a runnable fixture app.

Follow-up changes:
Use a configured disposable fixture or approved pilot repository in a later cycle before promoting routing behavior beyond Experiment.

## Process Weight And Adoption

New commands:
No new command group. Existing `qa`, `agents`, `response`, and `calibrate` surfaces were extended.

New concepts:
`mixed-scope` QA mode and tier-routing receipt.

Tiny-task bypass:
Agent packets remain optional; the routing receipt appears only when `agents plan` or `agents packet` is used.

No-install fallback:
Manual-packet fallback remains the baseline.

Net process weight:
Neutral-to-slightly-heavier for Standard+ delegated experiments, justified by measurable response and route-fit evidence.

## Rollback Path

- Revert `mixed-scope` handling in `units.mjs`, `qa.mjs`, `cli.mjs`, `help.mjs`, and `evidence.mjs`.
- Revert tier-routing receipt additions in `agentpackets.mjs` and scenario receipt checks in `scenarios.mjs`.
- Revert role-response checks in `localreview.mjs` while keeping the original final-response lint behavior.
- Revert optional calibration fields in `calibration.mjs`.
- Keep this report as historical evidence unless superseded.

## Human Approval Needed

Commit and push still require explicit human approval. No dependency install, runtime execution, local model invocation, MCP write, ticket write, deployment, migration, merge, release, or destructive command was performed.
