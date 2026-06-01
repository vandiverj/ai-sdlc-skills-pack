# Scenario: QA Handoff For Non-AI Testers

## Purpose
Validate that QA output is a Markdown test script for humans, not an AI reasoning artifact.

## Expected Route
standard or multi-repo-integration depending on scope.

## Expected SDLC Behavior
- Include case ID, environment, setup data, steps, expected results, regression checks, and known caps.
- Separate developer validation evidence from manual QA ownership.
- Avoid requiring QA to inspect source, run developer commands, or use AI.
- Keep output suitable for tracking-system paste-in.
