# test-skill-behavior

## Purpose

Test decisions and outcomes rather than the presence of prescribed wording.

## Minimum scenarios

Use representative requests that cover:

- direct and indirect requests that should activate the skill,
- a nearby request that should not activate it,
- incomplete input that should trigger either a reasonable assumption or one material question,
- a small task that should remain lightweight,
- a risky task that should preserve the relevant safety or evidence gate.

For behavior-changing SDLC rules, check that the agent identifies the observable outcome, follows material connected impacts, and uses claim-specific proof. Do not require every impact category or a fixed scenario count when those details do not affect the task.

## Evaluation

```text
Activation correct:
User intent preserved:
Useful action reached without ceremony:
Relevant risk/evidence gate preserved:
Output or artifact quality:
Regression or over-trigger found:
```

Prefer an executable fixture or realistic dry run. Regex and heading checks may validate file shape, but they do not prove skill behavior.

## Stop rules

- Do not strengthen a skill from one adversarial phrase alone.
- Do not accept a test that merely mirrors the implementation wording.
- Do not add process to small tasks to make a pressure scenario pass.
