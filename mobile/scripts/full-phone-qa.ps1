# Толық телефон QA: APK орнату → барлық deep link → 7 тіл → скриншот + logcat
param(
  [string]$Serial = "",
  [string]$Apk = "",
  [switch]$SkipBuild,
  [switch]$SkipInstall,
  [int]$ScreenLoadSec = 10,
  [int]$WebLoadSec = 14,
  [string]$OutDir = ""
)

$ErrorActionPreference = "Stop"
$mobile = Split-Path $PSScriptRoot -Parent
$repoRoot = Split-Path $mobile -Parent
if (-not $Apk) {
  $Apk = Join-Path $mobile "android\app\build\outputs\apk\release\app-release.apk"
}
if (-not $OutDir) {
  $OutDir = Join-Path $mobile ("qa-full-phone-" + (Get-Date -Format "yyyy-MM-dd-HHmm"))
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
if ($Serial) { $adbArgs += "-s", $Serial } else {
  $serialLine = & $adb devices | Select-String -Pattern "\tdevice$" | Select-Object -First 1
  if (-not $serialLine) { throw "ADB device табылмады" }
  $Serial = ($serialLine -split "\t")[0].Trim()
  $adbArgs += "-s", $Serial
}

function Invoke-Adb {
  param(
    [Parameter(Mandatory)][string[]]$Cmd,
    [switch]$AllowNonZero
  )
  $out = & $adb @adbArgs @Cmd 2>&1
  if (-not $AllowNonZero -and $LASTEXITCODE -ne 0) {
    throw "adb failed: $($Cmd -join ' ') :: $out"
  }
  return $out
}

function Wake-Device {
  Invoke-Adb -Cmd @("shell", "input", "keyevent", "KEYCODE_WAKEUP") | Out-Null
  try { Invoke-Adb -Cmd @("shell", "wm", "dismiss-keyguard") | Out-Null } catch {}
  Start-Sleep -Seconds 1
}

function Shot {
  param([string]$Name)
  $safe = ($Name -replace '[^\w\-]', '_').Substring(0, [Math]::Min(120, ($Name -replace '[^\w\-]', '_').Length))
  $remote = "/sdcard/qa-$safe.png"
  $local = Join-Path $OutDir "$safe.png"
  Invoke-Adb -Cmd @("shell", "screencap", "-p", $remote) | Out-Null
  Invoke-Adb -Cmd @("pull", $remote, $local) | Out-Null
  try { Invoke-Adb -Cmd @("shell", "rm", $remote) | Out-Null } catch {}
  return $local
}

function Get-LogErrors {
  $raw = & $adb @adbArgs logcat -d -t 80 2>$null
  $hits = $raw | Select-String -Pattern "FATAL EXCEPTION|AndroidRuntime|ReactNativeJS.*Error|net::ERR|WebView.*error|Invariant Violation" | Select-Object -Last 8
  return ($hits -join " | ")
}

function Open-DeepLink {
  param([string]$Path)
  $uri = if ($Path) { "raqat://$Path" } else { "raqat://" }
  Invoke-Adb -Cmd @("shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", $uri, $pkg) -AllowNonZero | Out-Null
  return $uri
}

function Ui-Dump {
  $dumpRemote = "/sdcard/window_dump.xml"
  $dumpLocal = Join-Path $OutDir "_ui-dump-temp.xml"
  try {
    Invoke-Adb -Cmd @("shell", "uiautomator", "dump", $dumpRemote) | Out-Null
    Start-Sleep -Milliseconds 700
    Invoke-Adb -Cmd @("pull", $dumpRemote, $dumpLocal) | Out-Null
    if (Test-Path $dumpLocal) { return Get-Content -Raw -Encoding UTF8 $dumpLocal }
  } catch {}
  return $null
}

function Tap-ByPattern {
  param(
    [string]$Pattern,
    [int]$Index = 0
  )
  $xmlText = Ui-Dump
  if (-not $xmlText) { return $false }
  [xml]$xml = $xmlText
  $nodes = @($xml.SelectNodes("//node") | Where-Object {
    ($_.text -and $_.text -match $Pattern) -or ($_.'content-desc' -and $_.'content-desc' -match $Pattern)
  })
  if ($nodes.Count -le $Index) { return $false }
  $node = $nodes[$Index]
  if ($node.bounds -notmatch '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') { return $false }
  $cx = [int](([int]$Matches[1] + [int]$Matches[3]) / 2)
  $cy = [int](([int]$Matches[2] + [int]$Matches[4]) / 2)
  Invoke-Adb -Cmd @("shell", "input", "tap", "$cx", "$cy") | Out-Null
  return $true
}

function Press-Back {
  Invoke-Adb -Cmd @("shell", "input", "keyevent", "KEYCODE_BACK") | Out-Null
  Start-Sleep -Seconds 1
}

function Set-Locale {
  param([string]$LocaleLabelPattern)
  Open-DeepLink -Path "profile" | Out-Null
  Start-Sleep -Seconds $ScreenLoadSec
  Invoke-Adb -Cmd @("shell", "input", "swipe", "540", "1800", "540", "400", "500") | Out-Null
  Start-Sleep -Seconds 1
  if (-not (Tap-ByPattern -Pattern $LocaleLabelPattern)) {
    return $false
  }
  Start-Sleep -Seconds 4
  Press-Back
  Start-Sleep -Seconds 2
  return $true
}

function Visit-Screen {
  param(
    [string]$Locale,
    [string]$Id,
    [string]$DeepLink,
    [int]$WaitSec = 0
  )
  if ($WaitSec -le 0) {
    $WaitSec = if ($DeepLink -match "halal|kmdb|official|hajj|seerah|ai|fatua|muftyat|mushaf|hatim|quran") { $WebLoadSec } else { $ScreenLoadSec }
  }
  $logBefore = Get-LogErrors
  Invoke-Adb -Cmd @("logcat", "-c") | Out-Null
  $uri = Open-DeepLink -Path $DeepLink
  Start-Sleep -Seconds $WaitSec
  $shot = Shot "$Locale-$Id"
  $logAfter = Get-LogErrors
  $status = "OK"
  $note = $uri
  if ($logAfter) { $status = "WARN"; $note = $logAfter.Substring(0, [Math]::Min(180, $logAfter.Length)) }
  Press-Back
  Start-Sleep -Seconds 1
  return [pscustomobject]@{
    locale = $Locale
    screen = $Id
    deeplink = $DeepLink
    status = $status
    screenshot = $shot
    note = $note
  }
}

# --- Build ---
if (-not $SkipBuild) {
  Write-Host "== APK жинау (release) ==" -ForegroundColor Cyan
  Push-Location $mobile
  npm run build:apk 2>&1 | Tee-Object -FilePath (Join-Path $OutDir "build-log.txt")
  Pop-Location
  if (-not (Test-Path $Apk)) { throw "APK табылмады: $Apk" }
}

# --- Install ---
if (-not $SkipInstall) {
  Write-Host "== APK орнату ==" -ForegroundColor Cyan
  Invoke-Adb -Cmd @("uninstall", $pkg) -AllowNonZero | Out-Null
  Invoke-Adb -Cmd @("install", "-r", $Apk) | Out-Null
}

$api = (Invoke-Adb -Cmd @("shell", "getprop", "ro.build.version.sdk")).Trim()
if ([int]$api -ge 33) {
  Invoke-Adb -Cmd @("shell", "pm", "grant", $pkg, "android.permission.POST_NOTIFICATIONS") -AllowNonZero | Out-Null
}
Invoke-Adb -Cmd @("shell", "pm", "grant", $pkg, "android.permission.ACCESS_FINE_LOCATION") -AllowNonZero | Out-Null
Invoke-Adb -Cmd @("shell", "pm", "grant", $pkg, "android.permission.ACCESS_COARSE_LOCATION") -AllowNonZero | Out-Null
if ([int]$api -ge 31) {
  Invoke-Adb -Cmd @("shell", "appops", "set", $pkg, "SCHEDULE_EXACT_ALARM", "allow") -AllowNonZero | Out-Null
}

Wake-Device
Invoke-Adb -Cmd @("shell", "am", "force-stop", $pkg) | Out-Null
Start-Sleep -Seconds 1
Invoke-Adb -Cmd @("shell", "monkey", "-p", $pkg, "-c", "android.intent.category.LAUNCHER", "1") -AllowNonZero | Out-Null
Start-Sleep -Seconds 12
Shot "00-cold-start" | Out-Null

$device = (Invoke-Adb -Cmd @("shell", "getprop", "ro.product.model")).Trim()
$brand = (Invoke-Adb -Cmd @("shell", "getprop", "ro.product.brand")).Trim()

$screens = @(
  @{ id = "home"; path = "" },
  @{ id = "articles"; path = "articles" },
  @{ id = "prayer"; path = "prayer" },
  @{ id = "prayer-times"; path = "prayer-times" },
  @{ id = "saved"; path = "saved" },
  @{ id = "profile"; path = "profile" },
  @{ id = "qibla"; path = "qibla" },
  @{ id = "asma"; path = "asma" },
  @{ id = "duas"; path = "duas" },
  @{ id = "tasbih"; path = "tasbih" },
  @{ id = "content-hub"; path = "more" },
  @{ id = "kmdb"; path = "more/kmdb" },
  @{ id = "quran-list"; path = "more/quran" },
  @{ id = "quran-surah-1"; path = "more/surah/1" },
  @{ id = "hatim"; path = "more/hatim" },
  @{ id = "hatim-settings"; path = "more/hatim/settings" },
  @{ id = "mushaf-book"; path = "more/mushaf-book/1" },
  @{ id = "namaz-guide"; path = "more/namaz-guide" },
  @{ id = "tajweed"; path = "more/tajweed" },
  @{ id = "seerah"; path = "more/seerah" },
  @{ id = "hajj"; path = "more/hajj" },
  @{ id = "zakat"; path = "more/zakat" },
  @{ id = "halal"; path = "more/halal" },
  @{ id = "hadith-hub"; path = "more/hadith" },
  @{ id = "hadith-list"; path = "more/hadith/list" },
  @{ id = "ai"; path = "more/ai" },
  @{ id = "knowledge"; path = "more/knowledge" },
  @{ id = "kb-search"; path = "more/knowledge/search" },
  @{ id = "official-fatua"; path = "more/official/fatua" },
  @{ id = "official-muftyat"; path = "more/official/muftyat" },
  @{ id = "mosques"; path = "more/mosques" },
  @{ id = "ecosystem"; path = "more/ecosystem" },
  @{ id = "telegram"; path = "more/telegram" },
  @{ id = "tradition"; path = "more/tradition" },
  @{ id = "tradition-favorites"; path = "more/tradition/favorites" },
  @{ id = "tradition-books"; path = "more/tradition/books" },
  @{ id = "kurban-ait"; path = "more/kurban-ait" },
  @{ id = "great-words"; path = "more/tradition/great-words" },
  @{ id = "prayer-settings"; path = "more/prayer-settings" },
  @{ id = "quran-settings"; path = "more/quran-settings" },
  @{ id = "more-settings"; path = "more/more-settings" }
)

$locales = @(
  @{ id = "kk"; pattern = "Қазақша|Qazaq" },
  @{ id = "ru"; pattern = "Русский|Russian" },
  @{ id = "en"; pattern = "English|Ағылшын" },
  @{ id = "ky"; pattern = "Кыргыз|Kyrgyz|Кыргызча" },
  @{ id = "uz"; pattern = "O'zbek|Ozbek|Узбек" },
  @{ id = "tr"; pattern = "Türk|Türkçe|Turk" },
  @{ id = "ar"; pattern = "العربية|Arabic|Араб" }
)

$results = @()

foreach ($loc in $locales) {
  Write-Host ""
  Write-Host "======== LOCALE: $($loc.id) ========" -ForegroundColor Yellow
  Wake-Device
  Invoke-Adb -Cmd @("shell", "am", "force-stop", $pkg) | Out-Null
  Start-Sleep -Seconds 1
  Invoke-Adb -Cmd @("shell", "monkey", "-p", $pkg, "-c", "android.intent.category.LAUNCHER", "1") -AllowNonZero | Out-Null
  Start-Sleep -Seconds 10

  $setOk = Set-Locale -LocaleLabelPattern $loc.pattern
  $results += [pscustomobject]@{
    locale = $loc.id
    screen = "_set-locale"
    deeplink = "profile"
    status = if ($setOk) { "OK" } else { "FAIL" }
    screenshot = ""
    note = $loc.pattern
  }
  Start-Sleep -Seconds 3
  Shot "$($loc.id)-00-home-after-locale" | Out-Null

  foreach ($scr in $screens) {
    Write-Host "  -> $($scr.id)" -ForegroundColor DarkGray
    try {
      $row = Visit-Screen -Locale $loc.id -Id $scr.id -DeepLink $scr.path
      $results += $row
    } catch {
      $results += [pscustomobject]@{
        locale = $loc.id
        screen = $scr.id
        deeplink = $scr.path
        status = "FAIL"
        screenshot = ""
        note = $_.Exception.Message
      }
    }
  }
}

# --- Интерактив: Hajj Kaaba Live, Halal tabs, KMDB tabs (kk) ---
Write-Host ""
Write-Host "======== INTERACTIVE FLOWS (kk) ========" -ForegroundColor Yellow
Set-Locale -Pattern "Қазақша|Qazaq" | Out-Null
Start-Sleep -Seconds 2

# Hajj + Kaaba live
Open-DeepLink -Path "more/hajj" | Out-Null
Start-Sleep -Seconds $ScreenLoadSec
Shot "interactive-hajj" | Out-Null
if (Tap-ByPattern -Pattern "Қағба|Kaaba|онлайн|LIVE|live") {
  Start-Sleep -Seconds $WebLoadSec
  Shot "interactive-kaaba-live" | Out-Null
  $results += [pscustomobject]@{ locale = "kk"; screen = "kaaba-live-modal"; deeplink = "more/hajj"; status = "OK"; screenshot = "interactive-kaaba-live"; note = "tap live btn" }
  Press-Back
} else {
  $results += [pscustomobject]@{ locale = "kk"; screen = "kaaba-live-modal"; deeplink = "more/hajj"; status = "FAIL"; screenshot = ""; note = "live button not found" }
}
Press-Back

# Halal tabs
Open-DeepLink -Path "more/halal" | Out-Null
Start-Sleep -Seconds $WebLoadSec
foreach ($tabPat in @("Мекемелер|Establishments", "Тексеру|Verify|Check", "Карта|Map")) {
  Tap-ByPattern -Pattern $tabPat | Out-Null
  Start-Sleep -Seconds 6
  Shot "interactive-halal-$tabPat" | Out-Null
}
Press-Back

# KMDB tabs
Open-DeepLink -Path "more/kmdb" | Out-Null
Start-Sleep -Seconds $WebLoadSec
foreach ($tabPat in @("Fatua|fatua|Пәтуа", "Мешіт|Mosque|mosque", "Muftyat|muftyat|Муфтиат")) {
  Tap-ByPattern -Pattern $tabPat | Out-Null
  Start-Sleep -Seconds $WebLoadSec
  Shot "interactive-kmdb-$tabPat" | Out-Null
}
Press-Back

# Dashboard tiles tap (home)
Open-DeepLink -Path "" | Out-Null
Start-Sleep -Seconds 8
$tilePatterns = @("Қuran|Quran|Құран", "Hadith|Хадис", "Namaz|Намаз", "Tajweed|Тәжуид", "Seerah|Сира", "Hajj|Қаж|Haj", "Tasbih|Тасbih|Тасбих", "Duas|Дұға", "Asma|Есім", "QMDB|ҚМДБ", "Halal|Халал", "Tradition|Дәстүр|Tradition")
foreach ($tp in $tilePatterns) {
  Open-DeepLink -Path "" | Out-Null
  Start-Sleep -Seconds 6
  if (Tap-ByPattern -Pattern $tp) {
    Start-Sleep -Seconds $ScreenLoadSec
    Shot "interactive-tile-$tp" | Out-Null
    $results += [pscustomobject]@{ locale = "kk"; screen = "tile-$tp"; deeplink = "home-tap"; status = "OK"; screenshot = "interactive-tile-$tp"; note = "" }
    Press-Back
  } else {
    $results += [pscustomobject]@{ locale = "kk"; screen = "tile-$tp"; deeplink = "home-tap"; status = "FAIL"; screenshot = ""; note = "tile not found" }
  }
}

# --- Report ---
$csv = Join-Path $OutDir "qa-results.csv"
$results | Export-Csv -Path $csv -NoTypeInformation -Encoding UTF8

$failCount = ($results | Where-Object { $_.status -eq "FAIL" }).Count
$warnCount = ($results | Where-Object { $_.status -eq "WARN" }).Count
$okCount = ($results | Where-Object { $_.status -eq "OK" }).Count

$logFinal = Join-Path $OutDir "logcat-final.txt"
& $adb @adbArgs logcat -d -t 500 | Out-File -FilePath $logFinal -Encoding utf8

$md = Join-Path $OutDir "QA_REPORT.md"
$lines = @(
  "# Толық телефон QA — $((Get-Date).ToString('yyyy-MM-dd HH:mm'))",
  "",
  "- Құрылғы: **$brand $device** (API $api, serial $Serial)",
  "- APK: ``$Apk``",
  "- Скриншоттар: ``$OutDir``",
  "",
  "## Қорытынды",
  "",
  "| Статус | Саны |",
  "|--------|------|",
  "| OK | $okCount |",
  "| WARN | $warnCount |",
  "| FAIL | $failCount |",
  "",
  "## FAIL тізімі",
  ""
)
foreach ($f in ($results | Where-Object { $_.status -eq "FAIL" })) {
  $lines += "- **$($f.locale)** / $($f.screen): $($f.note)"
}
$lines += ""
$lines += "## WARN тізімі (logcat)"
foreach ($w in ($results | Where-Object { $_.status -eq "WARN" } | Select-Object -First 40)) {
  $lines += "- **$($w.locale)** / $($w.screen): $($w.note)"
}
$lines -join "`n" | Out-File -FilePath $md -Encoding utf8

Write-Host ""
Write-Host "Дайын: $OutDir" -ForegroundColor Green
Write-Host "OK=$okCount WARN=$warnCount FAIL=$failCount"
Write-Host "Есеп: $md"
if ($failCount -gt 0) { exit 2 }
exit 0
