---
name: quality
description: 'Router skill for verifier phases: quality automation, fresh verification evidence, health checks, rendered evidence, and completion gates.'
user-invocable: true
---

# quality

## Purpose
Route verifier work to the smallest evidence stack that can support a completion, release, or handoff claim.

## Use When
- `run-sdlc` needs verification before completion.
- A reviewer or implementer needs deterministic checks.
- Quality automation, health checks, rendered evidence, or evidence integrity matters.
- A completion claim needs fresh proof.

## Behavior
1. Confirm the work class, changed surfaces, claim being verified, and the most relevant behavior/recovery evidence.
2. Select the minimal quality references from `references/`.
3. Run documented project commands before inventing new checks.
4. Record commands, timestamps, exit codes, and evidence gaps.
5. Hand off to `review` for judgment-based findings and release readiness.

## Reference Selection

| Trigger or surface | Load reference |
| --- | --- |
| Completion/fixed/ready claim needs fresh evidence | `references/verification-before-completion.md` |
| Project lacks clear check commands or quality rails are changing | `references/quality-automation.md` |
| Broad read-only project quality dashboard is needed | `references/health-check.md` |
| UI/user-facing workflow can be rendered or interacted with | `references/rendered-evidence.md` |
| Evidence may be stale, incomplete, tampered with, or lower than work class requires | `references/evidence-integrity.md` |
| A route needs the correct evidence packet template | `references/evidence-packets.md` |
| Actual route/evidence/model outcome should be logged for calibration | `references/evaluation-calibration.md` |

## Handoffs
- Use `implementation` when verification finds a defect that needs code changes.
- Use `review` when evidence is present and the next step is judgment: spec, code, UX, security, release, or agent-work review.
- Escalate to `run-sdlc` when missing evidence changes work class, risk, or consent gates.

## Required Output
```text
Verification claim:
Work class and surfaces:
References selected:
Commands run:
Results:
Claim-to-evidence map:
Evidence gaps:
Overall verdict: pass / fail / partial
Review handoff:
Stop condition:
```

## Stop Rules
- Do not claim complete, fixed, safe, or ready without fresh evidence or explicit gaps.
- Do not let a generic build/test result satisfy an unrelated behavior claim; record the evidence link or leave the claim open.
- Stop before adding new dependencies, services, CI changes, generated baselines, snapshots, or broad tooling.
- Stop if tests/checks appear to have been weakened to make work pass.
