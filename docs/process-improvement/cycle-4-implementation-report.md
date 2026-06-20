# Cycle 4 Implementation Report

Status: Implemented for control-plane measurement helper; superseded as the default improvement loop by Cycle 4A passive feedback
Promotion state: Experiment
Parent plan: [cycle-4-measurement-pilot-read-only-counterpoint.md](cycle-4-measurement-pilot-read-only-counterpoint.md)
Last updated: 2026-06-19

## Improvement Scope

Implement the Cycle 4 measurement helper surface needed to compare baseline and helper-compiled treatment rows across the active repositories where the SDLC is used.

This implementation does not run the cross-repository pilot yet. It provides the row fields, aggregation report, and regression checks needed to run that pilot without adding write-capable delegation, learned routing, automatic knowledge promotion, or model/runtime invocation.

## Work Class

Standard SDLC process improvement.

## Failure Mode Addressed

- hidden assumption from treating `.agents` control-plane smoke evidence as proof that the SDLC reduces burden in downstream repositories,
- over-process from adding measurement ceremony without a compact aggregate report,
- poor handoff from scattered repo-local calibration rows,
- weak verification from claiming token or orchestration savings without baseline/treatment comparison,
- stale evidence from optional model/counterpoint decisions before role-specific smoke evidence exists.

## What Changed

- `sdlc calibrate add` now accepts Cycle 4 pilot fields:
  - `--repository-id`
  - `--task`
  - `--treatment baseline|treatment`
  - `--manual-action-count`
  - `--estimated-minutes`
  - `--token-turn-signal`
  - `--evidence-gap`
  - `--helper-reducible`
  - `--candidate-helper`
  - `--evidence-path`
  - `--accepted-counterpoint-findings`
  - `--rejected-counterpoint-findings`
  - `--semantic-tail-questions`
- Added `sdlc calibrate pilot-report` to aggregate one or more repo-local calibration JSONL files through `--inputs`.
- Added `sdlc calibrate pilot-test` to prove:
  - multi-repo baseline/treatment rows can pass,
  - missing treatment rows cap instead of passing,
  - `.agents`-only evidence caps because `.agents` is smoke evidence only.
- Updated the friction audit contract with Cycle 4 fields and helper examples.
- Updated CLI help and README command descriptions.
- Updated the Cycle 4 plan to mark implemented and record deferred optional slices.

## Files Changed

- `scripts/sdlc/lib/calibration.mjs`
- `scripts/sdlc/lib/cli.mjs`
- `scripts/sdlc/lib/help.mjs`
- `scripts/sdlc/README.md`
- `docs/process-improvement/sdlc-friction-token-human-orchestration-audit.md`
- `docs/process-improvement/cycle-4-measurement-pilot-read-only-counterpoint.md`
- `docs/process-improvement/cycle-4-implementation-report.md`
- `docs/process-improvement/codex-local-model-sdlc-overview.md`

## Evidence

Commands run:

```bash
node --check scripts/sdlc/lib/calibration.mjs
node --check scripts/sdlc/lib/cli.mjs
node scripts/sdlc/sdlc.mjs calibrate pilot-test --repo . --json
node scripts/sdlc/sdlc.mjs calibrate add --repository-id api-service --task "Cycle 4 pilot smoke api" --treatment baseline --route standard --route-fit right-sized --manual-action-count 6 --estimated-minutes 45 --token-turn-signal "baseline turns recorded" --friction "manual evidence translation" --helper-reducible yes --out /private/tmp/cycle4-pilot-smoke.jsonl --repo .
node scripts/sdlc/sdlc.mjs calibrate add --repository-id api-service --task "Cycle 4 pilot smoke api" --treatment treatment --route standard --route-fit right-sized --manual-action-count 4 --estimated-minutes 32 --token-turn-signal "treatment turns recorded" --friction "helper compiled evidence" --helper-reducible no --out /private/tmp/cycle4-pilot-smoke.jsonl --repo .
node scripts/sdlc/sdlc.mjs calibrate add --repository-id ui-app --task "Cycle 4 pilot smoke ui" --treatment baseline --route standard --route-fit right-sized --manual-action-count 7 --estimated-minutes 55 --token-turn-signal "baseline turns recorded" --friction "manual context selection" --helper-reducible yes --out /private/tmp/cycle4-pilot-smoke.jsonl --repo .
node scripts/sdlc/sdlc.mjs calibrate add --repository-id ui-app --task "Cycle 4 pilot smoke ui" --treatment treatment --route standard --route-fit right-sized --manual-action-count 5 --estimated-minutes 38 --token-turn-signal "treatment turns recorded" --friction "helper compiled context" --helper-reducible no --out /private/tmp/cycle4-pilot-smoke.jsonl --repo .
node scripts/sdlc/sdlc.mjs calibrate pilot-report --inputs /private/tmp/cycle4-pilot-smoke.jsonl --repo . --json
```

Observed results:

- Syntax checks passed for `calibration.mjs` and `cli.mjs`.
- Pilot regression checks passed:
  - multi-repo baseline and treatment rows pass,
  - missing treatment rows cap,
  - `.agents`-only evidence caps.
- File-based pilot report smoke passed with two synthetic non-`.agents` repository ids and produced a pass report with no caps.

## Quality Oracle Ladder

Best proof:
A completed baseline/treatment pilot across the active SDLC repository set using repo-local calibration rows and `sdlc calibrate pilot-report`.

Good proof:
Current implementation has control-plane smoke coverage through `sdlc calibrate pilot-test`.

Fallback proof:
Manual Markdown rows following the friction audit contract.

Unavailable proof:
Cross-repository acceptance is not yet available because no non-`.agents` repository pilot rows were collected in this implementation step.

Do not claim:
Do not claim reduced human orchestration burden, token savings, model readiness, delegated-agent readiness, or broad retrieval improvement from this helper implementation alone.

## Caps And Deferred Work

- Cross-repository measurement is not complete.
- Read-only counterpoint packet generation is deferred.
- Local or different-family model invocation is not approved or implemented.
- Semantic-tail retrieval rows are deferred until measured repository tasks expose natural questions.
- Fixture bounded-write remains out of scope.

## Direction After Cycle 4A

Use Cycle 4 calibration helpers for targeted research, debugging, and explicit baseline/treatment comparisons only. They are not the default ongoing improvement mechanism.

The default improvement loop is now Cycle 4A passive feedback:

```bash
sdlc feedback add --task "<task>" --source "<file-or-artifact>" --route <route> --route-fit right-sized --suggested-action "review if repeated"
sdlc feedback validate
```

When AirteraCode MCP is available, agents should prefer `sdlc_feedback` and keep the local command as fallback. Repeated events should be reviewed through process-learning before any durable SDLC rule changes are promoted.
