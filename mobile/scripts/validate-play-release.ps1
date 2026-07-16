param(
  [string]$Aab = "",
  [string]$AndroidDir = "",
  [switch]$SkipGitHygiene
)

$ErrorActionPreference = "Stop"

$mobileDir = Split-Path $PSScriptRoot
$repoRoot = Split-Path $mobileDir
if (-not $AndroidDir) { $AndroidDir = Join-Path $mobileDir "android" }
if (-not $Aab) { $Aab = Join-Path $AndroidDir "app\build\outputs\bundle\release\app-release.aab" }

function Fail($Message) {
  Write-Error $Message
  exit 1
}

function Sha256($Path) {
  (Get-FileHash -Path $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

Write-Host "== Play release readiness =="

if (-not $SkipGitHygiene) {
  $git = Get-Command git -ErrorAction SilentlyContinue
  if ($git) {
    $artifactPaths = @(
      "mobile/raqat-debug-latest.apk",
      "mobile/raqat-release-latest.apk",
      "mobile/raqat-play-release-latest.aab",
      "mobile/dist-webdeploy.tar.gz",
      "mobile/raqat-web-refresh.tar.gz",
      "mobile/raqat-web-quran-size.tar.gz",
      "raqat-release-latest.apk",
      ".tmp",
      ".gradle-user-home"
    )
    $trackedArtifacts = @(git -C $repoRoot ls-files -- $artifactPaths)
    if ($trackedArtifacts.Count -gt 0) {
      Fail ("Generated artifact/work-cache files are still tracked:`n{0}`nMove release artifacts outside git or remove them from tracking before Play handoff. Use -SkipGitHygiene only for local diagnostics." -f ($trackedArtifacts -join "`n"))
    }

    $artifactStatus = @(git -C $repoRoot status --porcelain -- $artifactPaths)
    $nonCleanupStatus = @($artifactStatus | Where-Object { $_ -notmatch '^\s*D\s+' })
    if ($nonCleanupStatus.Count -gt 0) {
      Fail ("Generated artifact/work-cache files are dirty:`n{0}`nMove release artifacts outside git before Play handoff. Use -SkipGitHygiene only for local diagnostics." -f ($nonCleanupStatus -join "`n"))
    }
    if ($artifactStatus.Count -gt 0) {
      Write-Warning ("Generated artifact cleanup is staged:`n{0}`nCommit this cleanup before final release handoff." -f ($artifactStatus -join "`n"))
    }

    $releaseCriticalPaths = @(
      "mobile/android/app/src/main/java/kz/raqat/app/PrayerAzanAlarmReceiver.kt",
      "mobile/android/app/src/main/java/kz/raqat/app/PrayerAzanAlarmScheduler.kt",
      "mobile/android/app/src/main/java/kz/raqat/app/PrayerWidgetModule.kt",
      "mobile/scripts/android-release-smoke.ps1",
      "mobile/scripts/validate-play-release.ps1"
    )
    $releaseCriticalStatus = @(git -C $repoRoot status --porcelain -- $releaseCriticalPaths)
    $untrackedCritical = @($releaseCriticalStatus | Where-Object { $_ -match '^\?\?' })
    if ($untrackedCritical.Count -gt 0) {
      Fail ("Release-critical native/script files are untracked:`n{0}`nAdd and commit these files before Play handoff; otherwise Azan/release checks can be missing from the released source." -f ($untrackedCritical -join "`n"))
    }
    Write-Host "Git hygiene: generated artifacts clean"
  } else {
    Write-Warning "git command not found; skipped generated artifact hygiene check."
  }
}

if (-not (Test-Path $Aab)) {
  Fail "AAB табылмады: $Aab. Алдымен `npm run build:aab` орындаңыз."
}
$aabFile = Get-Item $Aab
Write-Host ("AAB: {0}" -f $aabFile.FullName)
Write-Host ("Size: {0:N2} MB" -f ($aabFile.Length / 1MB))
Write-Host ("SHA256: {0}" -f (Sha256 $aabFile.FullName))

$keystoreProps = Join-Path $AndroidDir "keystore.properties"
if (-not (Test-Path $keystoreProps)) {
  Fail "android/keystore.properties жоқ. Play upload key/JKS конфигурациясын қосыңыз."
}
$props = @{}
Get-Content $keystoreProps | ForEach-Object {
  if ($_ -match '^\s*([A-Za-z0-9_.-]+)\s*=\s*(.+?)\s*$') {
    $props[$Matches[1]] = $Matches[2]
  }
}
foreach ($key in @("storeFile", "keyAlias", "storePassword", "keyPassword")) {
  if (-not $props.ContainsKey($key) -or [string]::IsNullOrWhiteSpace([string]$props[$key])) {
    Fail "keystore.properties ішінде `$key` бос немесе жоқ."
  }
}
$storeFile = Join-Path $AndroidDir ([string]$props["storeFile"])
if (-not (Test-Path $storeFile)) {
  Fail "JKS storeFile табылмады (мәні жасырылды)."
}
Write-Host "Keystore: OK (path exists, values hidden)"

$manifest = Join-Path $AndroidDir "app\src\main\AndroidManifest.xml"
if (-not (Test-Path $manifest)) {
  Fail "AndroidManifest.xml табылмады."
}
$manifestText = Get-Content $manifest -Raw
$requiredPerms = @(
  "android.permission.INTERNET",
  "android.permission.ACCESS_NETWORK_STATE",
  "android.permission.ACCESS_FINE_LOCATION",
  "android.permission.ACCESS_COARSE_LOCATION",
  "android.permission.POST_NOTIFICATIONS",
  "android.permission.SCHEDULE_EXACT_ALARM",
  "android.permission.USE_FULL_SCREEN_INTENT",
  "android.permission.RECEIVE_BOOT_COMPLETED",
  "android.permission.WAKE_LOCK"
)
foreach ($perm in $requiredPerms) {
  if ($manifestText -notmatch [regex]::Escape($perm)) {
    Fail "Manifest permission missing: $perm"
  }
}
Write-Host "Manifest permissions: OK"

$networkSecurity = Join-Path $AndroidDir "app\src\main\res\xml\network_security_config.xml"
if (-not (Test-Path $networkSecurity)) {
  Fail "network_security_config.xml табылмады."
}
$networkSecurityText = Get-Content $networkSecurity -Raw
if ($networkSecurityText -match 'cleartextTrafficPermitted\s*=\s*"true"') {
  $cleartextBlocks = [regex]::Matches(
    $networkSecurityText,
    '<domain-config[^>]*cleartextTrafficPermitted\s*=\s*"true"[^>]*>.*?</domain-config>',
    [System.Text.RegularExpressions.RegexOptions]::Singleline
  )
  foreach ($block in $cleartextBlocks) {
    if ($block.Value -notmatch 'live\.net\.sa') {
      Fail ("Play release network security config contains unauthorized cleartext domain-config:`n{0}`nOnly live.net.sa (Kaaba HLS) is allowed in release." -f $block.Value)
    }
  }
  if ($cleartextBlocks.Count -eq 0) {
    Fail "Play release network security config ішінде cleartextTrafficPermitted=true бар. Release HTTPS-only болуы керек."
  }
}
Write-Host "Network security: HTTPS-only OK"

$widgetXmlDir = Join-Path $AndroidDir "app\src\main\res\xml"
$allowedWidgetInfos = @("prayer_home_strip_widget_info.xml")
$widgetInfoFiles = @(Get-ChildItem -Path $widgetXmlDir -Filter "prayer_*_widget_info.xml" -ErrorAction SilentlyContinue)
foreach ($file in $widgetInfoFiles) {
  if ($allowedWidgetInfos -notcontains $file.Name) {
    Fail "Unregistered/stale widget provider XML found: $($file.Name). Remove it or register the matching provider."
  }
}
if ($widgetInfoFiles.Count -ne $allowedWidgetInfos.Count) {
  Fail "Widget provider XML count mismatch. Expected: $($allowedWidgetInfos -join ', ')"
}
Write-Host "Widget provider XML: OK"

Write-Host ""
Write-Host "Upload target:"
Write-Host "Play Console -> Testing -> Internal testing -> Create release -> upload app-release.aab"
Write-Host "Data safety/privacy declarations: docs/RELEASE_1MIN_CHECKLIST.md"

# APK size budget (warn gate — blocks handoff when APK is present)
$apkCandidates = @(
  (Join-Path $mobileDir "android\app\build\outputs\apk\release\app-release.apk"),
  (Join-Path $mobileDir "raqat-release-latest.apk")
)
$apkFile = $apkCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($apkFile) {
  $apkMb = (Get-Item $apkFile).Length / 1MB
  $budgetJson = Join-Path $mobileDir "src\config\releaseFocusBudgets.ts"
  $apkWarnMb = 145
  $apkTargetMb = 80
  if (Test-Path $budgetJson) {
    $budgetText = Get-Content $budgetJson -Raw
    if ($budgetText -match 'apkWarnMb:\s*(\d+)') {
      $apkWarnMb = [int]$Matches[1]
    }
    if ($budgetText -match 'apkTargetMb:\s*(\d+)') {
      $apkTargetMb = [int]$Matches[1]
    }
  }
  Write-Host ("APK size: {0:N2} MB (target {1} MB, warn {2} MB)" -f $apkMb, $apkTargetMb, $apkWarnMb)
  if ($apkMb -gt $apkTargetMb) {
    Write-Warning ("APK size {0:N2} MB exceeds freeze target {1} MB — prune assets or use npm run build:apk." -f $apkMb, $apkTargetMb)
  }
  if ($apkMb -gt $apkWarnMb) {
    Fail ("APK size {0:N2} MB exceeds budget warn gate {1} MB. Prune assets or split bundles before Play handoff." -f $apkMb, $apkWarnMb)
  }
  Write-Host "APK size budget: OK"
} else {
  Write-Warning "Release APK not found — skipped APK size budget check. Build with `npm run build:apk` for full gate."
}

Write-Host "OK: local Play readiness passed"

