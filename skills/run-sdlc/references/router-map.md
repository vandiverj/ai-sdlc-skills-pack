# SDLC Router Map

Purpose: keep the top-level SDLC routing shape visible without turning `run-sdlc/SKILL.md` into a giant index.

This reference is owned by `run-sdlc`. Load it when:

- route selection is ambiguous,
- adding or reviewing a skill,
- deciding whether a concern belongs in a skill, a router reference, or a specialized agent,
- updating the SDLC architecture.

Do not treat this file as a replacement for `classify-work` or the phase routers. It is a map.

## Routing Principles

1. `run-sdlc` is the top-level router.
2. `classify-work` owns the execution contract: work class, risk, dirty surfaces, gates, verification, caps, and reclassification triggers.
3. Phase routers own process areas.
4. Skill-local references hold detailed route tables, examples, and checklists selected by the owning router.
5. Specialized agents are defined in `.agents/agents/*.md` and adapted per runtime.
6. Removed process-internal skills can be restored from the main branch if runtime testing exposes a regression.

## Phase Map

| Phase | Owns | Current skills |
| --- | --- | --- |
| Top-level routing | request interpretation, mode choice, consent gates, phase handoff | `run-sdlc`, `classify-work` |
| Context | restore/save/update/assert/manage durable context | `context` router |
| Planning | product fit, app definition, model, PRD, issues, contracts, implementation plan | `planning` router; `grill-me` remains direct-invoked for conversational discovery |
| Implementation | edit boundary, execution, TDD, bug diagnosis, technical approach, implementation patterns | `implementation` router with references for safe-edit boundary, execution, TDD, diagnosis, technical approach, and implementation patterns |
| Verification and quality rails | deterministic checks, evidence, health checks, quality automation, rendered evidence integrity | `quality` router with references for verification before completion, quality automation, health checks, rendered evidence, and evidence integrity |
| Review | spec compliance, artifact sync, code quality, UX, DevEx, security, agent work, planning artifact review, production readiness | `review` router with references for spec, code, design, DevEx, threat, release, agent work, agent strategy, planning artifacts, contracts, and implementation patterns |
| Release and handoff | branch setup, release docs, branch finish, handoff | `release` router |
| Agent strategy | model tiers, delegation patterns, agent definitions, runtime adapters, AGENTS.md | `agents` router |
| Tools and retrieval | tool trust, retrieval choice, graph/index build/query | `tools` router |
| Process learning | process events, repeated lessons, skill/template/pattern updates | `process-learning` router; `test-skill-behavior` remains top-level |
| Specialist utilities | direct-trigger or domain work outside ordinary SDLC routing | `find-skills`, `counterpoint`, `document-processing`, `vercel-react-best-practices`, `caveman` |

## Skill, Reference, Or Agent

Use this decision table when adding or consolidating behavior:

| Candidate | Use when | Avoid when |
| --- | --- | --- |
| Top-level skill | humans may invoke it directly; runtime discovery matters; it owns a hard gate or distinct workflow | it is only a long checklist or route detail |
| Skill-local reference | it is selected by one owning skill/router; it contains examples, tables, detailed criteria, or repeated route detail | multiple unrelated skills need it as a source of truth |
| Specialized agent definition | separate judgment, bounded tool access, or handoff accountability reduces risk | a checklist or deterministic command would be enough |
| Runtime adapter | a specific tool needs a generated/configured representation of a portable role | it would become hidden source of truth |

## Current Consolidation Direction

Keep these top-level for now:

- `run-sdlc`
- `classify-work`
- `setup-sdlc-in-repo`
- `find-skills`
- `counterpoint`
- `test-skill-behavior`
- `context`
- `planning`
- `implementation`
- `quality`
- `review`
- `release`
- `agents`
- `tools`
- `process-learning`
- `grill-me`
- `document-processing`
- `vercel-react-best-practices`
- `caveman`

Active router/reference families:

- Review and release
- Implementation
- Verification and quality rails
- Planning
- Context and documentation
- Tools and retrieval
- Agent strategy
- Process learning
- Release and handoff

## Migration Rules

1. Add references before moving skills.
2. Remove consolidated process-internal skill folders so runtime tests exercise the router/reference path.
3. Never hide quality verification, threat/security review, production readiness, or human consent gates inside optional references.
4. When a top-level skill is folded under a router, preserve its trigger language in the router reference-selection table.
5. Validate each routing change with at least one real fixture or project task.

## Consolidation Status

The consolidation jump is active. Process-internal skills have been migrated into router-local references and should be removed from `.agents/skills` so tests prove the router/reference path works.

The main branch remains the rollback source for removed skill folders.
