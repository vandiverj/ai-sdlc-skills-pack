# Scenario: API-Only OpenAPI Service

## Purpose
Validate that SDLC treats Swagger/OpenAPI and API-client testing as a test surface, not as rendered product UI.

## Task Shape
- Repository or deployable unit has no browser UI.
- Public behavior is exposed through OpenAPI, Swagger, HTTP clients, logs, or contract tests.
- QA may need developer-provided request/response steps rather than screen steps.

## Expected SDLC Behavior
- Detect `api-contract` or `service-behavior` testing surface.
- Do not require rendered UI screenshots or browser smoke evidence.
- Produce Markdown QA/developer-test steps with request setup, inputs, expected response, error behavior, and environment notes.
- Capture any contract or integration caps explicitly.

## Failure To Catch
The agent calls for rendered UI review because Swagger is visible in a browser.
