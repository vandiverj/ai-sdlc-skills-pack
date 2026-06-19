# QA Script Template

Use this template only as much as the case needs. Omit sections that do not apply.

```markdown
## QA Test Script

### Purpose
<Plain-language business behavior being verified.>

### Environment
Staging only.

### Tester Role
<Product lane: CSR, employee, company/DER user, FRG airport admin, FRG company, collector, admin acting as another user, registration user, etc.>

### Test Data
<Describe the business condition to use. Prefer role/condition over exact account unless exact data is required.>

### Steps
1. <Use product navigation language.>
2. <Include the concrete access method for every page or surface being tested.>
3. <Describe one user action per step where practical.>
4. <Use only grounded menu names, URLs, labels, statuses, and page names.>

### Expected Result
<Observable labels, statuses, pages, messages, rows, buttons, or workflow outcome.>

### If This Fails
<Ask for the few case-specific details that help development, such as tester role, company/employee/order used, button clicked, expected page, actual page, and screenshot.>

### Do Not Change / Do Not Submit
<Only include when the workflow has risky or data-changing actions.>

### Related Areas To Spot Check
<Only include product areas likely affected by the code change. Keep this positive; do not discourage useful tester roaming.>

---

## Technical Notes For Developer
QA script drafted by make-qa v0.2

- <Technical context not required for tester execution.>
- <Affected files/routes/endpoints if useful.>
- <Developer-only verification or setup risks.>
- <Case-understanding gaps, if any.>
```

If blockers remain, replace the heading with:

```markdown
## DRAFT - not ready because: <short blocker list>
```

## Product Language Examples

Prefer:

- "Log in as a CSR user and open the Fingerprint Process report from the CSR menu."
- "Use an employee account that has an online training item visible on the employee dashboard."
- "Use a company/DER user with unpaid invoices available in staging."
- "Open the React dashboard in a new tab in the same browser session, then compare it to the Classic dashboard."

Avoid in tester-facing steps:

- ASP filenames
- API endpoint names
- controller or method names
- database IDs
- fixture IDs such as `F-24`
- "route parity"
- "mutation-sensitive"

## Human QA Not Needed Template

```markdown
No human QA tester work needed.

Reason:
<This case does not expose a meaningful staging UI behavior for a non-technical tester to verify.>

Developer verification needed:
<Test command, staging smoke check, log check, or code-review item.>

Technical Notes For Developer:
QA script drafted by make-qa v0.2
<Preserved context.>
```

## Worked Example: LC-53

```markdown
## QA Test Script

### Purpose
Confirm that the React employee dashboard shows online training rows correctly and that training links open the expected pages, without requiring QA to complete full training courses. This is not a test of every TFSSP, DASSP, or other course. Use representative staging employee accounts that show the training states below.

### Environment
Staging only.

### Tester Role
Employee user.

### Test Data
Use staging employee accounts with these online training conditions:
- one employee with training not started
- one employee with training in progress
- one employee with completed training

If available, also spot check an employee with a Part 40 link, Blue Lightning Initiative training, or supplemental/gap training. Do not delay the main test if those are not easy to locate.

### Steps
1. Log in as an employee with online training visible on the employee dashboard.
2. Open the Classic employee dashboard and the React employee dashboard for the same employee. To open the React dashboard at the same time, paste https://staging.natacs.aero/employee/home into a new tab in the same browser you are logged into Classic under.
3. Review the Online Training section on both dashboards.
4. Compare the course name, visible status, date if shown, and available action buttons or links.
5. For a Not Started training row, confirm the status shows `Start Here` or similar start wording.
6. For an In Progress training row, confirm the status shows `In Progress`.
7. For a Completed training row, confirm the status shows `Completed` and certificate/review options are available when expected.
8. Open the training, certificate, or review link in a new tab only far enough to confirm the page or document opens.
9. Return to the dashboard and confirm the dashboard still loads normally.

### Expected Result
The Classic and React dashboards should show the same online training rows for the same employee. Statuses such as `Start Here`, `In Progress`, and `Completed` should match the employee's training state. Training, certificate, review, and document links should open without a blank page, error page, or wrong course.

### Do Not Change / Do Not Submit
Do not complete training during this test. Do not spend time taking full training courses unless a developer specifically asks for that.

### If This Fails
Include the employee account type used, the course name, the status shown in Classic, the status shown in React, which button/link was clicked, what page opened, and screenshots of both dashboards.

### Related Areas To Spot Check
If the employee has them available, quickly check:
- completed training certificate or review links
- Part 40 document link
- Blue Lightning Initiative training
- supplemental/gap training rows

---

## Technical Notes For Developer
QA script drafted by make-qa v0.2

LC-53 acceptance criteria include backend characterization for source-specific training launch behavior, duplicate hiding, supplemental/gap creation, BLI, Part 40, and legacy drug certificate behavior. Human QA should only verify visible staging dashboard behavior and link/document opening.

Confirm: is PCSSP training still offered before treating it as in or out of scope? Becky's LC-53 comment only asks which courses are in scope (TFSSP, PCSSP, DASSP); it does not state PCSSP's status. Do not record a deprecation as fact without a source.
```
