# Model Capability Drift And Revalidation

Status: Candidate contract
Promotion state: Experiment
Last updated: 2026-06-18

## Purpose

Keep model capability profiles honest as models, runtimes, prompts, tooling, hardware, and task surfaces change.

## Required Profile Fields

- `modelId`
- `runtime`
- `role`
- `taskShape`
- `evidenceDate`
- `scoreOrVerdict`
- `knownCaps`
- `driftSignals`
- `revalidationTrigger`
- `lastEvaluated`

## Optional Fields

- `promptPacketVersion`
- `hardwareProfile`
- `latency`
- `tokenOrThroughputSignal`
- `fixtureResults`
- `humanReviewNotes`

## Drift Signals

- model/runtime version changes,
- prompt packet or role contract changes,
- tool/MCP availability changes,
- hardware profile changes,
- repeated failed checks or repair loops,
- human correction of model output,
- stale evidence beyond the profile's stated budget.

## Source Of Truth

Local measurement and fixture evidence own model capability. Static inventory is a seed, not a scorecard.

## Forbidden Claims

- Do not promote a model for a role from vendor metadata alone.
- Do not claim `google/gemma-4-26b-a4b-qat` is safe for write-capable work in Cycle 1.

## Validation Path

`sdlc models inventory --json` reports seed profiles and unknown fields. Later cycles add measured scorecards.

Cycle 3 adds a reporting-only revalidation surface:

```bash
sdlc models revalidate --repo .
```

The report combines local model inventory with calibration rows when available and emits revalidation prompts for unknown fields, stale `lastEvaluated` values, human corrections, misroute tax, and retry signals. It does not promote a model for a role or update routing policy.

## No-Install Fallback

Leave local measurement fields `unknown` and route through manual/frontier review.
