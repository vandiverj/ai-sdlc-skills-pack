# verification-before-completion

## Description
Require fresh evidence before claiming work is complete, fixed, safe, or ready.

## Use before
- Saying an issue is complete.
- Saying a bug is fixed.
- Saying tests pass.
- Committing, pushing, opening a PR, or finishing a branch.
- Running spec compliance or code quality review as a final pass.
- Updating context docs based on implementation results.

## Purpose
Prevent false completion claims and make the evidence trail durable enough for review and future sessions.

## Read first
1. Approved implementation plan, if present.
2. Target issue acceptance criteria.
3. Contract spec, if present.
4. Contract/type/schema stress test plan, if present.
5. Tool/MCP boundaries and retrieved sources, if tools were used.
6. Approved quality automation decisions or documented command contracts, if present.
7. Approved retrieval approach, index freshness, and source boundaries, if retrieval affected the work.
8. Agent strategy output, handoffs, and escalation decisions, if delegation or model-tier routing affected the work.
9. Implementation pattern output, canonical examples, exceptions, and review expectations, if project patterns affected the work.
10. Threat-model output, mitigations, and security acceptance criteria, if risk surfaces were present.
11. Production readiness expectations, rollback/mitigation requirements, and Git review expectations, if release or handoff is in scope.
12. Verification commands listed in AGENTS.md, the plan, project docs, package/build scripts, CI config, Makefile, task runner, or README.
13. Relevant context-state entries for known exceptions or blocked checks.

## Required output

```text
Verification scope:
Command/tool:
Why this command/tool is relevant:
Test category:
Result:
Exit code, if applicable:
Relevant output:
Evidence source:
Evidence freshness:
Conclusion:
Follow-up required:
```

Repeat the command block for every verification command or tool-backed check.

## Test categories
Use the category that best describes the evidence:

- unit
- integration
- contract
- E2E
- visual/screenshot
- snapshot
- type/schema
- type/schema stress
- invalid-input stress
- smoke
- lint/static analysis
- build/compile
- security/dependency
- threat-model evidence
- production-readiness evidence
- implementation-pattern evidence
- tool-retrieved documentation
- retrieval/index freshness
- manual inspection

## Evidence by work class
- Micro: targeted inspection, formatter/linter, or the smallest relevant command is enough when no behavior changed.
- Tiny: targeted test, build/type/lint check, or focused manual verification that proves the local change.
- Standard: targeted behavioral tests plus relevant type/build/lint/static checks; integration or contract checks when the changed surface requires them.
- High-risk: targeted tests, broader regression evidence, contract/schema stress replay where relevant, threat-model mitigation evidence, security/privacy/dependency/license/migration/rollback/performance/accessibility/observability evidence, and production-readiness evidence as applicable.
- Exploratory: evidence of findings, reproduction notes, constraints, and recommended next classification; no production completion claim.

## Evidence rules
- Evidence must come from the current session.
- If a command was not run, say it was not run and why.
- If a command fails, do not claim completion unless the failure is unrelated and that exception is documented.
- Tool output is evidence only when its source, freshness, version fit, and relevance are stated.
- If the contract includes stress tests, run or explicitly account for them.
- If the threat model includes mitigation checks or abuse-case tests, run or explicitly account for them.
- If production readiness is in scope, state whether the Git diff/commit boundary is reviewable and whether rollback, migration, observability, and release evidence are sufficient for the work class.
- If only partial verification was possible, state the residual risk.
- If verification reveals unclear requirements, route back to the relevant model, PRD, contract, issue, plan, or context-state artifact.
- If verification shows the original work class or dirty surfaces were wrong, pause and return to `classify-work` before claiming completion.

## Choosing commands
Use project-local evidence first. Detect commands from existing project artifacts rather than assuming a language or package manager.

Common places to look:
- AGENTS.md.
- README or workflow docs.
- Package or build scripts.
- Test runner config.
- CI configuration.
- Makefile, Justfile, Taskfile, or equivalent.
- Existing developer documentation.

Prefer the narrowest command that proves the changed behavior, then broader checks when appropriate.

If expected quality automation is missing, stale, too noisy, or undocumented, route to `choose-quality-automation` or record the gap before claiming broad confidence.

If retrieval/index output affected design, implementation, or verification, cite the authoritative source artifacts it led to and verify index freshness when completion depends on it. Route missing, stale, risky, or undocumented retrieval to `choose-retrieval-approach`.

If threat-model evidence is missing for a risky surface, route to `threat-model` or state the accepted residual risk before claiming safety.

If production readiness evidence is missing for production-intended Standard or High-risk work, route to `production-readiness-review` before merge, release, deploy, or handoff.

If implementation pattern evidence is missing for a repeated project-specific surface, route to `review-implementation-pattern` or state the accepted exception before claiming consistency.

## Hard gates
- Do not infer success from old terminal output, prior sessions, CI badges, memory, or unverified tool output.
- Do not say "all tests pass" unless the relevant test command was run and passed in the current session.
- Do not hide failed commands in a summary. Report them with exit code and relevant output.
- Do not proceed to final completion, branch finishing, or release documentation without recording verification status.
- Do not use a Standard or High-risk completion claim when only Micro/Tiny evidence was collected.
- Do not claim risky work is safe or production-ready without current evidence for the relevant mitigations and readiness checks.

## Next skills
Usually `review-spec-compliance`, then `assert-doc-sync` when docs/code may disagree, then `review-implementation-pattern` when project patterns apply, then `engineering-principles-review` when needed, then `review-code-quality`, then `threat-model`, `choose-quality-automation`, `choose-retrieval-approach`, or `production-readiness-review` when gaps are discovered, then `update-context-docs`, `health-check`, `finish-development-branch`, or `context-save`.
