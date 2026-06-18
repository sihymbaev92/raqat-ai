# Халал Даму + ҚМДБ WebView толық қолмен QA (Samsung adb)
param(
  [string]$Serial = "RZ8R10K8ZJV",
  [int]$LoadSec = 16,
  [string]$OutDir = ""
)

$ErrorActionPreference = "Stop"
$mobile = Split-Path $PSScriptRoot -Parent
if (-not $OutDir) {
  $stamp = Get-Date -Format "yyyy-MM-dd-HHmm"
  $OutDir = Join-Path $mobile "qa-halal-kmdb-$stamp"
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
  param(
    [Parameter(Mandatory)][string[]]$Cmd,
    [switch]$AllowNonZero
  )
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $out = & $adb @adbArgs @Cmd 2>&1
    if (-not $AllowNonZero -and $LASTEXITCODE -ne 0) {
      throw "adb failed: $($Cmd -join ' ') :: $out"
    }
    return $out
  } finally {
    $ErrorActionPreference = $prev
  }
}

function Shot {
  param([string]$Name)
  $remote = "/sdcard/qa-$Name.png"
  $local = Join-Path $OutDir "$Name.png"
  Invoke-Adb -Cmd @("shell", "screencap", "-p", $remote) | Out-Null
  Invoke-Adb -Cmd @("pull", $remote, $local) | Out-Null
  try { Invoke-Adb -Cmd @("shell", "rm", $remote) | Out-Null } catch {}
  return $local
}

function Wake-Device {
  Invoke-Adb -Cmd @("shell", "input", "keyevent", "KEYCODE_WAKEUP") | Out-Null
  try { Invoke-Adb -Cmd @("shell", "wm", "dismiss-keyguard") | Out-Null } catch {}
  Start-Sleep -Seconds 1
}

function Get-LogSnippet {
  $raw = & $adb @adbArgs logcat -d -t 60 2>$null
  $hits = $raw | Select-String -Pattern "FATAL|AndroidRuntime|ReactNativeJS.*Error|net::ERR|WebView.*error" | Select-Object -Last 5
  return ($hits -join " | ")
}

function Open-DeepLink {
  param([string]$Path)
  $uri = if ($Path) { "raqat://$Path" } else { "raqat://" }
  Invoke-Adb -Cmd @("shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", $uri, $pkg) | Out-Null
  return $uri
}

function Tap-DashboardTileByLabel {
  param([string]$LabelFragment)
  $dumpRemote = "/sdcard/window_dump.xml"
  $dumpLocal = Join-Path $OutDir "_ui-dump.xml"
  try {
    Invoke-Adb -Cmd @("shell", "uiautomator", "dump", $dumpRemote) | Out-Null
    Start-Sleep -Milliseconds 800
    Invoke-Adb -Cmd @("pull", $dumpRemote, $dumpLocal) | Out-Null
  } catch {
    return $false
  }
  if (-not (Test-Path $dumpLocal)) { return $false }
  [xml]$xml = Get-Content -Raw -Encoding UTF8 $dumpLocal
  $node = $xml.SelectNodes("//node") | Where-Object {
    $_.text -match $LabelFragment -or $_.'content-desc' -match $LabelFragment
  } | Select-Object -First 1
  if (-not $node) { return $false }
  if ($node.bounds -notmatch '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') { return $false }
  $cx = [int](([int]$Matches[1] + [int]$Matches[3]) / 2)
  $cy = [int](([int]$Matches[2] + [int]$Matches[4]) / 2)
  Invoke-Adb -Cmd @("shell", "input", "tap", "$cx", "$cy") | Out-Null
  return $true
}

function Test-WebViewFlow {
  param(
    [string]$Id,
    [string]$Label,
    [string]$DeepLinkPath,
    [string]$TileLabelPattern,
    [string]$HomeUrlFragment
  )
  $steps = @()
  Write-Host ""
  Write-Host "======== $Label ========"

  Wake-Device
  Invoke-Adb -Cmd @("shell", "am", "force-stop", $pkg) | Out-Null
  Start-Sleep -Seconds 1
  Invoke-Adb -Cmd @("shell", "monkey", "-p", $pkg, "-c", "android.intent.category.LAUNCHER", "1") -AllowNonZero | Out-Null
  Start-Sleep -Seconds 8
  Invoke-Adb -Cmd @("logcat", "-c") | Out-Null
  Shot "$Id-00-home" | Out-Null

  $tapped = Tap-DashboardTileByLabel -LabelFragment $TileLabelPattern
  if (-not $tapped) {
    $uri = Open-DeepLink -Path $DeepLinkPath
    $steps += [pscustomobject]@{ step = "dashboard-tap"; status = "FALLBACK_DEEPLINK"; note = $uri }
  } else {
    $steps += [pscustomobject]@{ step = "dashboard-tap"; status = "OK"; note = $TileLabelPattern }
  }
  Start-Sleep -Seconds $LoadSec
  $p1 = Shot "$Id-01-loaded"
  $log1 = Get-LogSnippet
  $steps += [pscustomobject]@{
    step = "initial-load"
    status = if ($log1) { "WARN" } else { "OK" }
    note = $log1
  }

  # WebView ішінде төмен скролл
  Invoke-Adb -Cmd @("shell", "input", "swipe", "540", "1700", "540", "700", "450") | Out-Null
  Start-Sleep -Seconds 2
  Invoke-Adb -Cmd @("shell", "input", "swipe", "540", "1700", "540", "700", "450") | Out-Null
  Start-Sleep -Seconds 2
  Shot "$Id-02-scrolled" | Out-Null
  $steps += [pscustomobject]@{ step = "scroll"; status = "OK"; note = "2x swipe down" }

  # Мазмұнға шерту (орталық аймақ)
  Invoke-Adb -Cmd @("shell", "input", "tap", "540", "1200") | Out-Null
  Start-Sleep -Seconds $LoadSec
  Shot "$Id-03-after-tap" | Out-Null
  $logTap = Get-LogSnippet
  $steps += [pscustomobject]@{
    step = "content-tap"
    status = if ($logTap) { "WARN" } else { "OK" }
    note = $logTap
  }

  # Hardware BACK — WebView history
  Invoke-Adb -Cmd @("shell", "input", "keyevent", "KEYCODE_BACK") | Out-Null
  Start-Sleep -Seconds 3
  $pBack = Shot "$Id-04-after-back"
  $steps += [pscustomobject]@{ step = "hardware-back"; status = "OK"; note = $pBack }

  # Header refresh (оң жоғарғы бұрыш)
  Invoke-Adb -Cmd @("shell", "input", "tap", "980", "140") | Out-Null
  Start-Sleep -Seconds $LoadSec
  Shot "$Id-05-after-refresh" | Out-Null
  $steps += [pscustomobject]@{ step = "header-refresh-tap"; status = "OK"; note = "x=980 y=140" }

  # Екінші BACK — экраннан шығу
  Invoke-Adb -Cmd @("shell", "input", "keyevent", "KEYCODE_BACK") | Out-Null
  Start-Sleep -Seconds 2
  Shot "$Id-06-exit-screen" | Out-Null
  $steps += [pscustomobject]@{ step = "exit-to-previous"; status = "OK"; note = "" }

  return $steps
}

Wake-Device
$device = (Invoke-Adb -Cmd @("shell", "getprop", "ro.product.model")).Trim()
$api = (Invoke-Adb -Cmd @("shell", "getprop", "ro.build.version.sdk")).Trim()
$size = (Invoke-Adb -Cmd @("shell", "wm", "size")).Trim()

$halalSteps = Test-WebViewFlow -Id "halal" -Label "Халал Даму" -DeepLinkPath "more/halal" -TileLabelPattern "ХАЛАЛ|Halal|халал" -HomeUrlFragment "halaldamu"
$kmdbSteps = Test-WebViewFlow -Id "kmdb" -Label "ҚМДБ / muftyat.kz" -DeepLinkPath "more/kmdb" -TileLabelPattern "ҚМДБ|QMDB|muftyat|Муфтиат" -HomeUrlFragment "muftyat"

$all = @()
foreach ($s in $halalSteps) { $all += [pscustomobject]@{ module = "halal"; step = $s.step; status = $s.status; note = $s.note } }
foreach ($s in $kmdbSteps) { $all += [pscustomobject]@{ module = "kmdb"; step = $s.step; status = $s.status; note = $s.note } }

$csv = Join-Path $OutDir "qa-results.csv"
$all | Export-Csv -Path $csv -NoTypeInformation -Encoding UTF8

$logFinal = Join-Path $OutDir "logcat-final.txt"
& $adb @adbArgs logcat -d -t 300 | Out-File -FilePath $logFinal -Encoding utf8

$md = Join-Path $OutDir "QA_REPORT.md"
$lines = @(
  "# Халал Даму + ҚМДБ WebView QA — $((Get-Date).ToString('yyyy-MM-dd HH:mm'))",
  "",
  "- Құрылғы: **$device** (API $api)",
  "- Экран: ``$size``",
  "- Пакет: ``$pkg``",
  "- Скриншоттар: ``$OutDir``",
  "",
  "## Нәтижелер",
  "",
  "| Модуль | Қадам | Статус | Ескертпе |",
  "|--------|-------|--------|----------|"
)
foreach ($row in $all) {
  $note = (($row.note + "") -replace '\|', '/').Substring(0, [Math]::Min(100, (($row.note + "").Length)))
  $lines += "| $($row.module) | $($row.step) | $($row.status) | $note |"
}
$lines += ""
$lines += "## Тексерілген сценарийлер"
$lines += "1. Басты беттен тайл басу (немесе deep link fallback)"
$lines += "2. Сайт жүктелуі + скролл"
$lines += "3. Мазмұнға шерту → ішкі бет"
$lines += "4. Hardware BACK → WebView history"
$lines += "5. Header refresh батырмасы"
$lines += "6. BACK → экраннан шығу"
$lines -join "`n" | Out-File -FilePath $md -Encoding utf8

Write-Host ""
Write-Host "Дайын: $OutDir"
Write-Host "Есеп: $md"
$all | Format-Table -AutoSize
