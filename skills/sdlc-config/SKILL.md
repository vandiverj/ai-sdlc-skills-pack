---
name: sdlc-config
description: 'Single source of truth for SDLC skill-pack configuration on this machine. Resolves $VAULT_ROOT, machine profile, and project slug defaults for context-save, context-restore, manage-context-state, setup-sdlc-in-repo, and other storage-touching skills.'
user-invocable: true
---

# sdlc-config

## Description
Single source of truth for SDLC skill-pack configuration on this machine.

## Purpose
Other skills resolve storage paths (Memory Bank, session checkpoints, context-state ledger, process-improvement events) from this file. Putting it in one place keeps path constants out of every other skill and makes per-machine differences a one-file diff.

## Resolver algorithm
A storage-touching skill MUST follow this resolution order before writing any path:

1. Read the `## Current values` section of this file.
2. Resolve the project slug via nearest-marker walk-up:
   - Starting from PWD, walk up the directory tree looking for a `.sdlc-project` file. Stop at the first one found, OR at the enclosing `.git` directory (the Git repo root), whichever comes first.
   - If a `.sdlc-project` was found, read `project_slug` from it. Nearest wins — a marker in a sub-directory overrides a marker at the repo root, which is what enables hybrid monorepos with multiple per-product slugs.
   - Else fall back to `SDLC_DEFAULT_PROJECT_SLUG`.
   - Else surface a chat warning and stop.
3. If `SDLC_VAULT_ENABLED = true` AND `VAULT_ROOT` is set AND that directory exists, use:
   `$VAULT_ROOT/<project_slug>/<artifact-path>`.
4. Otherwise, if `SDLC_FALLBACK_TO_REPO_LOCAL = true`, use the legacy repo-local path:
   `docs/<artifact-path>` inside the current repo.
5. Otherwise, surface a chat warning and stop.

## Path symbols
Skill text refers to personal-memory paths by these symbols only. The resolver above maps each symbol to a concrete path.

| Symbol | Vault path (when enabled) | Repo-local fallback |
|--------|--------|--------|
| `<memory-bank>` | `$VAULT_ROOT/<project_slug>/memory-bank` | `docs/memory-bank` |
| `<context-state>` | `$VAULT_ROOT/<project_slug>/context-state.md` | `docs/context-state.md` |
| `<session-checkpoints>` | `$VAULT_ROOT/<project_slug>/session-checkpoints` | `docs/session-checkpoints` |
| `<process-improvement>` | `$VAULT_ROOT/<project_slug>/process-improvement` | `docs/process-improvement` |
| `<knowledge-graph>` | `$VAULT_ROOT/<project_slug>/knowledge-graph` | `docs/knowledge-graph` |
| `<process-reviews-cross>` | `$VAULT_ROOT/_index/process-reviews` | `docs/process-improvement/reviews` |

Team-artifact paths (`docs/agents/*`, `docs/patterns/*`, `docs/prds/`, `docs/contracts/`, `docs/decisions/`, `docs/application-model.md`, `docs/ai-sdlc-workflow.md`, repo-root `AGENTS.md`, `src/features/<feature>/context.md`) are not symbolized. They stay literal in skill text and always resolve to the consumer repo.

## Schema

| Key | Meaning | Default |
|-----|---------|---------|
| `VAULT_ROOT` | Absolute path to the Obsidian vault `Context-Packs` directory on this machine. | unset |
| `SDLC_VAULT_ENABLED` | `true` to route storage to the vault, `false` to keep using `docs/` in each repo. | `false` |
| `SDLC_MACHINE_PROFILE` | Informational tag written into session-checkpoint frontmatter (`work-mac`, `personal-mac`, `linux-dev`, etc.). | `unknown` |
| `SDLC_DEFAULT_PROJECT_SLUG` | Project slug used when a repo has no `.sdlc-project` file. | unset |
| `SDLC_FALLBACK_TO_REPO_LOCAL` | If `true`, fall back to `docs/` inside the repo when the vault is unavailable or disabled. | `true` |

## Vault subtree contract
When the vault is used, every project owns this subtree:

```
$VAULT_ROOT/<project_slug>/
├── memory-bank/
│   ├── activeContext.md
│   ├── progress.md
│   ├── decisionIndex.md
│   ├── contextIndex.md
│   └── productContext.md
├── context-state.md
├── session-checkpoints/<YYYY-MM-DD>-<topic>.md
├── process-improvement/events.jsonl
├── knowledge-graph/        # optional, written by graphify-index
├── boundaries.md
├── cross-links.md
└── README.md
```

Vault-wide indexes live at `$VAULT_ROOT/_index/` and `$VAULT_ROOT/_templates/`. See `_index/conventions.md` in the vault for naming, lifecycle, and ownership rules.

## Current values

```ini
VAULT_ROOT = /Users/jerrickvandiver/Library/CloudStorage/OneDrive-Airtera/Vault/Vandiver-Knowledge-Store/03_AI/Context-Packs
SDLC_VAULT_ENABLED = true
SDLC_MACHINE_PROFILE = work-mac
SDLC_DEFAULT_PROJECT_SLUG =
SDLC_FALLBACK_TO_REPO_LOCAL = true
```

> On `master`: this block is left with placeholder values so a fresh clone falls back to repo-local until the user fills it in.
> On `work-mac` and other machine branches: this block holds the real machine paths.
> Merge conflicts on `master → <machine-branch>` merges are confined to this block — resolve with `git checkout <machine-branch> -- skills/sdlc-config/SKILL.md`.

## Hard rules
- Do not import this skill's values into another skill's source by copy-paste; always cite this file as the resolver.
- Do not put secrets, tokens, or credentials in this file. The schema is intentionally path-only.
- Do not invent new config keys without updating this schema and every consumer skill in the same change.
- Do not silently fall back from vault to repo-local; if the vault is unavailable, surface a chat warning so the user can decide.
- Do not write absolute machine paths into any vault artifact body. Use repo-relative or vault-relative paths so OneDrive-synced files stay portable across machines.
- Do not skip the walk-up step in resolver algorithm step 2. Resolution always starts at PWD, not at the repo root — this is what makes hybrid monorepos with multiple nested `.sdlc-project` markers work. A skill that hard-codes "read the root marker" silently collapses hybrid behavior back to a single-slug monorepo.

## Next skills
Usually one of: `context-save`, `context-restore`, `manage-context-state`, `setup-sdlc-in-repo`, `update-context-docs`.
