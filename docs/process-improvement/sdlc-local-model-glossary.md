# SDLC Local-Model Glossary

Status: Candidate contract
Promotion state: Experiment
Last updated: 2026-06-18

## Purpose

Use the parent overview glossary as the source of truth for Cycle 1 terminology. This file is the short operational glossary for dry-run contracts and helper output.

## Required Fields

Contract and packet artifacts should use the glossary terms that match their surface, especially `runtime`, `runtime adapter`, `role packet`, `response packet`, `evidence contract`, `done contract`, and `structured claim`.

## Optional Fields

Artifacts may include runtime-specific aliases only when they also name the portable term.

## Source Of Truth

The parent overview owns broad terminology. This file owns the short Cycle 1 operational subset.

## Terms

| Term | Cycle 1 meaning |
| --- | --- |
| Orchestrator | Accountable top-level agent/session that preserves intent, routes work, reconciles evidence, and stops at human gates. |
| Runtime | Tool environment that receives a packet, such as Codex CLI, Claude Code, Pi, or manual packet handoff. |
| Runtime adapter | Thin translation layer from portable SDLC packet policy into runtime-specific invocation, files, permissions, and caps. |
| Role packet | Task-specific handoff packet with scope, context, tools, evidence, stop rules, and response expectations. |
| Response packet | Structured result from a role containing status, claims, evidence, caps, boundary check, and next action. |
| Evidence contract | Required proof or explicit cap for a role or phase. |
| Done contract | Role-specific completion definition and escalation rules. |
| Structured claim | Claim with kind, evidence/source, uncertainty, boundary status, and cap/escalation state. |
| Model capability profile | Evidence record for how one model/runtime/scaffold performs for roles and task shapes. |
| Knowledge candidate | Source-linked learning proposal that may be stored locally or later submitted to an MCP gateway. |

## Forbidden Claims

- Do not claim token savings, local model quality, runtime safety, or MCP readiness from glossary adoption.
- Do not let runtime-specific names replace portable role and packet terms.

## Validation Path

CLI and docs should use these exact names in Cycle 1 outputs. Term drift is checked by targeted `rg` review.

## No-Install Fallback

Manual packet handoff can use this glossary without any CLI or runtime support.
