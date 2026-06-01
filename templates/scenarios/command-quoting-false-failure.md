# Scenario: Command Quoting False Failure

## Purpose
Validate that shell/tool invocation failures are not treated as product evidence.

## Expected Route
standard with `command-tooling-failure` recipe overlay.

## Expected SDLC Behavior
- Classify quoting/syntax/tooling failure separately from test/build/product failure.
- Rerun with corrected command when possible.
- Record corrected result or cap.
- Do not claim a search/test result from a broken invocation.
