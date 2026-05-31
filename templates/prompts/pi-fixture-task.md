# Pi Fixture Task Prompt

Use the AI SDLC workflow as installed/available in this environment.

You are testing the SDLC workflow against a fixture repository. Do not choose product direction.

## Repository Boundary
- Fixture repo: `<fixture-repo-path>`
- Reusable skill-pack repo: read forbidden unless explicitly assigned by the human
- Strategy/source workspace: read forbidden unless explicitly assigned by the human
- Local scratch output path: `.ai-local/pi-runs/`
- Push policy: do not push unless explicitly instructed

Do not inspect, edit, push, merge, or judge release readiness for the reusable skill-pack repository. Work only in the fixture repository and report how the SDLC behaved.

## Feature Intent
`<human-or-orchestrator-provided-feature-intent>`

## Assigned Phase
`<intake/spec/planning/implementation/review/handoff>`

Use a bundled implementation phase only when the orchestrator explicitly assigns it. Bundled means fewer handoffs, not fewer checks. If assigned, first confirm the plan, acceptance criteria, required verification, rendered-review requirement, and stop conditions; then implement; then return gate-by-gate evidence or a cap for any unavailable evidence.

## Constraints
- Do not expand the product direction beyond the feature intent.
- Inspect fixture repo context before asking broad questions.
- Ask only questions that block the assigned phase.
- Pair questions with recommended defaults when possible.
- Record skipped checks and why.
- Do not claim implementation success from code inspection alone.
- If a required verification tool is unavailable, say so plainly and mark the relevant claim capped/unverified.

## Return
```text
SDLC mode:
Work class:
Repository boundaries:
Context inspected:
Current understanding:
Assumptions:
Acceptance criteria:
Plan or findings:
Verification plan or evidence, with command/tool results:
Rendered review requirement:
Evidence caps or unavailable tools:
Open questions with recommended defaults:
Process findings:
Recommended reusable SDLC change, if any:
Stop condition:
```
