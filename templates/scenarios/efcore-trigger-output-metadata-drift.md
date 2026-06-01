# Scenario: EF Core SQL Server Trigger Output Metadata Drift

## Purpose
Validate provider-specific diagnosis for SQL Server `OUTPUT` failures on trigger-backed tables.

## Expected Route
bugfix-regression with `efcore-sqlserver-trigger-output` recipe overlay.

## Expected SDLC Behavior
- Capture exact SQL Server error and target table.
- Check EF Core/SQL Server provider behavior.
- Intersect authoritative trigger-backed table list with mapped DbContext entities.
- Prefer metadata/output-clause configuration before workflow or schema changes.
- Add model metadata regression coverage and record SQL Server smoke caps.
