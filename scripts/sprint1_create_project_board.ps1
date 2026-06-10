# Create GitHub Project board and add Sprint 1 issues (#3–#9).
# Prerequisite: gh auth refresh -h github.com -s project,read:project

param(
    [string]$Owner = "sihymbaev92",
    [string]$Repo = "raqat-ai",
    [string]$Title = "RAQAT Sprint 1"
)

$ErrorActionPreference = "Stop"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

gh auth status 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { throw "gh not authenticated — run: gh auth login" }

$projectJson = gh project create --owner $Owner --title $Title --format json 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host $projectJson
    throw "gh project create failed — refresh scopes: gh auth refresh -h github.com -s project,read:project"
}

$project = $projectJson | ConvertFrom-Json
$number = $project.number
$url = $project.url
Write-Host "Created project #$number — $url" -ForegroundColor Green

$issues = @(3, 4, 5, 6, 7, 8, 9)
foreach ($n in $issues) {
    $issueUrl = "https://github.com/$Owner/$Repo/issues/$n"
    gh project item-add $number --owner $Owner --url $issueUrl 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) { Write-Host "  + issue #$n" -ForegroundColor Cyan }
    else { Write-Host "  ! failed issue #$n" -ForegroundColor Yellow }
}

Write-Host "Done. Open: $url" -ForegroundColor Green
