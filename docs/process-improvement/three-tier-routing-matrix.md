# Three-Tier Routing Matrix

Status: Candidate contract
Promotion state: Experiment
Last updated: 2026-06-18

## Purpose

Route bounded work to the cheapest tier that can satisfy the evidence contract, then escalate on deterministic failure, ambiguity, risk, or boundary drift.

## Contract Fields

Required: `task`, `workClass`, `riskSignals`, `candidateTier`, `evidenceContract`, `escalationTriggers`, `fallbackTier`, `doNotClaim`.

Optional: `runtime`, `modelProfile`, `misrouteTax`, `humanOverride`, `tokenSignal`, `latencySignal`.

## Matrix

| Tier | Use for | Avoid for | Escalate when |
| --- | --- | --- | --- |
| Deterministic tools | tests, type checks, lint, schemas, searches, inventory, generated packet lint | product judgment, unclear source selection | tool unavailable, output conflicts, scope changes |
| Cheaper frontier / standard | bounded docs, routine edits, prompt/packet drafting, fast review | security, privacy, public contracts, ambiguous architecture | failed checks, repeated repair, missing source links, human correction |
| Local model | read-only synthesis, speculative review, batch context organization | final judgment, release decisions, high-risk implementation | weak structured output, missing evidence, uncertainty, latency/retry burden |
| Top frontier | orchestration, hard judgment, reconciliation, high-risk decisions, final synthesis | routine bounded work with strong proof | only human/operator override or unresolved cross-surface risk |

## Source Of Truth

Portable policy lives here and in the parent overview. Runtime adapters may map tiers to concrete model names but must not change authority, evidence, or stop rules.

## Forbidden Claims

- A lower tier is not acceptable only because it is cheaper.
- Model self-confidence is not evidence.
- Consensus is not proof without deterministic or source-linked support.

## Validation Path

Dry-run packets should name an advisory tier and escalation triggers. Actual routing quality requires later fixture or real-task evaluation.

## No-Install Fallback

Use deterministic commands and manual orchestration; record caps when no model/runtime is used.
