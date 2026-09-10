---
name: find-skills
description: 'Find or assess reusable agent skills when the user explicitly asks to discover or extend capabilities.'
user-invocable: true
---

# Find skills

Check installed skills and tools first. Search primary repositories or the skill ecosystem only for a capability gap in the user's request.

Inspect the actual instructions and executable resources before recommending a skill. Assess scope, provenance, permissions, maintenance, compatibility with the current runtime, and evidence from representative behavior. Popularity is a discovery signal, not proof of safety or quality.

Present the smallest useful option, its source, why it fills the gap, and any installation requirements. Apply existing user authorization before installing; discovery alone is not an installation request. Keep a direct-tool or no-install fallback when practical. Do not install an entire bundle to obtain one capability.
