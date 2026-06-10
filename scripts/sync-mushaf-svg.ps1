# Sync SVG mushaf pages — node wrapper
param([int]$FromPage = 1, [int]$ToPage = 604)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot
node scripts/sync-mushaf-svg.cjs $FromPage $ToPage
