# Evaluation And Calibration Loop

Use when recording whether the SDLC route, evidence expectation, model/agent choice, or router/reference behavior matched the actual task outcome.

## Template
- `.agents/templates/docs/evaluation/calibration-log.md`

## What To Track
- Predicted route versus actual route.
- Required evidence versus actual evidence.
- Validation, review, human override, escaped issue, and rework outcomes.
- Whether the process felt too heavy or too light.
- Whether a router/reference update is supported by repeated evidence.

## Rules
- Do not update durable process rules from one weak signal.
- Prefer repeated evidence or a high-severity near miss.
- Separate project-local fixes from reusable SDLC changes.
- Use `sdlc-process-improvement` for promotion decisions.

## Output
```text
Calibration event:
Prediction:
Actual outcome:
Process fit:
Learning candidate:
Owner:
Next review trigger:
```
