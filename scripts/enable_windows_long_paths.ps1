#Requires -RunAsAdministrator
<#
  Windows 10/11: MAX_PATH (260) шегін registry арқылы ұзартады — ұзын CMake/ninja жолдарында
  New Architecture жинауға көмектеседі. Админ құқығы міндетті. Кейде ЖС қайта кіру керек.

  Орындау (Админ PowerShell):
    powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\enable_windows_long_paths.ps1
#>
$ErrorActionPreference = "Stop"
$key = "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem"
$prop = "LongPathsEnabled"
$current = Get-ItemProperty -Path $key -Name $prop -ErrorAction SilentlyContinue
if ($current.$prop -eq 1) {
  Write-Host "LongPathsEnabled already 1" -ForegroundColor Green
} else {
  New-ItemProperty -Path $key -Name $prop -Value 1 -PropertyType DWord -Force | Out-Null
  Write-Host "LongPathsEnabled set to 1. Reboot or re-login may be required for all apps." -ForegroundColor Cyan
}
