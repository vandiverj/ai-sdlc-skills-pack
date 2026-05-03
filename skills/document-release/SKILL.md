---
name: document-release
description: 'Update user-facing and developer-facing documentation after completed work.'
user-invocable: true
---

# document-release

## Description
Update user-facing and developer-facing documentation after completed work.

## Purpose
Keep the repository understandable after features ship.

## Check/update
- README
- CHANGELOG
- examples
- docs/application-model.md if structure changed
- feature context.md files
- ADRs if a decision changed
- CLI/API usage docs if behavior changed

## Distinction
`document-release` is for public/project docs. `update-context-docs` is for internal system understanding.
