# Evidence Packet Templates

Use to choose the right evidence artifact for the work class.

## Templates
| Route | Template |
| --- | --- |
| Micro/Tiny | `.agents/templates/docs/evidence/micro-tiny-evidence.md` |
| Standard | `.agents/templates/docs/evidence/standard-evidence-packet.md` |
| High-risk/Release | `.agents/templates/docs/evidence/high-risk-release-evidence-packet.md` |
| Exploratory | `.agents/templates/docs/evidence/exploratory-findings.md` |
| Review-only | `.agents/templates/docs/evidence/review-only-packet.md` |
| Generic fallback | `.agents/templates/docs/evidence/evidence-packet.md` |

## Selection Rule
- Use the smallest packet that records enough evidence for the route.
- Mark missing checks as gaps, not passes.
- Include rendered evidence whenever UI/user-facing workflow changed and a runnable surface/tool exists.
- Include waivers only when a human or explicit policy accepted the risk.

## Output
```text
Evidence packet selected:
Why this packet fits:
Required sections:
Known caps:
Next review/handoff:
```
