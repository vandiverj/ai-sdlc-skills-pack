[CmdletBinding()]
param(
    [string]$SkillsRoot
)

$ErrorActionPreference = 'Stop'
$scriptRoot = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($scriptRoot)) {
    $scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
}
if ([string]::IsNullOrWhiteSpace($SkillsRoot)) {
    $SkillsRoot = Join-Path $scriptRoot '..\skills'
}

$utf8Strict = New-Object System.Text.UTF8Encoding($false, $true)
$failures = New-Object System.Collections.Generic.List[string]

$files = Get-ChildItem -Path $SkillsRoot -Recurse -Filter SKILL.md -File
foreach ($file in $files) {
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)

    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        $failures.Add("$($file.FullName): UTF-8 BOM found before YAML frontmatter.")
        continue
    }

    if ($bytes.Length -lt 3 -or $bytes[0] -ne 0x2D -or $bytes[1] -ne 0x2D -or $bytes[2] -ne 0x2D) {
        $failures.Add("$($file.FullName): first bytes must be 2D 2D 2D for YAML frontmatter.")
        continue
    }

    try {
        $text = $utf8Strict.GetString($bytes)
    } catch {
        $failures.Add("$($file.FullName): file is not valid UTF-8.")
        continue
    }

    $text = $text -replace "`r`n", "`n" -replace "`r", "`n"
    $lines = $text -split "`n", -1
    if ($lines[0] -ne '---') {
        $failures.Add("$($file.FullName): first line must be exactly ---.")
        continue
    }

    $frontmatterEnd = -1
    for ($i = 1; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -eq '---') {
            $frontmatterEnd = $i
            break
        }
    }

    if ($frontmatterEnd -lt 0) {
        $failures.Add("$($file.FullName): YAML frontmatter is not closed with ---.")
        continue
    }

    $frontmatter = @()
    if ($frontmatterEnd -gt 1) {
        $frontmatter = $lines[1..($frontmatterEnd - 1)]
    }
    if (-not ($frontmatter | Where-Object { $_ -match '^name:\s*\S' })) {
        $failures.Add("$($file.FullName): YAML frontmatter is missing name.")
    } else {
        $nameLine = $frontmatter | Where-Object { $_ -match '^name:\s*\S' } | Select-Object -First 1
        $name = ($nameLine -replace '^name:\s*', '').Trim().Trim("'").Trim('"')
        if ($name -ne $file.Directory.Name) {
            $failures.Add("$($file.FullName): frontmatter name '$name' must match directory '$($file.Directory.Name)'.")
        }
    }
    if (-not ($frontmatter | Where-Object { $_ -match '^description:\s*.+' })) {
        $failures.Add("$($file.FullName): YAML frontmatter is missing description.")
    }
    if (-not ($frontmatter | Where-Object { $_ -match '^user-invocable:\s*true\s*$' })) {
        $failures.Add("$($file.FullName): YAML frontmatter must include user-invocable: true.")
    }

    $bodyStart = $frontmatterEnd + 1
    while ($bodyStart -lt $lines.Count -and $lines[$bodyStart] -eq '') {
        $bodyStart++
    }
    if ($bodyStart -lt $lines.Count -and $lines[$bodyStart] -eq '---') {
        $failures.Add("$($file.FullName): duplicate leading YAML frontmatter found.")
    }
}

if ($failures.Count -gt 0) {
    $failures | ForEach-Object { [Console]::Error.WriteLine($_) }
    exit 1
}

Write-Output "Skill file check passed for $($files.Count) files."
