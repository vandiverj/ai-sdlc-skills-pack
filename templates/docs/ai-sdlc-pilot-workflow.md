# AI SDLC Pilot Workflow

## Purpose
Use a fixture repository to test SDLC behavior before changing normal work workflows.

This workflow is for controlled pilots. It does not make the pilot branch production-ready and does not replace the strategic operating model in `Agent Thoughts`.

## Roles
- Human: provides task intent, corrections, approvals, and work-context judgment.
- Orchestrator: owns reusable skill-pack changes, synthesis, commits, and pilot branch state.
- Fixture agent: works only inside the assigned fixture repository and reports how the SDLC behaved.
- Fixture repository: safe test surface, not the main product.
- Reusable skill pack: implementation target for reusable SDLC improvements.

## Repository Boundaries
Record this before each pilot run:

```text
Fixture repo:
Reusable skill-pack repo:
Strategy/source repo or folder:
Fixture agent access:
Orchestrator access:
Push policy:
Local-only paths:
```

If a fixture agent is assigned to a fixture repo, do not ask it to inspect, edit, push, or judge readiness for the reusable skill pack unless the human explicitly changes that boundary.

## Pilot Cycle
1. Choose a fixture task intentionally.
2. Define the task intent outside the fixture agent.
3. Assign the fixture agent exactly one SDLC phase.
4. Capture the fixture agent output under local scratch space, such as `.ai-local/pi-runs/`.
5. The orchestrator reviews the output against the operating model.
6. Map findings:
   - no SDLC change needed,
   - fixture-only issue,
   - reusable skill/template/contract gap,
   - strategic question for the planning workspace,
   - not worth changing.
7. Update the reusable skill pack only for reusable gaps.
8. Verify and commit reusable skill-pack changes on the pilot branch.
9. Run another fixture test only after the changed process is clear enough to test.

## Task Intake Rule
The human or orchestrator supplies the fixture feature intent. The fixture agent develops that intent into the assigned SDLC artifact.

Do not ask the fixture agent what feature to build next. Ask it to process a provided feature intent.

## Evidence Packet
Each pilot run should report:

```text
Pilot task:
Fixture repo:
Assigned phase:
Work class:
Repository boundaries:
Context inspected:
Gates used:
Gates skipped and why:
Validation run:
Rendered review, if relevant:
Process findings:
Recommended reusable SDLC change, if any:
Stop condition:
```

## Promotion Rule
Pilot branch changes are not PR-ready or merge-ready by default. Promotion requires multiple task classes tested, evidence packets, independent review when useful, official validation or documented environment gaps, and explicit human approval.
