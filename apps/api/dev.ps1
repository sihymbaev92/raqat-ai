# Platform API — apps/api картасынан іске қосу (нақты код: platform_api/)
# Пайдалану: cd apps\api  ->  .\dev.ps1  |  .\dev.ps1 -Dev
param(
    [switch]$Dev
)
$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$Runner = Join-Path $Root "scripts\run_platform_api.ps1"
if (-not (Test-Path $Runner)) {
    Write-Error "Табылмады: $Runner"
}
if ($Dev) {
    & $Runner -Dev
} else {
    & $Runner
}
