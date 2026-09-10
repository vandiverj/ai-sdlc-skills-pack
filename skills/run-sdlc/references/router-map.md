# Workflow ownership

Use this map only when ownership is unclear. Skills are capabilities, not mandatory sequential phases.

| Need | Owner |
| --- | --- |
| Task routing and classification | `run-sdlc`; `classify-work.md` in this directory for uncertain cases |
| Requirements, architecture, plans, interviews | `planning` and its selected references |
| Diagnosis and implementation | `implementation` |
| Executable verification and evidence | `quality` |
| Independent or requested review | `review` |
| Durable context and resumption | `context` |
| Authorized Git/release handoff | `release` |
| Repository onboarding | `setup-sdlc-in-repo` |
| Explicit agent strategy or tool/retrieval decisions | `agents`, `tools` |
| Process improvement, recurring learning, skill evaluation | `sdlc-process-improvement` and its references |
| Explicit critique or bounded revision loops | `counterpoint`, `improvement-loop` |
| Tester-facing QA authoring | `make-qa` |
| Explicit discovery or compressed style | `find-skills`, `caveman` |

`classify-work`, `process-learning`, `test-skill-behavior`, and `grill-me` are now references, not installed skills. Generic document guidance is retained under `compatibility/document-processing.md` outside discovery; use available format-specific skills first.

Each fact or instruction has one owner. Runtime adapters carry only the role/access details needed by their runtime. A helper command, template, or role output is optional unless it provides information or evidence the task actually lacks.
