# Repository Bootstrap Template

Use when setting up or refreshing a repository/machine/runtime profile for the SDLC.

## Templates
- `.agents/templates/docs/ai-local/repository-setup.md`
- `.agents/templates/docs/ai-local/tool-capabilities.md`
- `.agents/templates/docs/ai-local/quality-capabilities.md`

## Required Decisions
- Whether setup artifacts are local-only, checked-in examples, or shared project docs.
- Whether `.ai-local/` is ignored through `.git/info/exclude` or project `.gitignore`.
- Which commands are safe to run on this machine.
- Which MCPs/tools can receive repository or work data.
- Which validation gaps become current-task caps versus future improvement proposals.

## Bootstrap Output
```text
Repository:
Runtime:
Skills source:
Docs locality:
Tool capabilities:
Quality capabilities:
Data/tool boundaries:
Shared-file changes proposed:
Ready for SDLC task intake: yes / no / conditional
```
