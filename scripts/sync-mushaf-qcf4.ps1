# Sync QCF4 — node wrapper (Windows PowerShell 5 compatible)
param([switch]$PagesOnly, [switch]$FontsOnly)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$args = @("scripts/sync-mushaf-qcf4.cjs")
if ($PagesOnly) { $args += "--pages-only" }
if ($FontsOnly) { $args += "--fonts-only" }
Set-Location $RepoRoot
node @args
