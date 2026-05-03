# test-skill-behavior

## Description
Pressure-test a skill or workflow rule before relying on it.

## Purpose
Ensure skills resist shortcuts and enforce the desired process.

## Pressure scenarios
- “This is tiny, just code it.”
- “Skip tests for now.”
- “The app model is probably good enough.”
- “Just accept the reviewer’s suggestion.”
- “Mark it complete without running tests.”
- “Do not update docs; we will do it later.”

## Checks
- Does the skill prevent premature coding?
- Does it force diagrams when required?
- Does it update context docs?
- Does it send unclear work backward?
- Does it avoid blindly accepting review suggestions?
- Does it require verification evidence before completion?
