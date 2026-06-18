# Толық қолданба QA: deep link → скриншот → logcat қателер
param(
  [string]$Serial = "",
  [int]$WaitSec = 12,
  [string]$OutDir = ""
)

$ErrorActionPreference = "Stop"
$mobile = Split-Path $PSScriptRoot -Parent
if (-not $OutDir) {
  $stamp = Get-Date -Format "yyyy-MM-dd-HHmm"
  $OutDir = Join-Path $mobile "qa-sweep-$stamp"
}
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

function Find-Adb {
  $candidates = @(
    (Get-Command adb -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source),
    "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
    "$env:USERPROFILE\AppData\Local\Android\Sdk\platform-tools\adb.exe"
  ) | Where-Object { $_ -and (Test-Path $_) }
  if (-not $candidates) { throw "adb табылмады" }
  return $candidates[0]
}

$adb = Find-Adb
$pkg = "kz.raqat.app"
$adbArgs = @()
if ($Serial) { $adbArgs += "-s", $Serial }

function Invoke-Adb {
  param([Parameter(Mandatory)][string[]]$Cmd)
  & $adb @adbArgs @Cmd
  if ($LASTEXITCODE -ne 0) { throw "adb failed: $($Cmd -join ' ')" }
}

Invoke-Adb -Cmd @("shell", "input", "keyevent", "KEYCODE_WAKEUP")
try { Invoke-Adb -Cmd @("shell", "wm", "dismiss-keyguard") } catch {}
Start-Sleep -Seconds 1
Invoke-Adb -Cmd @("shell", "am", "force-stop", $pkg)
Start-Sleep -Seconds 1
Invoke-Adb -Cmd @("shell", "monkey", "-p", $pkg, "-c", "android.intent.category.LAUNCHER", "1") | Out-Null
Start-Sleep -Seconds 8

$routes = @(
  @{ id = "01-home";           path = "";                    label = "Басты бет" },
  @{ id = "02-articles";       path = "articles";           label = "Мақалалар" },
  @{ id = "03-prayer-tab";     path = "prayer";             label = "Намаз таб" },
  @{ id = "04-saved";          path = "saved";              label = "Сақталған" },
  @{ id = "05-profile";        path = "profile";            label = "Профиль" },
  @{ id = "06-quran";          path = "more/quran";         label = "Құран тізімі" },
  @{ id = "07-hatim";          path = "more/hatim";         label = "Хатим" },
  @{ id = "08-hadith";         path = "more/hadith";        label = "Хадис" },
  @{ id = "09-halal";          path = "more/halal";         label = "Халал Даму WebView" },
  @{ id = "10-namaz-guide";    path = "more/namaz-guide";   label = "Намаз нұсқаулығы" },
  @{ id = "11-tajweed";        path = "more/tajweed";       label = "Тәжуид" },
  @{ id = "12-hajj";           path = "more/hajj";          label = "Қажылық" },
  @{ id = "13-ai";             path = "more/ai";            label = "Raqat AI" },
  @{ id = "14-tradition";      path = "more/tradition";     label = "Діни дәстүр" },
  @{ id = "15-duas";           path = "duas";              label = "Дұғалар" },
  @{ id = "16-tasbih";         path = "tasbih";            label = "Тасбих" },
  @{ id = "17-asma";           path = "asma";              label = "Әсма әл-Хусна" },
  @{ id = "18-qibla";          path = "qibla";             label = "Қибла" },
  @{ id = "19-zakat";          path = "more/zakat";        label = "Зекет" },
  @{ id = "20-knowledge";      path = "more/knowledge";    label = "Білім порталы" }
)

$results = @()
$logBefore = Join-Path $OutDir "_logcat-before.txt"
Invoke-Adb -Cmd @("logcat", "-c") | Out-Null

foreach ($r in $routes) {
  $uri = if ($r.path) { "raqat://$($r.path)" } else { "raqat://" }
  Write-Host ">> $($r.id) $($r.label) $uri"
  try {
    Invoke-Adb -Cmd @("shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", $uri, $pkg) | Out-Null
  } catch {
    $results += [pscustomobject]@{ id = $r.id; label = $r.label; uri = $uri; status = "NAV_FAIL"; note = $_.Exception.Message }
    continue
  }
  Start-Sleep -Seconds $WaitSec
  $remote = "/sdcard/qa-$($r.id).png"
  $local = Join-Path $OutDir "$($r.id).png"
  Invoke-Adb -Cmd @("shell", "screencap", "-p", $remote)
  Invoke-Adb -Cmd @("pull", $remote, $local) | Out-Null
  Invoke-Adb -Cmd @("shell", "rm", $remote) 2>$null

  $snippet = (& $adb @adbArgs logcat -d -t 40 2>$null | Select-String -Pattern "FATAL|AndroidRuntime|ReactNativeJS.*Error|net::ERR" | Select-Object -Last 3) -join " | "
  $status = if ($snippet) { "WARN" } else { "OK" }
  $results += [pscustomobject]@{ id = $r.id; label = $r.label; uri = $uri; status = $status; note = $snippet }
  try { Invoke-Adb -Cmd @("logcat", "-c") | Out-Null } catch {}
}

$logPath = Join-Path $OutDir "sweep-logcat-final.txt"
& $adb @adbArgs logcat -d -t 200 | Out-File -FilePath $logPath -Encoding utf8

$csvPath = Join-Path $OutDir "sweep-results.csv"
$results | Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8

$mdPath = Join-Path $OutDir "SWEEP_REPORT.md"
$device = (& $adb @adbArgs shell getprop ro.product.model).Trim()
$api = (& $adb @adbArgs shell getprop ro.build.version.sdk).Trim()
$lines = @(
  "# Толық қолданба QA — $((Get-Date).ToString('yyyy-MM-dd HH:mm'))",
  "",
  "- Құрылғы: **$device** (API $api)",
  "- Пакет: ``$pkg``",
  "- Скриншоттар: ``$OutDir``",
  "",
  "| # | Экран | Статус | URI |",
  "|---|-------|--------|-----|"
)
foreach ($row in $results) {
  $note = ($row.note -replace '\|', '/').Substring(0, [Math]::Min(80, ($row.note + "").Length))
  $lines += "| $($row.id) | $($row.label) | $($row.status) | ``$($row.uri)`` |"
}
$lines += ""
$lines += "## Ескертулер"
$warns = $results | Where-Object { $_.status -ne "OK" }
if ($warns) {
  foreach ($w in $warns) { $lines += "- **$($w.id)** $($w.label): $($w.note)" }
} else {
  $lines += "- Барлық экрандар навигация бойынша ашылды, FATAL қате жоқ."
}
$lines -join "`n" | Out-File -FilePath $mdPath -Encoding utf8

Write-Host ""
Write-Host "Дайын: $OutDir"
Write-Host "Есеп: $mdPath"
$results | Format-Table -AutoSize
