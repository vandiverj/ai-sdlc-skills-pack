# Agent Learning Loop

## Status
Draft / Active / Needs Review

## Purpose
Define how this project improves agent roles, model tiers, delegation rules, and runtime adapters from evidence without creating hidden memory or automatic self-modification.

## Loop

```text
capture-process-event
-> review-process-learning
-> update-agent-definitions
-> review-agent-strategy
-> human Git review
-> scoped commit
```

## Evidence sources
- Repeated process friction.
- Serious near misses.
- Review findings that recur.
- Verification gaps caused by unclear agent ownership.
- Delegation that caused duplicated work, scope creep, or hidden context.
- Lower-tier model failures that required escalation.
- Heavy model use that produced no quality benefit.

## Change rules
- Improve existing roles before adding specialists.
- Add specialists only when the output contract is stable.
- Keep portable docs vendor-neutral.
- Keep runtime adapters thin and aligned.
- Make small, intentional commits.
- Record rejected options or deferred changes in `docs/context-state.md` when useful.

## Do not
- Do not update agent definitions from one weak anecdote.
- Do not store private logs, secrets, prompts, or customer data.
- Do not let runtime adapters become hidden source of truth.
- Do not optimize only for cost if quality or safety would suffer.

## Last updated
- Date:
- Updated because:
- Confidence:
