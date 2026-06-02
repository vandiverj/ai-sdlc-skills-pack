# SDLC Local-First Command Contract

Status: active

Purpose: keep local-first CLI commands predictable, testable, and low-noise.

## Trust Classes

- `deterministic-proof`: local command/file/git evidence that can be independently inspected.
- `local-configuration`: repo or user configuration that guides behavior but may be stale.
- `weak-signal`: inferred from filenames, scripts, task words, or conventions.
- `optional-suggestion`: useful when available, never a blocker by itself.
- `human-judgment-required`: needs developer, reviewer, QA, ticket, or product judgment.

## Command Contracts

| Command | Required input | Output | Artifact | Exit code 1 allowed | Journal update | Evidence class |
| --- | --- | --- | --- | --- | --- | --- |
| `sdlc tools inventory` | repo | Markdown table or JSON | `.ai-local/sdlc-cache/tools.json` | no | no | deterministic/local-config/weak-signal |
| `sdlc tools gaps` | task, repo | Markdown or JSON gap list | `.ai-local/sdlc-cache/tool-gaps.md` | no | no | suggestion/warn/record |
| `sdlc tools recommend` | task, repo | Markdown or JSON recommendations | none | no | no | suggestion |
| `sdlc capabilities negotiate` | task, repo | Markdown or JSON local-first plan | optional `--out` | no | yes | mixed, explicitly labeled |
| `sdlc local-first plan` | task, repo | same as capability negotiation | optional `--out` | no | yes | mixed, explicitly labeled |
| `sdlc prompt audit` | task/text/file | Markdown or JSON prompt analysis | optional `--out` | no | yes when task provided | suggestion/intent extraction |
| `sdlc prompt compile` | task plus phase or role | bounded prompt | optional `--out` | no | no | compiled view, not proof |
| `sdlc agents plan` | task, repo | Markdown or JSON role recommendations | `agents/agent-plan.md` unless `--out` | no | yes | recommendation |
| `sdlc agents packet` | role, task, repo | packet path | `agents/<role>.md` unless `--out` | yes for invalid role/input | yes | work order |
| `sdlc review local` | task, repo | Markdown or JSON review facts/findings | optional `--out` | only for block findings | no | local facts plus review warnings |
| `sdlc qa human-lint` | packet | Markdown or JSON lint findings | none | only for block findings | no | lint signal |

## Blocking Policy

Commands should block only for:

- missing required input,
- invalid packet role/path,
- safety, approval, sensitive-data, destructive-action, or evidence-integrity issues.

Warnings about missing optional tools, missing tests, absent browser tooling, or incomplete context are suggestions unless they directly affect a finish claim.

## Artifact Rules

- Generated process artifacts default to `.ai-local`.
- Commands should print a relative path when an artifact is written.
- JSON output should be available for deterministic tests where practical.
- Markdown output should remain human-readable and short.

## Context Budget Rule

Commands should summarize and link. They should not dump large files, full logs, raw ticket text, raw database rows, secrets, or proprietary code snippets into reusable artifacts.
