# SDLC Friction, Token, And Human-Orchestration Audit

Status: Candidate contract
Promotion state: Experiment
Last updated: 2026-06-18

## Purpose

Measure whether routing, packets, and dry-run helpers reduce human orchestration burden without weakening evidence.

## Record Shape

```text
Task:
Route:
Step:
Friction category:
Manual action count:
Estimated minutes:
Token/turn signal:
Evidence gap:
Could helper reduce this: yes/no/unknown
Candidate helper:
```

## Required Fields

Use every field in the record shape for comparable audits.

## Optional Fields

- `Runtime`
- `Model tier`
- `Retry count`
- `Misroute tax`
- `Human correction`
- `Repository id`
- `Treatment`: `baseline` or `treatment`
- `Evidence path`
- `Accepted counterpoint findings`
- `Rejected counterpoint findings`
- `Semantic-tail questions`

## Cycle 4 Pilot Fields

Cycle 4 uses the optional fields above to compare baseline and helper-compiled treatment runs across the repositories where the SDLC is actually used.

Cycle 4A direction shift:
Use these calibration rows for targeted research and explicit comparisons, not as the normal developer workflow. The default ongoing feedback loop is passive `sdlc_feedback` capture through AirteraCode MCP, with `.ai-local/sdlc-cache/sdlc-feedback.jsonl` as the local fallback.

Use `.agents` for control-plane smoke rows only. Cycle 4 acceptance requires non-`.agents` repository evidence unless the report records an explicit evidence cap.

Helper support:

```bash
sdlc calibrate add --repository-id <repo-id> --task "<task>" --treatment baseline --manual-action-count <n> --estimated-minutes <n>
sdlc calibrate add --repository-id <repo-id> --task "<task>" --treatment treatment --manual-action-count <n> --estimated-minutes <n>
sdlc calibrate pilot-report --inputs "repo-a/.ai-local/sdlc-calibration.jsonl,repo-b/.ai-local/sdlc-calibration.jsonl" --repo .
sdlc feedback add --task "<task>" --source "<file-or-artifact>" --route <route> --route-fit right-sized --suggested-action "review if repeated"
```

## Source Of Truth

Task-local run journals and audit rows own measured values. Passive feedback rows own normal-use improvement signals. This file owns the category shape.

## Initial Categories

1. Re-explaining task intent and scope after context shifts.
2. Manually selecting and summarizing relevant files/context.
3. Manually deciding which model/agent should do which subtask.
4. Manually turning agent output into a verification checklist.
5. Manually reconciling findings, uncertainty, and next actions.

## Source Of Truth

Task-local run journals, evidence packets, human notes, and passive SDLC feedback own observations. Shared docs define categories only.

## Forbidden Claims

Do not claim token savings from one dry run. Do not count saved cloud tokens while ignoring added human coordination.

## Validation Path

For targeted research, fill this audit for one fixture or real task. For normal rollout, prefer passive `sdlc_feedback` and process-learning review.

## No-Install Fallback

Use a Markdown note or JSONL row under ignored `.ai-local`.
