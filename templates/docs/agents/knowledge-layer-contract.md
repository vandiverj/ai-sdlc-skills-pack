# Knowledge Layer Contract

Knowledge candidates are source-linked learning proposals. They do not replace source-of-truth artifacts.

Fallback file:

```text
.ai-local/sdlc-cache/knowledge-candidates.jsonl
```

Required envelope:

```text
schemaVersion:
kind:
class:
claim:
sourceArtifacts:
anchors:
taskRunEvidence:
appliesTo:
confidence:
confidenceLastConfirmed:
decayPolicy:
driftStatus:
sensitivity:
ownerArtifact:
suggestedAction:
```

Do not store sensitive client/customer facts in shared process docs.
