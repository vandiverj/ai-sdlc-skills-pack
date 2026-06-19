# Final SDLC Optimization Implementation Plan

Status: active

Purpose: converge the AI SDLC skills pack toward a compact, executable, multi-repo-capable workflow that agents can run without rediscovering process shape every session.

## Tracks

1. CLI spine: add `packet status`, `done check`, `run start`, and `run finish` so the process can identify open gates mechanically.
2. Calibration loop: add inspect/propose commands so repeated caps and route mismatches create process-improvement signals.
3. Repository setup: strengthen setup doctor output with a concrete fix plan and keep external shared context roots first-class.
4. Context discipline: add context audit and update-plan helpers to separate process docs from software memory docs.
5. Route-specific done checks: encode route completion expectations for review, release, UI, multi-repo, contract, and standard routes.
6. Multi-repo workflow: add status and packet helpers for related repositories, contracts, and release order.
7. Contract/interface rails: add contract packet generation for public or cross-boundary changes.
8. Process health: add a repo health summary that combines readiness, packets, calibration, and dirty state.
9. Agent role boundaries: keep role outputs tied to packets, completions, evidence, and handoffs.
10. Human gates: keep approval gates explicit in release, setup, security, dependency, and external-effect flows.
11. Process regression tests: expand scenario regression coverage around route drift and open-gate failures.
12. Final documentation pass: keep docs small, route-level, and executable; archive superseded plans after the workflow stabilizes.

## Implementation Order

1. Implement the missing CLI affordances as thin wrappers over existing profile, context, packet, and calibration data.
2. Update route docs and CLI examples so agents know when to use each helper.
3. Add scenario regression cases for route and gate behavior.
4. Validate against the SDLC pack itself and a configured downstream fixture or dry-run smoke path.
5. Commit/push after user approval.

## Definition Of Done

- All new commands appear in `sdlc --help` and `scripts/sdlc/README.md`.
- `run-sdlc` references start/finish, packet status, done checks, context audit/update-plan, multi-repo, contract, health, and calibration proposal helpers.
- Scenario tests cover the new route/gate expectations.
- Syntax, diff hygiene, scenario tests, and downstream smoke validation pass.
