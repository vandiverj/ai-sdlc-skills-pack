# Project agent guide

Replace placeholders with verified project facts; omit unused sections.

## Purpose and constraints

- Product purpose and current delivery priority:
- Accepted decisions and domain language:
- Security, privacy, dependencies, and network constraints:

## Repository map

- Source and tests:
- Architecture and product documentation:
- Generated output and ignored local evidence:

## Development and verification

- Setup:
- Focused checks for ordinary changes:
- Broader checks and the checkpoints that require them:
- Build/run command:
- Rendered application verification:
- Known environment limitations:

Use the smallest workflow that proves the requested result. A small edit can use
its diff and focused check directly. Behavioral changes need an observable outcome,
material connected impact, and current proof; expand analysis for consequential risk.
A cap records incomplete proof. Do not present it as successful verification.

Read linked guidance when its subject matters. Keep durable project facts here or
in their existing canonical document. Add profiles, agent catalogs, patterns, and
handoff artifacts only when they solve an observed project need.

## Working rules

Preserve unrelated changes. Keep edits and verification proportional to risk.
When changing tests, baselines, or validation commands, explain why the resulting
checks still protect behavior. Update documentation when its described surface changes.
Use one agent by default; delegate independent, bounded work when the runtime and
applicable instructions allow it. Honor the configured model and reasoning effort.

## Delivery authority

- Branch and commit expectations:
- Push, publication, deployment, and external-action authority:

Existing user and repository authorization counts. Ask only when required authority
or a material decision is missing. Readiness evidence does not grant permission.
