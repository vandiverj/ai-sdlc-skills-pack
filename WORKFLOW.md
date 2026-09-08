# AI SDLC Workflow

## Principle

Use the minimum process that prevents the most likely expensive failure. The workflow is a routing map, not a mandatory ladder.

## Normal Flow

```text
understand request and repository constraints
-> classify risk and uncertainty
-> inspect only relevant context
-> define a bounded outcome and edit boundary
-> implement the complete connected change
-> gather fresh claim-specific proof
-> review only where independence adds value
-> report results and stop at the next human decision
```

`run-sdlc` is the normal router. Individual skills are specialist capabilities, not steps that must all run.

## Work Classes

- `Micro`: obvious, local, low-risk, no meaningful behavior ambiguity.
- `Tiny`: bounded and reversible with a direct proof path.
- `Standard`: a coherent feature or fix with some coordination or moderate uncertainty.
- `High-risk`: public contracts, sensitive data, security/privacy, migrations, infrastructure, dependencies, integrations, concurrency, broad architecture, or difficult rollback.
- `Exploratory`: research or a throwaway prototype with a non-production boundary.
- `Review`, `Release`, and `Process improvement`: intent-specific routes with their own completion conditions.

File count and keywords are signals, not classifications. A one-file behavior fix may be Tiny when explicitly bounded and directly proved. A one-line contract or migration change may be High-risk.

## Behavior Completeness

For an observable change, retain:

1. Observable outcome — what the actor or consuming system sees.
2. Material connected impact — a dependency, consumer, adjacent workflow, persisted state, or recovery path that could materially change.
3. Claim-specific proof — the test, inspection, rendered evidence, or explicit cap that supports the claim.

Expand into a detailed workflow map, ownership, multiple scenarios, rollback, compatibility, or migration analysis when risk, uncertainty, or cross-boundary effects make those details decision-bearing. Do not require a fixed number of scenarios.

## Phase Ownership

- Planning resolves meaningful ambiguity. Skip a separate plan when the change and proof are already obvious.
- Implementation owns the smallest coherent edit and follows material connections far enough to make the outcome complete.
- Verification maps evidence to claims. Passing an unrelated suite is not proof.
- Review looks for missing effects, incorrect assumptions, and evidence gaps. Independent review is optional for trivial work and valuable for risky or judgment-heavy work.
- Documentation changes only when behavior, commands, architecture, contracts, or durable context changed.
- Learning captures repeated, evidence-backed process problems; it does not turn a single annoyance into policy.

## Artifacts and Context

Create or update an artifact when it has a clear owner and future use: preserving a durable decision, coordinating boundaries, enabling restart, or recording evidence. Prefer direct inspection and a concise handoff for ordinary work.

Use authoritative sources in this order when they conflict: current repository instructions and accepted product/architecture decisions; source and tests; current tool evidence; task text; generated packets or old agent summaries. Record uncertainty instead of promoting it to fact.

## Evidence

Verification is proportional to the claim:

- docs/mechanical change: diff and focused structural checks;
- local behavior: targeted regression or direct observable check;
- UI/workflow: relevant rendered or interaction evidence when available;
- contract/data/integration: boundary-specific proof plus compatibility/recovery checks;
- high-risk: focused proof, broader regression evidence, and explicit caps or rollback evidence.

If a required tool is unavailable, report the cap. Never rewrite tests, snapshots, thresholds, or generated baselines merely to make verification pass unless that change is itself approved and justified.

## Human Consent Gates

The agent may inspect, edit, and run safe local verification inside the requested scope. Explicit human authority is required for commit, push, merge, deploy, release, destructive actions, dependency installation or replacement, migrations, secrets, and external-service writes. Tool-generated readiness is advisory and cannot grant authority.

## Normal CLI Surface

```bash
sdlc start --task "<task>"
sdlc next --task "<task>"
sdlc prove --task "<task>"
sdlc qa-ready --task "<task>"       # optional
sdlc finish-ready --task "<task>"
```

Specialist commands remain available behind `sdlc help expert`. Their presence does not make them required.

## Completion

A task is complete when the requested bounded outcome exists, material connected effects were addressed, current evidence supports the claims, relevant durable docs agree, unrelated work is preserved, caps are explicit, and no requested work remains. The final handoff should be shorter than the implementation unless the user asks for detail.
