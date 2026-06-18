# Cycle 1 SDLC Drift Audit

Status: Slice 0 audit
Promotion state: Experiment
Parent plan: [cycle-1-contracts-dry-run-control-plane.md](cycle-1-contracts-dry-run-control-plane.md)
Last updated: 2026-06-18

## Verdict

Existing SDLC agent infrastructure is the owner. Cycle 1 should align and extend these surfaces instead of creating a parallel delegation system.

## Source-Of-Truth Chain

| Surface | Source-of-truth status | Action |
| --- | --- | --- |
| `agents/*.md` | Portable role definitions for the five supported handoff roles | keep |
| `templates/prompts/sdlc/*.md` | Prompt projections from portable roles | align when role contract changes |
| `scripts/sdlc/lib/agentpackets.mjs` | CLI packet projection for the five supported roles | align and extend dry-run fields |
| `scripts/sdlc/lib/adapters.mjs` | Runtime capability/profile projection | align with concrete Cycle 1 runtime IDs |
| `templates/adapters/*` | Runtime-specific downstream templates | keep thin and point to portable sources |
| `templates/docs/agents/*` | Downstream teaching docs | add contract summaries, avoid source-of-truth drift |
| `agent-contracts/independent-reviewer.md` | Legacy compatibility copy | keep aligned until retired |

## Artifact Decisions

| Artifact | Current role | Drift found | Action | Reason | Blocking before Slice 1 |
| --- | --- | --- | --- | --- | --- |
| `agents/implementation-worker.md` | portable role | none blocking | keep | source definition exists | no |
| `agents/verification-worker.md` | portable role | none blocking | keep | source definition exists | no |
| `agents/independent-reviewer.md` | portable role | legacy copy also exists | keep | source definition exists | no |
| `agents/release-handoff-worker.md` | portable role | none blocking | keep | source definition exists | no |
| `agents/process-learning-reviewer.md` | portable role | none blocking | keep | source definition exists | no |
| `agent-contracts/independent-reviewer.md` | compatibility copy | may drift from portable role | mark legacy | already labeled compatibility copy | no |
| `templates/docs/agents/agent-catalog.md` | downstream catalog | lists more specialists than portable role folder and CLI support | clarify later | specialist roles are backlog, not Cycle 1 supported roles | no |
| `templates/prompts/sdlc/*.md` | prompt packet templates | five roles match CLI support | keep aligned | usable projection surface | no |
| `templates/prompts/sdlc/evidence-packet.md` | evidence template | not tied to response packet contract yet | align later | useful but not blocking packet dry-run | no |
| `scripts/sdlc/lib/agentpackets.mjs` | CLI packet generator/linter | omitted explicit no-execution, intent trace, done contract, response fields | align | primary dry-run implementation surface | yes, now addressed |
| `scripts/sdlc/lib/adapters.mjs` | adapter profile/doctor | generic runtime IDs did not express `codex-exec`, `claude-code`, `manual-packet` | align | primary runtime check implementation surface | yes, now addressed |
| `templates/adapters/*` | runtime adapter templates | points to portable role files | keep | correct source chain | no |

## Do Not Add New Owners Yet

- Do not create new portable role definitions for catalog-only specialists in Cycle 1.
- Do not move policy into runtime adapter templates.
- Do not treat `agent-contracts/` as the durable role-contract owner.
- Do not implement write-capable local agent automation.

## Baseline Evidence

- `sdlc agents packet` already generated non-executing packets for the five core roles.
- `sdlc agents lint` already checked basic packet shape.
- `sdlc adapter doctor` already returned JSON profile output.
- Missing proof before this slice: explicit no-execution labeling, role done contract, response packet fields, concrete runtime capability comparison, and model inventory.
