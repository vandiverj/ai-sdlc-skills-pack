[CmdletBinding()]
param(
    [string]$SkillsRoot
)

$ErrorActionPreference = 'Stop'
$scriptRoot = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($scriptRoot)) {
    $scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
}

$nodeScript = Join-Path $scriptRoot 'test-skill-files.mjs'
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($null -eq $nodeCommand) {
    throw 'Node.js is required to run the canonical skill-file check.'
}

$arguments = @($nodeScript)
if (-not [string]::IsNullOrWhiteSpace($SkillsRoot)) {
    $arguments += @('--skills-root', $SkillsRoot)
}

& $nodeCommand.Source @arguments
exit $LASTEXITCODE
