# SDLC Learning: LC-43 Backend Logic Fix and Local Artifact Publish

Date: 2026-06-01
Case: LC-43
Scope: Multi-repo legacy web system, backend API fix, local deployment artifact publish

## Summary

A backend-only warning-rule bug was initially treated as a wording issue. The corrected task showed that SDLC routing must verify the intended business rule before settling for a message-only change, and must map the changed component to the correct deployable artifact before publishing.

## Key Process Learnings

### 1. Validate the business predicate before editing warning text

Learning: A warning that displays at the wrong time can look like a wording defect, but the real defect may be that the predicate is too broad.

Improvement:
- For warning/message bugs, ask: "Should this message appear here at all?" before changing text.
- Trace both the display surface and the backend data predicate that decides visibility.
- Preserve wording if the user concern is actually eligibility or trigger logic.

### 2. Publish the component that actually changed

Learning: A React-hosted workflow can still be fixed entirely in the backend API. Publishing the frontend would not deliver the backend change and can create unnecessary artifact churn.

Improvement:
- Before publish, identify the changed repository and deployable unit from the diff.
- Publish only the deployable unit that contains the change.
- If source and hosted UI live in different repositories, explicitly state which one changed and which one is only a consumer.

### 3. Verify publish profiles by target framework and output path

Learning: Multiple publish profiles can exist for the same project, including stale profiles. A profile can supply runtime/framework settings while the CLI still needs an explicit output directory to publish to the intended local site folder.

Improvement:
- Inspect publish profiles before using them.
- Reject stale profiles whose target framework no longer matches the project.
- Confirm the final publish output line points to the intended deploy folder, not only `bin/.../publish`.
- If a runtime-specific publish reports missing assets, run a targeted restore for that runtime before retrying.

### 4. Separate case ID, commit ID, and ticket-comment target

Learning: A task can involve one case identifier for commits or release grouping and another issue identifier for comments/time tracking. Do not assume they are the same.

Improvement:
- Confirm the issue ID before adding ticket comments or work logs.
- Use the commit-message case identifier exactly as requested, but separately verify the ticket/worklog target.
- If the target issue is corrected by the user, do not repeat the wrong identifier in later artifacts.

### 5. Treat local publish artifacts as a separate repository surface

Learning: Source changes and local deployment artifacts may be committed in different repositories on the same branch name.

Improvement:
- Commit source and generated/published artifacts separately when they are in different repositories.
- Before committing artifacts, list the exact changed artifact files and verify they match the publish scope.
- Do not push automatically after committing local release artifacts.

## Suggested run-sdlc Checklist Addition

For backend fixes surfaced through a deployed frontend workflow:

1. Identify whether the text/behavior is frontend-authored or API-authored.
2. Confirm whether the bug is wording, visibility, eligibility, or persistence.
3. Inspect the durable record that proves the prior state, not only UI labels.
4. Make the smallest predicate or data-query change that matches the business rule.
5. Run targeted build/tests for the changed backend unit.
6. Publish the changed backend deployable, not the frontend consumer unless frontend source changed.
7. Confirm publish output path and deployed artifact timestamps.
8. Add ticket comments/work logs only to the verified issue ID.
9. Update engineering context with durable workflow and publish facts.
