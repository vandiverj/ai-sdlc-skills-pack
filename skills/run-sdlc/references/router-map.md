# SDLC Router Map

Purpose: keep the top-level SDLC routing shape visible without turning `run-sdlc/SKILL.md` into a giant index.

This reference is owned by `run-sdlc`. Load it when:

- route selection is ambiguous,
- adding or reviewing a skill,
- deciding whether a concern belongs in a skill, a router reference, or a specialized agent,
- updating the SDLC architecture.

Do not treat this file as a replacement for `classify-work`, `verification-before-completion`, or the focused skills. It is a map.

## Routing Principles

1. `run-sdlc` is the top-level router.
2. `classify-work` owns the execution contract: work class, risk, dirty surfaces, gates, verification, caps, and reclassification triggers.
3. Focused skills own specific jobs.
4. Skill-local references hold detailed route tables, examples, and checklists selected by the owning skill.
5. Specialized agents are defined in `.agents/agents/*.md` and adapted per runtime.
6. Do not move or delete top-level skills until runtime discovery and compatibility shims are tested.

## Phase Map

| Phase | Owns | Current skills |
| --- | --- | --- |
| Top-level routing | request interpretation, mode choice, consent gates, phase handoff | `run-sdlc`, `classify-work` |
| Context and tools | context packet, tool trust, retrieval choice | `context-restore`, `select-context`, `select-tools`, `choose-retrieval-approach`, `graphify-query` |
| Planning | product fit, app definition, model, PRD, issues, contracts, implementation plan | `product-reframe`, `define-application`, `model-application`, `grill-me`, `to-prd`, `to-issues`, `write-contract-spec`, `write-implementation-plan` |
| Implementation | edit boundary, execution, TDD, bug diagnosis, implementation patterns | `safe-edit-boundary`, `execute-plan`, `tdd`, `diagnose`, `choose-implementation-pattern` |
| Verification and quality rails | deterministic checks, evidence, health checks, quality automation | `verification-before-completion`, `choose-quality-automation`, `health-check` |
| Review | spec compliance, artifact sync, code quality, UX, DevEx, security, agent work | `review-spec-compliance`, `assert-doc-sync`, `review-code-quality`, `design-review`, `devex-review`, `threat-model`, `review-agent-work` |
| Release and handoff | production readiness, release docs, branch finish, context save | `production-readiness-review`, `document-release`, `finish-development-branch`, `context-save` |
| Agent strategy | model tiers, delegation patterns, agent definitions, runtime adapters | `choose-agent-strategy`, `review-agent-strategy`, `update-agent-definitions` |
| Process learning | process events, repeated lessons, skill/template/pattern updates | `capture-process-event`, `review-process-learning`, `test-skill-behavior`, `update-implementation-patterns` |
| Specialist utilities | direct-trigger or domain work outside ordinary SDLC routing | `find-skills`, `document-processing`, `vercel-react-best-practices`, `caveman` |

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
- `test-skill-behavior`
- `verification-before-completion`
- `choose-agent-strategy`
- `select-context`
- `select-tools`
- `document-processing`
- `vercel-react-best-practices`
- `caveman`

Likely future router/reference families:

- Planning
- Implementation and verification
- Review and release
- Context and documentation
- Tools, quality, and knowledge
- Agent strategy
- Process learning

Do not create these routers all at once. Add one only when a tested slice proves it reduces confusion without hiding gates.

## Migration Rules

1. Add references before moving skills.
2. Keep old top-level skills as compatibility shims until target runtimes have been tested.
3. Never hide `verification-before-completion`, threat/security review, production readiness, or human consent gates inside optional references.
4. When a top-level skill is folded under a router, preserve its trigger language in the router and in the shim.
5. Validate each routing change with at least one real fixture or project task.

## First Slice Status

This file is the first router-map slice. It creates a local reference for `run-sdlc` without changing the active route table or moving skills.
