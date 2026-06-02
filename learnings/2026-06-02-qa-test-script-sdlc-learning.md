# SDLC Learning: QA Test Scripts for Staging Users

Date: 2026-06-02
Scope: YouTrack QA Test Script fields, manual QA handoff, staging validation, legacy/SPAs requiring authorization

## Summary

QA test scripts in YouTrack are read by non-technical testers who operate the staging site as normal users. SDLC handoff must translate developer validation into tester-facing actions and expected user-visible outcomes. Do not copy local dev smoke-test steps, auth bypasses, curl commands, browser-console checks, or implementation details into QA scripts unless explicitly requested as a developer diagnostic addendum.

## Key Process Learnings

### 1. Target staging, not local dev

Learning: Developer verification often happens on local IIS/dev URLs, but QA testers validate `https://staging.natacs.aero`.

Improvement:
- Use `https://staging.natacs.aero` in tester-facing scripts.
- Do not include local IIS warm-up steps. Staging is treated as always live.
- Do not include local-only configuration such as API `TestUser.IsTest`, app pool recycle steps, host-file overrides, curl, cookie jars, or temporary browser profiles.

### 2. Write from the viewpoint of a non-technical user

Learning: QA scripts should tell a tester what to click/open/observe, not how the implementation works.

Improvement:
- Use normal site language: log in, open page, wait for load, refresh, verify content appears.
- Avoid DevTools, console, network, JWT, cookie, SRI, CDN-manifest, or bundle-hash language unless the user specifically asks for technical QA evidence.
- Convert technical failure modes into visible symptoms, such as blank page, unexpected login redirect, access denied, or a visible shared-files error message.

### 3. Never imply testers can skip login for authorized SPAs

Learning: Some SPAs render only after authorization. A tester cannot validate authorized behavior by skipping login.

Improvement:
- For pages that require auth, instruct QA to log in normally with the required role.
- For Collector Home, specify a Collector-authorized user.
- For CHRC Document Scan, specify CSR or COLLECTOR access for authenticated page validation.
- If the tester lacks the account or role, tell them to skip that section and record the missing access.

### 4. Separate unauthenticated checks from authenticated checks

Learning: Redirect-to-login behavior and authorized-page loading are different requirements.

Improvement:
- Include a logged-out/private-window test only when verifying that protected pages redirect to login.
- Include a separate logged-in test for the authorized user journey.
- Expected results must reflect the auth state: logged out should redirect; authorized users should not be redirected unexpectedly.

### 5. Provide skip guidance explicitly

Learning: QA may not have every staging role. Without skip guidance, missing access can be reported as a product failure.

Improvement:
- Add `Skip if` notes for role-dependent sections.
- Ask testers to record which role/account was missing.
- Do not treat missing QA access as a functional failure unless the test case is specifically about provisioning/access.

### 6. Phrase pass/fail in visible outcomes

Learning: Testers need clear user-observable pass/fail conditions.

Improvement:
- Pass examples: page loads, expected content appears, refresh still works, stays on expected URL, no blank page.
- Fail examples: blank page, blocking visible error, unexpected login redirect after valid login, access denied for authorized role, visible AirTera/shared-files error.
- For implementation-specific failures, include only the visible text a tester might see.

### 7. Keep developer diagnostics out of the main QA script

Learning: Developer smoke tests can include curl, browser automation, local cookies, app pools, or console inspection. Those are not appropriate for normal QA scripts.

Improvement:
- Keep the main QA script non-technical.
- If technical evidence is useful, place it in a separate developer-only note or comment, not the QA Test Script field.
- Never ask QA to attach passwords, tokens, cookies, or other sensitive auth data.

## Suggested run-sdlc Checklist Addition

When writing or updating a YouTrack QA Test Script:

1. Identify the QA audience and environment before writing steps.
2. Use `https://staging.natacs.aero` unless the user explicitly asks for a different environment.
3. Remove local dev setup, warm-up, auth-bypass, and diagnostic-tool instructions from tester-facing content.
4. Identify required roles for each protected page.
5. Write steps as normal user actions.
6. Split logged-out behavior from logged-in behavior.
7. Add `Skip if` guidance for missing roles/accounts.
8. Express expected results as visible outcomes.
9. Add safe failure-evidence instructions: URL, role, screenshot, visible message, before/after refresh.
10. Do not request or expose passwords, tokens, cookies, headers, or other sensitive auth values.

## LC-45 Example Rule

For the LC-45 AirTera CDN runtime QA script:

- Target staging, not dev.
- Do not include local warm-up or `TestUser.IsTest` instructions.
- Collector Home validation requires a Collector-authorized user.
- CHRC authenticated validation requires CSR or COLLECTOR access.
- Testers may skip sections when they lack the required role and should record the missing access.
- The main pass/fail signals are visible page behavior: page loads, content appears, refresh works, no blank page, no shared-files error, and no unexpected login/access-denied redirect for authorized users.
