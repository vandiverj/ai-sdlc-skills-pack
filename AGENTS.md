# AGENTS.md

This repository is the reusable AI SDLC skills pack. It is not an application template. Keep project-maintenance guidance here separate from the portable skills and workflow guidance intended for downstream projects.

## Environment

- Primary local environment: Windows.
- Codex may run from a sandbox outside this repository and may need approval to write here.
- Markdown and text files are normalized to LF by `.gitattributes`.
- Prefer repo-local Git settings `core.autocrlf=false` and `core.eol=lf` so Windows checkouts do not rewrite text files to CRLF.
- `.editorconfig` asks editors and agents to write UTF-8, LF-terminated text with final newlines.
- Skill files must be UTF-8 without BOM and start at byte 0 with YAML frontmatter delimiter `---`.

## Editing Rules

- Prefer direct file edits with `apply_patch` when the target files are inside the active writable workspace.
- When this repo is outside the writable workspace, use small PowerShell scripts with escalation.
- Keep temporary scripts under the target repo's ignored `.ai-local/sdlc-scratch/scripts/` folder, not in the repository root or product source folders. Use `/tmp` or the OS temp directory only when the script does not need repo-relative paths.
- Treat `.ps1`, `.sh`, `.cmd`, and `.bat` files created for one-off agent work as scratch artifacts with a default 7-day TTL. Run `sdlc artifact scratch-cleanup --repo <path>` for a dry-run cleanup plan, and only delete with `--apply`.
- If a script should become durable project tooling, put it in the repo's established scripts/tooling folder, document why it is durable, and include it intentionally in the Git diff.
- Do not use double-quoted PowerShell strings for Markdown content containing backticks.
- Prefer single-quoted here-strings for Markdown content:

```powershell
$content = @'
Markdown with `backticks` is safe here.
'@
```

- For scripted Markdown edits, write UTF-8 without BOM and preserve LF line endings.
- Avoid broad regex rewrites when a smaller targeted edit is safer.
- Do not embed a literal PowerShell here-string terminator such as `'@` at the beginning of a line inside another PowerShell here-string. It will terminate the outer string.
- When documenting here-string examples inside generated Markdown, avoid nesting the exact terminator shape used by the script that writes the file.
- For numbered workflow blocks, replace the entire block instead of applying many incremental regex renumbering replacements.
- Prefer whole-section replacement for structured docs when the section has ordered steps, repeated skill names, or Markdown backticks.

## Verification After Docs Or Skill Edits

Run these checks before committing:

```powershell
git diff --check
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Test-SkillFiles.ps1
Select-String -Path README.md,SUMMARY.md,WORKFLOW.md,skills\*\SKILL.md -Pattern "[\x00-\x08\x0B\x0C\x0E-\x1F]"
git status --short
```

Also run targeted `Select-String` checks for concepts that were renamed or added, such as skill names, dirty surfaces, gates, or artifact names.

## Git Workflow

- Review `git status --short` before editing and before committing.
- Do not revert unrelated user changes.
- Keep commits scoped to one coherent workflow or skill update.
- Commit only after verification passes.
- Push after a clean commit when the user asks for the change to be saved to GitHub.

## Skills Pack Maintenance

- Keep reusable SDLC guidance portable across operating systems and development environments.
- Do not put Windows, PowerShell, Codex sandbox, or local-maintainer rules into reusable skills unless the skill is explicitly about that environment.
- Prefer concise skill instructions. Avoid turning skills into long essays.
- Add templates only after the process shape is stable enough to avoid churn.
- Treat optional tooling such as Graphify or MCP servers as optional retrieval/action layers, not sources of truth.
