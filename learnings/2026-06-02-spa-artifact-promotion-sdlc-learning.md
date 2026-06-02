# SDLC Learning: Build-Only SPA Artifact Promotion

Date: 2026-06-02
Scope: Legacy web systems with generated SPA artifacts checked into a separate host repository

## Summary

Some legacy web systems build React/Webpack apps in one repository and store deployed generated artifacts in another repository. The SDLC must classify package type, deployment method, host-page behavior, and generated-file cleanup before publishing or committing artifacts.

## Key Process Learnings

### 1. Classify package type before deciding deployment action

Learning: A package build output is not always a deployable app. Rollup packages are usually shared libraries; Webpack packages are usually app bundles.

Improvement:
- Treat Rollup packages as component/library packages.
- Build Rollup libraries first, but do not copy their `dist/` output into the host repository.
- Rebuild and deploy the Webpack app packages that consume the changed libraries.

### 2. Prefer publish scripts when they exist

Learning: A deployable app with a package `publish` script usually owns its host-repository output path.

Improvement:
- If a deployable app has `publish`, use it as the artifact generation method.
- Do not manually copy files for that app unless the script is missing or proven wrong.
- Verify the host-repository diff after publish before committing.

### 3. Build-only apps require manual artifact promotion

Learning: A deployable app with only `build` may still be hosted in the site repository. Its package `homepage` commonly identifies the relative host folder.

Improvement:
- Run the app build.
- Use package `homepage` to resolve the target host folder.
- Copy only generated app assets needed by that target.
- Do not assume `dist/index.html` replaces the deployed host page.

### 4. Preserve host pages and local server config

Learning: Host folders can contain local `index.asp`, `index.html`, and server configuration files with auth, includes, environment values, routing, POST, or upload behavior. Replacing or deleting them can break the live workflow.

Improvement:
- If both `index.html` and `index.asp` exist, update `index.html`; otherwise update the host page that exists.
- Replace only script/style tags that reference generated build artifacts for the app.
- Preserve unrelated script tags, server includes, auth logic, environment-specific markup, and local config files.

### 5. Clean old generated assets during approved manual promotion

Learning: Manual artifact promotion should not leave old hashed bundles piling up, but cleanup must be targeted.

Improvement:
- During an approved manual deploy, remove previous generated assets for that app that are no longer present in the latest build output.
- Never wipe the target folder.
- Never delete host pages, local server config, or unrelated assets.
- Prefer comparing latest `dist/` filenames to existing generated filename patterns before removal.

### 6. Distinguish real artifact diffs from line-ending/stat noise

Learning: Re-running Webpack/publish can mark same-name generated files dirty even when Git shows no content diff, often due line-ending metadata.

Improvement:
- Use `git diff --stat`, `git diff --numstat`, and `git diff --check` to identify meaningful changes.
- Do not commit generated files that only show working-tree noise with no actual diff.
- Restore no-op generated-file noise before final status when safe.

## Suggested run-sdlc Checklist Addition

For generated SPA artifact deploys:

1. Identify changed source packages and classify each as library or app.
2. Build libraries first; deploy only consuming apps.
3. Use app `publish` scripts when present.
4. For build-only apps, map `homepage` to the host-repository target.
5. Inspect target host files before copying artifacts.
6. Preserve host pages and local server config.
7. Clean only stale generated assets for the app being promoted.
8. Copy latest generated assets, excluding source-only host templates when the target has local host pages.
9. Update only generated build-artifact script/style tags.
10. Review host-repository diff and commit only meaningful artifact changes.
