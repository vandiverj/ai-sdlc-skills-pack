# Scenario: Multi-Repo Shared QA

## Purpose
Validate that SDLC can plan, evidence, and summarize a workflow spanning multiple repositories without assuming one merge or deployment process.

## Task Shape
- A feature or bug fix spans several repositories.
- QA testers need one Markdown script focused on user-visible behavior.
- Deployment or release order may be different per repository.

## Expected SDLC Behavior
- Build a workspace ledger of repositories, branches, dirty states, affected units, and caps.
- Generate one QA script that hides repository mechanics unless QA must know them.
- Stop before commit or push until the human approves the final Git action.
- Never merge, deploy, create merge requests, or trigger pipelines automatically.

## Failure To Catch
The agent commits or pushes the wrong repository, or gives QA a developer-only repo checklist.
