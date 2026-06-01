# Router Consolidation Validation

Purpose: prove the consolidated router/reference skill structure works after process-internal skill folders were removed.

## Runtime
- Runtime:
- Version:
- Machine/OS:
- `.agents` branch:
- Date:

## Discovery Tests
| Test | Result | Notes |
| --- | --- | --- |
| `run-sdlc` discovered | pass / fail |  |
| `planning` discovered | pass / fail |  |
| `context` discovered | pass / fail |  |
| `implementation` discovered | pass / fail |  |
| `quality` discovered | pass / fail |  |
| `review` discovered | pass / fail |  |
| `release` discovered | pass / fail |  |
| `agents` discovered | pass / fail |  |
| `tools` discovered | pass / fail |  |
| `process-learning` discovered | pass / fail |  |

## Reference Loading Tests
| Scenario | Expected router/reference | Result | Notes |
| --- | --- | --- | --- |
| Standard feature planning | `planning` references | pass / fail |  |
| Bugfix implementation | `implementation` references | pass / fail |  |
| Completion verification | `quality` references | pass / fail |  |
| Review-only pass | `review` references | pass / fail |  |
| Release/handoff | `release` references | pass / fail |  |

## Removed Skill Fallback Test
- Old skill name requested:
- Expected behavior: route to parent router or explain alias gap.
- Actual behavior:
- Alias/adapter needed:

## Verdict
- Consolidation works in this runtime: yes / no / partial
- Blocking issues:
- Non-blocking issues:
- Required follow-up:
