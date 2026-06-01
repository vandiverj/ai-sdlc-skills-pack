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

---

# SDLC Learning: LC_24 EF Core Trigger-Backed Table Mapping

Date: 2026-06-01
Case: LC_24
Scope: EF Core SQL Server save behavior in legacy API contexts

## Summary

A later LC_24 staging issue showed that an EF Core save can fail after a framework upgrade when SQL Server tables have enabled DML triggers but the EF model does not declare those triggers. The root fix was not a workflow change or schema change; it was aligning DbContext metadata with the database's trigger-backed tables.

## Key Process Learnings

### 1. Treat SQL Server `OUTPUT` + trigger errors as model-metadata drift first

When logs say SQL Server rejected a DML statement because the target table has triggers and the statement contains an `OUTPUT` clause, first check EF Core table metadata.

Process improvement:
- Identify the exact table named by SQL Server in the log.
- Confirm whether the DbContext maps that table.
- Confirm whether the mapped entity declares trigger metadata or explicitly disables SQL output behavior.
- Prefer a metadata fix before considering save-order, raw SQL, trigger disabling, or schema changes.

### 2. Compare the authoritative trigger list with mapped entities, not only the first failing table

The first failing table is useful evidence, but it may only be the first missing mapping in a broader set.

Process improvement:
- Ask for or query the authoritative list of trigger-backed tables for the affected database.
- Intersect that list with entities actually mapped in the affected DbContext.
- Update all mapped trigger-backed tables in that DbContext together.
- Do not introduce new entity mappings just to represent unmapped trigger-backed tables unless the task requires that broader change.

### 3. Add metadata-level regression tests for provider configuration

In-memory tests cannot reproduce SQL Server's `OUTPUT`/trigger runtime failure, but they can assert that the EF model contains the required trigger declarations.

Process improvement:
- Add focused tests that inspect EF model metadata for configured trigger-backed entities.
- Keep those tests close to existing domain tests for the affected workflow.
- Document any remaining manual database smoke test separately because metadata tests do not prove real SQL Server execution.

### 4. Keep product facts and portable process lessons separate

The durable product fact belongs in engineering context for the affected repo/workflow. The reusable lesson belongs in process learning without customer, manifest, or environment-specific details.

Process improvement:
- Product context should name the affected workflow, code path, tables, and regression coverage.
- Process learning should describe the generic diagnostic pattern and checklist.
- Final handoff should mention both context updates when both were changed.

## Suggested run-sdlc Checklist Addition

For EF Core SQL Server save failures involving triggers:

1. Capture the generated SQL/log excerpt and identify the target table.
2. Check official/provider guidance for version-specific save behavior.
3. Get the authoritative trigger-backed table list for the affected database.
4. Intersect trigger-backed tables with the affected DbContext's mapped entities.
5. Add trigger metadata or output-clause opt-out for all mapped trigger-backed tables.
6. Do not map unrelated database tables as part of the fix unless explicitly required.
7. Add model-metadata regression coverage.
8. Run targeted tests/build and record manual SQL Server smoke expectations.
9. Update product context and process learning separately.
