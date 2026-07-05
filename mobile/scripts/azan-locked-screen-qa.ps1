param(
  [string]$Package = "kz.raqat.app",
  [string]$Apk = "",
  [int]$DelaySeconds = 45,
  [switch]$SkipInstall,
  [switch]$ImmediateBroadcast,
  [switch]$GrantExactAlarm,
  [switch]$WhitelistBattery,
  [switch]$WriteResultsJson
)

$ErrorActionPreference = "Stop"

$mobileDir = Split-Path $PSScriptRoot
$repoRoot = Split-Path $mobileDir
if (-not $Apk) {
  $releaseApk = Join-Path $mobileDir "raqat-release-latest.apk"
  $releaseBuilt = Join-Path $mobileDir "android\app\build\outputs\apk\release\app-release.apk"
  $debugApk = Join-Path $mobileDir "android\app\build\outputs\apk\debug\app-debug.apk"
  if (Test-Path $releaseApk) { $Apk = $releaseApk }
  elseif (Test-Path $releaseBuilt) { $Apk = $releaseBuilt }
  elseif (Test-Path $debugApk) { $Apk = $debugApk }
}

function Find-Adb {
  $candidates = @(
    (Get-Command adb -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source),
    "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
    "$env:USERPROFILE\AppData\Local\Android\Sdk\platform-tools\adb.exe",
    "C:\Android\Sdk\platform-tools\adb.exe"
  ) | Where-Object { $_ -and (Test-Path $_) }
  if (-not $candidates) { throw "adb табылмады. Android Platform Tools орнатыңыз." }
  return $candidates[0]
}

$adb = Find-Adb
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outDir = Join-Path $mobileDir "qa-azan-locked-$stamp"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Invoke-Adb([string[]]$Args) {
  & $adb @Args
  if ($LASTEXITCODE -ne 0) {
    throw "adb $($Args -join ' ') failed ($LASTEXITCODE)"
  }
}

$devices = (& $adb devices | Select-String -Pattern "\tdevice$").Count
if ($devices -lt 1) {
  throw "ADB device жоқ. USB debugging қосып, телефонда рұқсат беріңіз."
}

$serial = (& $adb get-serialno).Trim()
$api = [int]((& $adb shell getprop ro.build.version.sdk).Trim() -replace "[^0-9]", "")
$model = (& $adb shell getprop ro.product.model).Trim()
$brand = (& $adb shell getprop ro.product.brand).Trim()

Write-Host "== Azan locked-screen QA =="
Write-Host "Device: $brand $model (API $api, $serial)"
Write-Host "APK: $Apk"
Write-Host "Output: $outDir"
Write-Host ""

if (-not $SkipInstall) {
  if (-not (Test-Path $Apk)) {
    throw "APK жоқ: $Apk. Алдымен `npm run build:apk`."
  }
  Write-Host "== Install =="
  Invoke-Adb @("install", "-r", $Apk)
}

Write-Host "== Permissions =="
if ($api -ge 33) {
  & $adb shell pm grant $Package android.permission.POST_NOTIFICATIONS 2>$null
}
if ($GrantExactAlarm -and $api -ge 31) {
  & $adb shell appops set $Package SCHEDULE_EXACT_ALARM allow 2>$null
}
if ($WhitelistBattery) {
  & $adb shell dumpsys deviceidle whitelist "+$Package" 2>$null
  & $adb shell cmd deviceidle whitelist +$Package 2>$null
}

$exactAlarmOps = (& $adb shell appops get $Package SCHEDULE_EXACT_ALARM).Trim()
Write-Host "Exact alarm appops: $exactAlarmOps"

Write-Host ""
Write-Host "== Launch app =="
& $adb shell monkey -p $Package -c android.intent.category.LAUNCHER 1 | Out-Null
Start-Sleep -Seconds 5

if ($ImmediateBroadcast) {
  Write-Host "== Immediate broadcast (receiver + FGS path) =="
  & $adb shell input keyevent 26
  Start-Sleep -Seconds 2
  $nowMs = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  & $adb shell am broadcast -a kz.raqat.app.action.PRAYER_AZAN_FULLSCREEN -n $Package/.PrayerAzanAlarmReceiver --es label Asr --es enteredTitle "Asr_QA" --es time QA --es soundId adhan_haramain --es salatKey asr --el atMillis $nowMs
  if ($LASTEXITCODE -ne 0) { throw "azan broadcast failed" }
  Start-Sleep -Seconds 10
} else {
  Write-Host "== Schedule test alarm ($DelaySeconds s) via QA receiver =="
  & $adb shell am broadcast -a kz.raqat.app.action.SCHEDULE_AZAN_QA -n $Package/.PrayerAzanQaReceiver --ei delaySeconds $DelaySeconds
  if ($LASTEXITCODE -ne 0) { throw "schedule QA broadcast failed" }
  Write-Host "Экранды құлыптаңыз, қолданбаны фонға жіберіңіз. Күту: $DelaySeconds сек + buffer."
  $wait = [Math]::Max(30, $DelaySeconds + 25)
  & $adb shell input keyevent 26
  Start-Sleep -Seconds $wait
}

Write-Host ""
Write-Host "== Wake + screenshot =="
& $adb shell input keyevent 224 2>$null
Start-Sleep -Seconds 2
$remote = "/sdcard/raqat-azan-qa-$stamp.png"
$localShot = Join-Path $outDir "screen.png"
$prevEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"
& $adb shell screencap -p $remote 2>$null
& $adb pull $remote $localShot 2>$null
$ErrorActionPreference = $prevEap
if (Test-Path $localShot) {
  Write-Host "Screenshot: $localShot"
} else {
  Write-Host "WARN screenshot skipped (adb screencap failed — check logcat below)"
}

Write-Host ""
Write-Host "== Logcat (PrayerAzan*) =="
$logPath = Join-Path $outDir "logcat-prayer-azan.txt"
& $adb logcat -d -s PrayerAzanAlarm PrayerAzanDelivery PrayerAzanNativePlayer MainActivity | Out-File -FilePath $logPath -Encoding utf8
Get-Content $logPath -Tail 50

Write-Host ""
Write-Host "== Alarm snapshot =="
$alarmPath = Join-Path $outDir "dumpsys-alarm.txt"
& $adb shell dumpsys alarm | Select-String -Pattern $Package -Context 0,4 | Out-File -FilePath $alarmPath -Encoding utf8
Get-Content $alarmPath -Tail 40

$logText = if (Test-Path $logPath) { Get-Content $logPath -Raw } else { "" }
$activityStarted = $logText -match "Started azan activity|Azan activity started from FGS"
$nativeAudio = $logText -match "Started native azan audio"
$exactBlocked = $logText -match "Exact alarm blocked"
$qaPass = $activityStarted -or $nativeAudio

Write-Host ""
Write-Host "== QA summary =="
Write-Host "Exact alarm appops: $exactAlarmOps"
Write-Host "Activity started: $activityStarted"
Write-Host "Native audio: $nativeAudio"
Write-Host "Overall: $(if ($qaPass) { 'PASS' } else { 'FAIL' })"

if ($WriteResultsJson) {
  $resultsPath = Join-Path $repoRoot "docs/mobile/changelog/azan-locked-qa-$stamp.json"
  $payload = @{
    timestamp = (Get-Date).ToString("o")
    device = @{ serial = $serial; brand = $brand; model = $model; api = $api }
    apk = $Apk
    delaySeconds = $DelaySeconds
    exactAlarmAppops = $exactAlarmOps
    pass = [bool]$qaPass
    activityStarted = [bool]$activityStarted
    nativeAudio = [bool]$nativeAudio
    exactAlarmBlockedInLog = [bool]$exactBlocked
    screenshot = $localShot
    logcat = $logPath
    alarms = $alarmPath
  }
  $payload | ConvertTo-Json -Depth 5 | Set-Content -Path $resultsPath -Encoding utf8
  Write-Host "Results JSON: $resultsPath"
}

Write-Host ""
Write-Host "Done. Review: $outDir\screen.png"
if (-not $qaPass) { exit 1 }
