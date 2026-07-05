# Құран экраны телефон QA: deep link → скриншот → logcat + UI dump
param(
  [string]$Serial = "R58R54KA0FE",
  [int]$WaitSec = 10,
  [string]$OutDir = "",
  [switch]$SkipInstall,
  [string]$Apk = ""
)

$ErrorActionPreference = "Stop"
$mobile = Split-Path $PSScriptRoot -Parent
if (-not $Apk) {
  $Apk = Join-Path $mobile "android\app\build\outputs\apk\release\app-release.apk"
}
if (-not $OutDir) {
  $OutDir = Join-Path $mobile ("qa-quran-phone-" + (Get-Date -Format "yyyy-MM-dd-HHmm"))
}
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

function Find-Adb {
  $candidates = @(
    (Get-Command adb -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source),
    "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
  ) | Where-Object { $_ -and (Test-Path $_) }
  if (-not $candidates -or @($candidates).Count -eq 0) { throw "adb табылмады" }
  return @($candidates)[0]
}

$adb = Find-Adb
$pkg = "kz.raqat.app"
$adbArgs = @("-s", $Serial)

function Invoke-Adb {
  param([string[]]$Cmd, [switch]$AllowNonZero)
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $out = & "$adb" @adbArgs @Cmd 2>&1 | Out-String
    if (-not $AllowNonZero -and $LASTEXITCODE -ne 0) { throw "adb failed: $($Cmd -join ' ') :: $out" }
    return $out
  } finally {
    $ErrorActionPreference = $prev
  }
}

function Wake-Device {
  Invoke-Adb -Cmd @("shell", "input", "keyevent", "KEYCODE_WAKEUP") | Out-Null
  try { Invoke-Adb -Cmd @("shell", "wm", "dismiss-keyguard") | Out-Null } catch {}
  Start-Sleep -Seconds 1
}

function Shot([string]$Name) {
  $safe = ($Name -replace '[^\w\-]', '_').Substring(0, [Math]::Min(100, ($Name -replace '[^\w\-]', '_').Length))
  $remote = "/sdcard/qa-q-$safe.png"
  $local = Join-Path $OutDir "$safe.png"
  Invoke-Adb -Cmd @("shell", "screencap", "-p", $remote) | Out-Null
  Invoke-Adb -Cmd @("pull", $remote, $local) | Out-Null
  try { Invoke-Adb -Cmd @("shell", "rm", $remote) | Out-Null } catch {}
  return $local
}

function Open-Link([string]$Path) {
  $uri = if ($Path) { "raqat://$Path" } else { "raqat://" }
  Invoke-Adb -Cmd @("shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", $uri, $pkg) -AllowNonZero | Out-Null
  return $uri
}

function Log-Errors {
  $raw = & "$adb" @adbArgs logcat -d -t 60 2>$null
  $hits = $raw | Select-String -Pattern "FATAL EXCEPTION|AndroidRuntime|ReactNativeJS.*Error|Invariant Violation|TypeError|ReferenceError" | Select-Object -Last 6
  return ($hits -join " | ")
}

function Ui-Dump {
  $dumpRemote = "/sdcard/window_dump.xml"
  $dumpLocal = Join-Path $OutDir "_ui-dump.xml"
  try {
    Invoke-Adb -Cmd @("shell", "uiautomator", "dump", $dumpRemote) | Out-Null
    Start-Sleep -Milliseconds 600
    Invoke-Adb -Cmd @("pull", $dumpRemote, $dumpLocal) | Out-Null
    if (Test-Path $dumpLocal) { return Get-Content -Raw -Encoding UTF8 $dumpLocal }
  } catch {}
  return $null
}

function Tap-Pattern([string]$Pattern) {
  $xmlText = Ui-Dump
  if (-not $xmlText) { return $false }
  [xml]$xml = $xmlText
  $node = $xml.SelectNodes("//node") | Where-Object {
    ($_.text -and $_.text -match $Pattern) -or ($_.'content-desc' -and $_.'content-desc' -match $Pattern)
  } | Select-Object -First 1
  if (-not $node -or $node.bounds -notmatch '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') { return $false }
  $cx = [int](([int]$Matches[1] + [int]$Matches[3]) / 2)
  $cy = [int](([int]$Matches[2] + [int]$Matches[4]) / 2)
  Invoke-Adb -Cmd @("shell", "input", "tap", "$cx", "$cy") | Out-Null
  return $true
}

function Press-Back {
  Invoke-Adb -Cmd @("shell", "input", "keyevent", "KEYCODE_BACK") | Out-Null
  Start-Sleep -Seconds 1
}

function Visit([string]$Id, [string]$Path, [int]$Wait = 0) {
  if ($Wait -le 0) { $Wait = $WaitSec }
  Invoke-Adb -Cmd @("logcat", "-c") | Out-Null
  $uri = Open-Link -Path $Path
  Start-Sleep -Seconds $Wait
  $shot = Shot $Id
  $log = Log-Errors
  $status = if ($log) { "WARN" } else { "OK" }
  return [pscustomobject]@{ id = $Id; path = $Path; uri = $uri; status = $status; screenshot = $shot; log = $log }
}

if (-not $SkipInstall -and (Test-Path $Apk)) {
  Write-Host "== APK орнату ==" -ForegroundColor Cyan
  Invoke-Adb -Cmd @("install", "-r", $Apk) | Out-Null
}

Wake-Device
Invoke-Adb -Cmd @("shell", "am", "force-stop", $pkg) | Out-Null
Start-Sleep -Seconds 1
Invoke-Adb -Cmd @("shell", "monkey", "-p", $pkg, "-c", "android.intent.category.LAUNCHER", "1") -AllowNonZero | Out-Null
Start-Sleep -Seconds 10

$routes = @(
  @{ id = "quran-list"; path = "more/quran" },
  @{ id = "surah-1"; path = "more/surah/1" },
  @{ id = "surah-2"; path = "more/surah/2" },
  @{ id = "surah-2-ayah-255"; path = "more/surah/2?ayah=255" },
  @{ id = "hatim"; path = "more/hatim" },
  @{ id = "mushaf-p1"; path = "more/mushaf-book/1" },
  @{ id = "mushaf-p4"; path = "more/mushaf-book/4?focusSurah=2&focusAyah=1&continuousMushaf=1" },
  @{ id = "mushaf-p604"; path = "more/mushaf-book/604" },
  @{ id = "tajweed"; path = "more/tajweed" },
  @{ id = "quran-settings"; path = "more/quran-settings" },
  @{ id = "prayer-times"; path = "prayer-times" },
  @{ id = "prayer-azan"; path = "prayer-azan?prayer=fajr" },
  @{ id = "hajj"; path = "more/hajj" }
)

$results = @()
foreach ($r in $routes) {
  Write-Host ">> $($r.id)" -ForegroundColor DarkGray
  try {
    $results += Visit -Id $r.id -Path $r.path
  } catch {
    $results += [pscustomobject]@{ id = $r.id; path = $r.path; uri = ""; status = "FAIL"; screenshot = ""; log = $_.Exception.Message }
  }
  Press-Back
}

# Hajj Kaaba live tap
Open-Link "more/hajj" | Out-Null
Start-Sleep -Seconds $WaitSec
Invoke-Adb -Cmd @("shell", "input", "swipe", "540", "1700", "540", "500", "450") -AllowNonZero | Out-Null
Start-Sleep -Seconds 2
Shot "hajj-scrolled" | Out-Null
if (Tap-Pattern "Қағба онлайн|Kaaba|Тікелей эфир|LIVE") {
  Start-Sleep -Seconds 14
  Shot "hajj-kaaba-live" | Out-Null
  $results += [pscustomobject]@{ id = "kaaba-live"; path = "more/hajj"; uri = ""; status = "OK"; screenshot = "hajj-kaaba-live"; log = "" }
  Press-Back
} else {
  $results += [pscustomobject]@{ id = "kaaba-live"; path = "more/hajj"; uri = ""; status = "FAIL"; screenshot = ""; log = "kaaba button not found" }
}
Press-Back

# Prayer times tap (azan error check)
Open-Link "prayer-times" | Out-Null
Start-Sleep -Seconds $WaitSec
Shot "prayer-times-main" | Out-Null
Tap-Pattern "Fajr|Таң|Бомдод|Subh" | Out-Null
Start-Sleep -Seconds 4
$logPrayer = Log-Errors
$results += [pscustomobject]@{
  id = "prayer-tap-fajr"
  path = "prayer-times"
  uri = ""
  status = if ($logPrayer) { "WARN" } else { "OK" }
  screenshot = (Shot "prayer-tap-fajr")
  log = $logPrayer
}

$csv = Join-Path $OutDir "quran-qa-results.csv"
$results | Export-Csv -Path $csv -NoTypeInformation -Encoding UTF8
& "$adb" @adbArgs logcat -d -t 300 | Out-File -FilePath (Join-Path $OutDir "logcat-final.txt") -Encoding utf8

$fail = ($results | Where-Object { $_.status -eq "FAIL" }).Count
$warn = ($results | Where-Object { $_.status -eq "WARN" }).Count
Write-Host "Дайын: $OutDir (FAIL=$fail WARN=$warn)" -ForegroundColor Green
if ($fail -gt 0) { exit 2 }
