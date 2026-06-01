# Route Recipes

Purpose: define compact, repeatable route recipes that agents and SDLC helper tooling can use without re-deriving the workflow every time.

## Use

Load this reference when:

- a route needs concrete required context/check/evidence expectations,
- the `sdlc` CLI is generating evidence or restore guidance,
- a runtime needs a concise process card rather than the full SDLC.

## Common Fields

Each recipe defines:

- trigger,
- context packet,
- checks,
- evidence,
- stop gates,
- done criteria.

### tiny-docs

Trigger: typo, wording, link, or tiny documentation routing update.

Context packet:

- target file,
- nearby section,
- `git status --short`.

Checks:

- `git diff --check`.
- Link/path search when references changed.

Evidence:

- short summary,
- files changed,
- checks run,
- unresolved questions.

Stop gates:

- unclear source truth,
- docs contradict code or requirements.

Done criteria:

- text is updated,
- references are not stale,
- diff hygiene passes.

### tiny-code-cleanup

Trigger: low-risk private cleanup with no intended behavior change.

Context packet:

- target file,
- existing tests/check command,
- `git status --short`.

Checks:

- narrow relevant test if available,
- `git diff --check`.

Evidence:

- summary of no intended behavior change,
- checks run,
- files changed.

Stop gates:

- public behavior changes,
- test/build tooling changes,
- unclear ownership.

Done criteria:

- cleanup is scoped,
- checks pass,
- no unrelated files changed.

### standard

Trigger: ordinary feature, bugfix, or refactor with testable behavior.

Context packet:

- `AGENTS.md`,
- SDLC profile or repository setup,
- relevant app/model/context docs,
- affected source/tests,
- `git status --short`.

Checks:

- route-appropriate tests,
- build/typecheck when applicable,
- `git diff --check`,
- rendered review for UI-visible changes when available.

Evidence:

- standard evidence packet,
- command results,
- caps,
- review/handoff notes.

Stop gates:

- scope/contract uncertainty,
- missing verification path,
- security/privacy/dependency risk,
- human approval needed for external effects.

Done criteria:

- implementation matches scope,
- tests/checks support the claim,
- docs/context are updated when durable truth changed.

### bugfix-regression

Trigger: broken behavior with known or discoverable expected behavior.

Context packet:

- bug report or reproduction,
- expected behavior source,
- affected source/tests,
- prior related evidence if available.

Checks:

- failing test or reproduction before fix when practical,
- regression test after fix,
- relevant broader check.

Evidence:

- reproduction,
- root cause,
- fix summary,
- regression check.

Stop gates:

- expected behavior unclear,
- bug implies broader contract/product change.

Done criteria:

- regression is covered,
- fix passes relevant checks,
- no unrelated behavior changes.

### ui-rendered-review

Trigger: visible UI, layout, interaction, copy, or rendered workflow change.

Context packet:

- target workflow,
- UI files,
- design/context docs if present,
- rendered-review tooling profile.

Checks:

- tests/build as applicable,
- browser/rendered inspection,
- viewport coverage appropriate to risk,
- accessibility check when available.

Evidence:

- screenshots or rendered notes,
- tool used,
- viewports,
- interaction path,
- caps.

Stop gates:

- no rendered path for release-sensitive UI,
- accessibility or layout risk cannot be inspected.

Done criteria:

- rendered evidence supports the claim or caps are explicit.

### review-only

Trigger: inspect existing work without editing.

Context packet:

- diff or target artifacts,
- requirements/spec/context,
- evidence packet if present.

Checks:

- read-only inspection,
- optional command verification if requested or needed.

Evidence:

- findings by severity,
- evidence gaps,
- no-edit confirmation.

Stop gates:

- review request becomes implementation,
- missing source truth prevents a fair verdict.

Done criteria:

- findings are actionable or the review clearly passes with residual risks.

### release-push

Trigger: commit, push, release handoff, or publication validation.

Context packet:

- current branch/upstream,
- working tree status,
- latest commit,
- verification evidence,
- release policy.

Checks:

- `git diff --check` or `git show --check`,
- tests/build expected by release profile,
- ahead/behind check,
- ignored local evidence check when relevant.

Evidence:

- release packet,
- commit/branch identity,
- checks,
- caps,
- exact Git action taken or not taken.

Stop gates:

- dirty unrelated work,
- failed verification,
- unclear push/PR approval,
- wrong author/committer identity for public work.

Done criteria:

- release action matches approval,
- post-action branch state is verified.

### weak-test-legacy

Trigger: prove whether existing tests can catch a likely regression.

Context packet:

- behavior under test,
- relevant test file,
- safe mutation boundary,
- restoration plan.

Checks:

- temporary mutation or equivalent negative check,
- expected failure,
- restoration,
- passing post-restore test.

Evidence:

- mutation,
- failing assertion,
- restoration proof,
- residual coverage cap.

Stop gates:

- mutation cannot be safely restored,
- test environment is too expensive or unstable.

Done criteria:

- evidence shows tests catch or miss the regression,
- original code is restored cleanly.

### multi-repo-integration

Trigger: one task spans multiple repositories, services, APIs, events, schemas, deployments, or release order.

Context packet:

- SDLC profile,
- shared context root,
- product context index,
- service map,
- related repo map,
- integration contracts,
- repo-specific checks.

Checks:

- per-repo narrow checks,
- contract/integration checks where available,
- cross-repo smoke or manual QA path when needed.

Evidence:

- repos touched,
- contracts/events involved,
- per-repo checks,
- cross-repo caps,
- release order and approval gates.

Stop gates:

- missing service map or ownership,
- unclear contract direction,
- unsafe release ordering,
- work/personal data boundary risk.

Done criteria:

- all affected repos and contracts are accounted for,
- per-repo and cross-repo verification supports the claim,
- deployment/handoff order is clear.
