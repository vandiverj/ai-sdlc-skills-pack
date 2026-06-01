# SDLC Learning: LC_24 CrewID Import FK Bug

Date: 2026-06-01
Case: LC_24
Scope: LegacyApi / legacy-main-site context, CrewID NATACS export/import

## Summary

A staging Scenario 8 CrewID export failure was resolved by using the staging EF Core SQL log to identify the exact failing table and then applying a minimal relationship-wiring fix. The investigation also exposed SDLC process improvements around context routing, case identifiers, and QA handoff.

## Key Process Learnings

### 1. Route LegacyApi context carefully

`MainsiteCoreAPI/LegacyApi` should be treated as legacy-main-site context for historical workflow notes. It is called `LegacyApi` because it is the rewrite of the first .NET API in the project, not because it belongs to the current `main-api` repository context.

Process improvement:
- Before saving durable engineering context, confirm whether a path belongs to current `main-api`, `legacy-main-site`, or another repo context bucket.
- For `LegacyApi` workflow notes, prefer `engineering-context/repos/legacy-main-site.context.md` unless the task is explicitly about the current Core API.

### 2. Use concrete production/staging logs before broad fixes

Initial diagnosis considered broad EF Core graph ordering and split-`SaveChanges()` behavior. The staging log showed the actual failing command was `INSERT INTO [dbo].[users]`, with `company_id` violating `fk_companies`.

Process improvement:
- When EF Core reports FK failures, request or inspect the generated SQL/log before changing save ordering.
- Identify the exact failing table and columns from the logged `INSERT` statement.
- Prefer a narrow relationship fix when the log points to one dependent entity.

### 3. Preserve minimal-change discipline on live-connected systems

The final production fix was much smaller than the initial broad plan: explicitly wire each imported `users` entity to the new `companies` and `employees` entities before `SaveChanges()`.

Process improvement:
- Keep broad remediation ideas as fallback plans, but do not implement them once evidence supports a smaller fix.
- Compare with existing successful code paths; `ExportEmployee` already wired `user.companies`, `user.employees`, and `company.users`.

### 4. Add targeted regression coverage even for legacy workflows

A focused test was added for `ImportCompAndEmps` to assert imported users are saved with the new company ID and a non-zero employee ID.

Process improvement:
- Even when QA owns manual scenario retesting, add the smallest automated regression test that protects the root cause.
- For EF Core FK bugs, use relational testing when practical; if only InMemory is available, still assert the relationship invariants that caused the failure.

### 5. Separate implementation validation from QA scenario validation

Developer validation proved the code path and tests pass. QA still owns Scenario 8 retest in staging because it covers the full export/badge-ordering workflow and real environment behavior.

Process improvement:
- Final handoff should clearly separate automated evidence from manual QA expectations.
- QA case notes should include root cause, fix behavior, tests run, and expected retest outcome.

### 6. Commit messages require case identifiers

A machine-wide rule was added: every suggested commit message must start with the task case identifier. If the identifier is missing or uncertain, ask before suggesting a commit message.

Process improvement:
- Capture case ID early in task setup.
- Do not provide commit messages without a known case ID.
- Format: `CASE_IDENTIFIER: concise summary`.

Example from this task:

```text
LC_24: Fix CrewID import user company FK wiring
```

## SDLC Checklist Updates Suggested

For future high-risk bug investigations:

1. Confirm case identifier at task start.
2. Confirm repo/context bucket before updating engineering context.
3. Gather exact error logs and generated SQL before proposing schema/save-order fixes.
4. Search for an existing successful analogous code path before editing.
5. Implement the smallest evidence-backed fix.
6. Add targeted regression coverage for the root cause.
7. Run targeted test first, then broader safe tests.
8. Provide QA with a scenario-specific retest note.
9. Update durable context in the correct context file.

## Durable Facts from LC_24

- Failure: SQL Server FK `fk_companies` on `dbo.users.company_id` referencing `dbo.companies.ID`.
- Triggering workflow: NATACS-to-CrewID company import/badge ordering, Scenario 8.
- Root cause: imported users were connected to employees but not explicitly connected to the newly created company; EF does not infer `users.company_id` through `user -> employee -> company` transitive navigation.
- Fix invariant: every imported `users` entity must be explicitly related to both the new `companies` entity and its `employees` entity before `SaveChanges()`.
- Regression test: `LegacyApi/NatacsMain.Tests/CrewIDImportNataTests.cs`.
