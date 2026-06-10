# Create Sprint 1 GitHub issues #101-103 (requires gh auth).
# Usage:
#   gh auth login   # once
#   powershell -ExecutionPolicy Bypass -File scripts/sprint1_create_github_issues.ps1 -DryRun
#   powershell -ExecutionPolicy Bypass -File scripts/sprint1_create_github_issues.ps1

param(
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Doc = Join-Path $Root "docs\operations\sprint-1-github-issues-101-103.md"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: gh CLI not found. Install: winget install GitHub.cli" -ForegroundColor Red
    exit 1
}

$authCheck = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: GitHub not authenticated." -ForegroundColor Red
    Write-Host "Run: gh auth login --web" -ForegroundColor Yellow
    Write-Host "Then re-run this script." -ForegroundColor Yellow
    exit 1
}

Push-Location $Root
try {
    $repo = (gh repo view --json nameWithOwner -q .nameWithOwner 2>$null)
    if (-not $repo) { throw "Could not detect GitHub repo from $Root" }
    Write-Host "Repo: $repo" -ForegroundColor Cyan

    $labelsToEnsure = @("sprint-1", "P0", "infrastructure", "backend", "ops", "M1")
    foreach ($lb in $labelsToEnsure) {
        if ($DryRun) { continue }
        gh label create $lb --color "0E8A16" --force 2>$null | Out-Null
    }

    $issues = @(
        @{
            Number = 101
            Title  = "[Sprint 1][M1] #101 Shadow DB — staging PostgreSQL parity with SQLite snapshot"
            Labels = @("sprint-1", "P0", "infrastructure", "M1")
        },
        @{
            Number = 102
            Title  = "[Sprint 1][M1] #102 PG migration pipeline — audit, validate-only gate, pool tuning"
            Labels = @("sprint-1", "P0", "backend", "M1")
        },
        @{
            Number = 103
            Title  = "[Sprint 1][M1] #103 Production cutover gate — read-only window, rollback KPI, 2h monitoring"
            Labels = @("sprint-1", "P0", "ops", "M1")
        }
    )

    function Get-IssueBodyFromDoc {
        param([int]$Num)
        $text = Get-Content -Raw -Encoding UTF8 $Doc
        $pattern = "(?s)## Issue #$Num .*?(?=## Issue #|\z)"
        if ($text -match $pattern) {
            $block = $Matches[0]
            if ($block -match "(?s)### Description(.*)") {
                return ("## Description" + $Matches[1]).Trim()
            }
            return $block.Trim()
        }
        throw "Could not extract issue #$Num from $Doc"
    }

    foreach ($issue in $issues) {
        $body = Get-IssueBodyFromDoc -Num $issue.Number
        Write-Host ""
        Write-Host "=== Issue #$($issue.Number) ===" -ForegroundColor Cyan
        Write-Host "Title: $($issue.Title)"

        if ($DryRun) {
            Write-Host "[DryRun] Body: $($body.Length) chars; labels: $($issue.Labels -join ', ')" -ForegroundColor Yellow
            continue
        }

        $tmpBody = [System.IO.Path]::GetTempFileName()
        try {
            [System.IO.File]::WriteAllText($tmpBody, $body, [System.Text.UTF8Encoding]::new($false))
            $ghArgs = @("issue", "create", "-R", $repo, "--title", $issue.Title, "--body-file", $tmpBody)
            foreach ($lb in $issue.Labels) {
                $ghArgs += @("--label", $lb)
            }
            $out = & gh @ghArgs 2>&1
            if ($LASTEXITCODE -ne 0) { throw ($out -join "`n") }
            Write-Host $out -ForegroundColor Green
        }
        finally {
            Remove-Item -Force $tmpBody -ErrorAction SilentlyContinue
        }
    }

    Write-Host ""
    Write-Host "Done. Issues: gh issue list -R $repo --label sprint-1" -ForegroundColor Green
}
finally {
    Pop-Location
}
