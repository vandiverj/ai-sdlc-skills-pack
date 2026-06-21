# Model Tier Policy

## Status
Draft / Active / Needs Review

## Purpose
Define abstract model tiers so this project can choose the minimum capable model across Codex, VS Code/Copilot, Augment, Claude Code, or other runtimes without hard-coding vendor-specific names into portable SDLC guidance.

## Tiers

### deterministic
Use scripts, tests, typecheckers, linters, scanners, format checks, CI, or other tools instead of a model.

Use for:
- Formatting, static checks, builds, tests, generated artifact validation, dependency/license/security checks when tools exist.

### fast
Use for:
- Simple docs edits.
- Local search summaries.
- Mechanical changes.
- Shallow review.
- Low-risk context exploration.

Avoid for:
- Security decisions, architecture, ambiguous debugging, public contracts, production readiness, or high-risk planning.

### standard
Use for:
- Normal implementation.
- Test writing.
- Focused planning.
- Moderate bug diagnosis.
- Spec/code review.
- Most Standard work.

### deep
Use for:
- Ambiguous architecture.
- Threat modeling.
- Public contract design.
- High-risk debugging.
- Security/privacy/data/migration/deployment decisions.
- Cross-cutting refactors.
- Plans where an incorrect answer would be expensive.

### consensus
Use for:
- Independent second opinion on critical decisions.
- Serious disagreement between artifacts or agents.
- Irreversible or high-cost changes.
- Security or production decisions where one review is not enough.

## Escalation rules
Escalate when:
- Confidence is below the classification threshold.
- Verification fails twice.
- Artifacts conflict.
- A public contract or high-risk surface is unclear.
- Security, privacy, dependency, data, migration, deployment, or AI/agent risk appears.
- The current model cannot produce a testable plan, reviewable diff, or fresh evidence.

## Runtime mappings
Record project-local model names in `docs/agents/runtime-adapters.md` or runtime config files. Keep this file vendor-neutral unless the project intentionally chooses otherwise.

## Codex frontier default mapping

Use this mapping when a project has Codex frontier models available and has not defined a stricter local policy:

```text
fast: gpt-5.3-codex-spark
standard-light: gpt-5.4-mini
standard: gpt-5.4
deep: gpt-5.5
consensus: independent standard/deep reviewers selected by risk
```

Reserve `gpt-5.5` for high-risk security, privacy, data, migration, deployment, public-contract, or critical architecture review.

## Auggie frontier GPT default mapping

Use this mapping only when `auggie models list` confirms the model IDs are available for the current account or organization. Otherwise leave Auggie subagent `model` unset and use the Auggie default model.

```text
fast: gpt-5.1
standard-light: gpt-5.2
standard: gpt-5.4
deep: gpt-5.5
consensus: independent standard/deep reviewers selected by risk
```

## Last updated
- Date:
- Updated because:
- Confidence:
