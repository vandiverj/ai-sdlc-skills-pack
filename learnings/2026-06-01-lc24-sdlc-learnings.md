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

---

# SDLC Learning: LC_24 Scenario 11 Signed Form Downloads

Date: 2026-06-01
Case: LC_24
Scope: `www_dev`, `MainsiteCoreAPI/NataCSMainSite`, engineering context updates

## Summary

Scenario 11 exposed a cross-repo legacy/current API boundary issue: active Classic ASP pages were linking signed PDF downloads through legacy `NatacsMain/PrintProcess/*DownloadSignedForm` routes, while the current file infrastructure and mapped S3/local behavior already existed in the current Main API. The safest fix was to reroute active links to current API endpoints and add focused controller coverage.

## run-sdlc Improvement Suggestions

### 1. Add an explicit context-update checkpoint before final handoff

Learning: context was updated during the task, but the final active-page review produced one more durable fact: no active `www_dev` pages still use the old signed-form download route.

Improvement:
- `run-sdlc` should include a final checkpoint: "Did final verification discover durable project knowledge that belongs in engineering context?"
- If yes, update the relevant context pack before the final user handoff.
- This should run after final grep/tests, not only after implementation.

### 2. Separate active-code search from archived/generated search

Learning: searches initially found valid historical references under `ArchivedPages` and generated/deployed bundles. Those results are useful context but should not be treated the same as active pages.

Improvement:
- `run-sdlc` should require search results to be classified as:
  - active source/page references
  - archived historical references
  - generated/deployed artifact references
  - dependency/build-output references
- Final handoff should state which category each remaining reference belongs to.

### 3. Add route-retirement verification for endpoint replacement tasks

Learning: replacing a legacy route needs both positive and negative verification.

Improvement:
- For route migration or endpoint replacement work, `run-sdlc` should add two validation steps:
  1. Positive search: confirm intended new route appears in expected active callers.
  2. Negative search: confirm retired route no longer appears in active callers.
- The note should include the exact route patterns checked.

### 4. Include cross-repo touched-surface summary earlier

Learning: this fix touched `www_dev`, `MainsiteCoreAPI`, local rules, and engineering context. The work was easy to summarize at the end, but the SDLC route should surface touched repositories earlier to reduce missed validation.

Improvement:
- `run-sdlc` should maintain a lightweight touched-surface list during the task:
  - repositories changed
  - context files changed
  - local rules changed
  - generated/artifact folders intentionally not changed
- Before final handoff, validate each touched surface has an appropriate check or explicit manual-QA note.

### 5. Improve test-bootstrap guidance for repos without focused tests

Learning: adding `NataCSMainSite.Tests` was valuable, but bootstrapping a new test project introduces solution-file and package/reference validation steps.

Improvement:
- When a repo lacks a focused test project and the user approves adding one, `run-sdlc` should include a standard bootstrap checklist:
  - create test project
  - add project references
  - add needed test packages through package manager
  - add to solution
  - run focused test project
  - run solution build/test when feasible
  - record dependency warnings separately from failures

### 6. Record command failures that are tooling/quoting issues separately

Learning: one PowerShell `rg` command failed due to quoting. It was rerun with safer quoting and did not affect the final conclusion.

Improvement:
- `run-sdlc` should distinguish validation failures from tooling invocation failures.
- If a search/test command fails due to quoting or shell syntax, rerun it correctly and record the corrected command's result.
- Do not treat a failed command as evidence unless the failure is from the system under test.

### 7. Make manual-QA ownership explicit for legacy UI fixes

Learning: automated checks verified route construction and controller delegation, but staging still needs human PDF-open validation for employee and CSR flows.

Improvement:
- For legacy UI/download fixes, `run-sdlc` final handoff should always split:
  - developer validation evidence
  - manual QA steps
  - expected absence of old failing logs/routes

## Suggested run-sdlc Checklist Addition

For cross-repo legacy/current API route fixes:

1. Identify old route, new route, auth role, and storage behavior.
2. Confirm active caller files and exclude archived/generated/dependency results from edit scope.
3. Make the smallest active-caller change.
4. Add focused automated coverage at the current API boundary when practical.
5. Run positive search for new active links.
6. Run negative search for old active links.
7. Classify any remaining references as active, archived, generated, or external.
8. Update engineering context after final verification.
9. Provide manual QA steps that verify user behavior and absence of old error logs.

## Durable Facts from Scenario 11

- Root cause: active legacy pages routed signed-form PDFs through legacy `NatacsMain/PrintProcess/*DownloadSignedForm`, which hard-coded `/formsUpload` and failed on staging for mapped/S3-backed files.
- Fix: active employee and CSR admin signed-form links now route through current Main API endpoints.
- Employee route: `/API/Employee/CHRC/DOC/Download/SignedForm/{file}`.
- CSR admin route: `/API/Admin/File/Download?m=&a=FormFileDownload&f={file}`.
- TSA users are not expected to download these admin signed forms.
- Final active-page review found no remaining active `DownloadSignedForm`, `AdminDownloadSignedForm`, or `NatacsMain/PrintProcess/*Download*` references in `www_dev`.
- Remaining old references are archived only.
