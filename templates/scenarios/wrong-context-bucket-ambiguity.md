# Scenario: Wrong Context Bucket Ambiguity

## Purpose
Validate that ambiguous repository or unit naming does not cause durable facts to be saved in the wrong context bucket.

## Expected Route
standard with `context-bucket-save` recipe overlay.

## Expected SDLC Behavior
- Run context bucket confidence for the target path.
- Use aliases, deployable-unit mappings, and shared context root settings.
- Ask the human when confidence is low or conflicting.
- Keep product-specific facts out of global process learning.
