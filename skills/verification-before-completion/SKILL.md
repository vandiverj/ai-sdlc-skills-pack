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
6. Verification commands listed in AGENTS.md, the plan, project docs, package/build scripts, CI config, Makefile, task runner, or README.
7. Relevant context-state entries for known exceptions or blocked checks.

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
- tool-retrieved documentation
- manual inspection

## Evidence rules
- Evidence must come from the current session.
- If a command was not run, say it was not run and why.
- If a command fails, do not claim completion unless the failure is unrelated and that exception is documented.
- Tool output is evidence only when its source, freshness, version fit, and relevance are stated.
- If the contract includes stress tests, run or explicitly account for them.
- If only partial verification was possible, state the residual risk.
- If verification reveals unclear requirements, route back to the relevant model, PRD, contract, issue, plan, or context-state artifact.

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

## Hard gates
- Do not infer success from old terminal output, prior sessions, CI badges, memory, or unverified tool output.
- Do not say "all tests pass" unless the relevant test command was run and passed in the current session.
- Do not hide failed commands in a summary. Report them with exit code and relevant output.
- Do not proceed to final completion, branch finishing, or release documentation without recording verification status.

## Next skills
Usually `review-spec-compliance`, then `assert-doc-sync` when docs/code may disagree, then `engineering-principles-review` when needed, then `review-code-quality`, then `update-context-docs`, `health-check`, `finish-development-branch`, or `context-save`.