param(
  [string]$Apk = "",
  [string]$Package = "kz.raqat.app",
  [switch]$SkipInstall,
  [switch]$KeepData,
  [switch]$GrantExactAlarm,
  [switch]$WhitelistBatteryOptimization,
  [switch]$OpenExactAlarmSettings
)

$ErrorActionPreference = "Stop"

$mobileDir = Split-Path $PSScriptRoot
if (-not $Apk) {
  $Apk = Join-Path $mobileDir "android\app\build\outputs\apk\release\app-release.apk"
}

function Require-Command($Name) {
  $cmd = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $cmd) {
    throw "$Name табылмады. Android Platform Tools PATH ішінде болуы керек."
  }
}

function Invoke-Adb {
  & adb @args
  if ($LASTEXITCODE -ne 0) {
    throw "adb $args сәтсіз аяқталды (код $LASTEXITCODE)."
  }
}

Require-Command "adb"

$devices = (& adb devices | Select-String -Pattern "\tdevice$").Count
if ($devices -lt 1) {
  throw "ADB device табылмады. Телефонда USB debugging қосып, `adb devices` арқылы рұқсат беріңіз."
}

$serial = (& adb get-serialno).Trim()
$api = [int]((& adb shell getprop ro.build.version.sdk).Trim() -replace "[^0-9]", "")
$model = (& adb shell getprop ro.product.model).Trim()
$brand = (& adb shell getprop ro.product.brand).Trim()

Write-Host "== Device =="
Write-Host "Serial: $serial"
Write-Host "Model: $brand $model"
Write-Host "Android API: $api"
Write-Host ""

if (-not $SkipInstall) {
  if (-not (Test-Path $Apk)) {
    throw "APK табылмады: $Apk. Алдымен `npm run build:apk` орындаңыз."
  }
  if (-not $KeepData) {
    Write-Host "== Fresh uninstall =="
    & adb uninstall $Package | Out-Host
  }
  Write-Host "== Install release APK =="
  Invoke-Adb install -r $Apk
}

Write-Host "== Runtime permissions =="
if ($api -ge 33) {
  & adb shell pm grant $Package android.permission.POST_NOTIFICATIONS | Out-Host
}
& adb shell pm grant $Package android.permission.ACCESS_FINE_LOCATION | Out-Host
& adb shell pm grant $Package android.permission.ACCESS_COARSE_LOCATION | Out-Host

Write-Host ""
Write-Host "== Package permission snapshot =="
& adb shell dumpsys package $Package | Select-String -Pattern "POST_NOTIFICATIONS|SCHEDULE_EXACT_ALARM|RECEIVE_BOOT_COMPLETED|WAKE_LOCK|ACCESS_FINE_LOCATION|ACCESS_COARSE_LOCATION" | Out-Host

Write-Host ""
Write-Host "== Exact alarm / appops snapshot =="
if ($GrantExactAlarm -and $api -ge 31) {
  & adb shell appops set $Package SCHEDULE_EXACT_ALARM allow | Out-Host
}
& adb shell appops get $Package SCHEDULE_EXACT_ALARM | Out-Host

Write-Host ""
Write-Host "== Battery / Doze snapshot =="
if ($WhitelistBatteryOptimization) {
  & adb shell dumpsys deviceidle whitelist "+$Package" | Out-Host
}
& adb shell dumpsys deviceidle whitelist | Select-String -Pattern $Package | Out-Host

if ($OpenExactAlarmSettings -or $api -ge 31) {
  Write-Host ""
  Write-Host "== Opening exact alarm settings =="
  $exactAlarmDataUri = "package:" + $Package
  & adb shell am start -a android.settings.REQUEST_SCHEDULE_EXACT_ALARM -d $exactAlarmDataUri | Out-Host
  Write-Host "Телефоннан 'Alarms & reminders / Дәл оятқыштар' рұқсатын қосып тексеріңіз."
}

Write-Host ""
Write-Host "== Launch app =="
& adb shell monkey -p $Package -c android.intent.category.LAUNCHER 1 | Out-Host

Write-Host ""
Write-Host "== Alarm snapshot =="
& adb shell dumpsys alarm | Select-String -Pattern $Package -Context 0,4 | Select-Object -First 80 | Out-Host

Write-Host ""
Write-Host "== Notification channel snapshot =="
& adb shell dumpsys notification --noredact | Select-String -Pattern $Package -Context 0,8 | Select-Object -First 100 | Out-Host

Write-Host ""
Write-Host "== Widget provider snapshot =="
& adb shell dumpsys appwidget | Select-String -Pattern "$Package|PrayerHomeStripWidgetProvider" -Context 0,4 | Select-Object -First 80 | Out-Host

Write-Host ""
Write-Host "== Manual acceptance checklist =="
Write-Host "1. Fresh install ашылды, onboarding/permission crash жоқ."
Write-Host "2. Баптаулар -> Намаз баптаулары -> Хабарлама диагностикасы: permission=granted, scheduledPrayerCount > 0."
Write-Host "3. Бір намаздың дыбысын өшіріп/қосып, diagnostics refresh жасаңыз."
Write-Host "4. Android 12+ exact alarm рұқсаты қосулы екенін тексеріңіз."
Write-Host "5. Телефонды reboot жасап, app ашылғаннан кейін notification/channel sound сақталғанын тексеріңіз."
Write-Host "6. Battery restriction/Doze: қолданбаны unrestricted/optimized режимдерінде кемі бір намаз уақытында тексеріңіз."
Write-Host "7. Home screen widget қосыңыз: RAQAT 5x1 strip көрінеді, намаз уақыты/ауа райы/құбыла жаңарады."

