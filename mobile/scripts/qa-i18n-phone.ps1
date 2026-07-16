# i18n chrome QA on device: set locale via AsyncStorage-compatible SharedPreferences isn't available for RN AsyncStorage.
# Instead dump UI hierarchy after navigating Settings language rows if possible.
# Fallback: inject locale by restarting with adb shell run-as + files (debug only).

$ErrorActionPreference = "Continue"
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$pkg = "kz.raqat.app"
$outDir = "d:\opt\raqat-ai\mobile\.qa-phone\i18n"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Dump-Ui($name) {
  & $adb shell uiautomator dump /sdcard/ui.xml | Out-Null
  & $adb pull /sdcard/ui.xml "$outDir\$name.xml" 2>$null | Out-Null
  & $adb shell screencap -p /sdcard/qa.png | Out-Null
  & $adb pull /sdcard/qa.png "$outDir\$name.png" 2>$null | Out-Null
  if (Test-Path "$outDir\$name.xml") {
    $xml = Get-Content "$outDir\$name.xml" -Raw -Encoding UTF8
    return $xml
  }
  return ""
}

function Has-KkLeak($xml, $locale) {
  if ($locale -eq "kk") { return @() }
  $leaks = @()
  $markers = @(
    "Әзірге сақталған дерек жоқ",
    "Хатымды ашу",
    "Қажылық жол картасы",
    "Ботты ашу",
    "Оқу картасы",
    "Іздеу бойынша хадис табылмады",
    "Салт-дәстүрдің дінмен қатысы"
  )
  foreach ($m in $markers) {
    if ($xml -and $xml.Contains($m)) { $leaks += $m }
  }
  return $leaks
}

# Expected chrome snippets per locale (any one match = OK for that screen)
$expect = @{
  ru = @("Открыть", "Сохраненн", "Хатм", "Статьи", "Карта обучения", "Дорожная карта")
  en = @("Open", "Saved", "Hatim", "Articles", "Study map", "Hajj roadmap", "No saved")
  ky = @("Ачуу", "Хатм", "Окуу картасы", "Ажылык")
  uz = @("Ochish", "Xatm", "O'qish xaritasi", "Haj")
  tr = @("Aç", "Hatim", "Çalışma haritası", "Hac")
  ar = @("فتح", "الختمة", "خريطة", "الحج")
  kk = @("Ашу", "Хатым", "Оқу картасы", "Қажылық")
}

Write-Host "Launch app..."
& $adb shell am force-stop $pkg
Start-Sleep 1
& $adb shell monkey -p $pkg -c android.intent.category.LAUNCHER 1 | Out-Null
Start-Sleep 8
$homeXml = Dump-Ui "00_home"
Write-Host "Home dump chars:" $homeXml.Length

# Try deep links / tabs
$routes = @(
  @{ name = "saved"; action = { & $adb shell am start -a android.intent.action.VIEW -d "imamai://tabs/saved" $pkg 2>$null } },
  @{ name = "more"; action = { & $adb shell am start -a android.intent.action.VIEW -d "imamai://more" $pkg 2>$null } }
)

$report = @()
foreach ($r in $routes) {
  & $r.action
  Start-Sleep 4
  $xml = Dump-Ui ("route_" + $r.name)
  $report += "ROUTE $($r.name) len=$($xml.Length)"
}

# Write locale via React Native AsyncStorage file (debug builds often allow run-as)
# AsyncStorage path: /data/data/kz.raqat.app/files/RCTAsyncLocalStorage_V1 or databases
$locales = @("ru","en","ky","uz","tr","ar","kk")
foreach ($loc in $locales) {
  Write-Host "=== locale $loc ==="
  # Prefer writing AsyncStorage key raqat_app_locale_v1
  $js = @"
const AsyncStorage = require('@react-native-async-storage/async-storage');
"@
  # Use shared prefs / files approach:
  & $adb shell "run-as $pkg sh -c 'mkdir -p files/RCTAsyncLocalStorage_V1; echo \"{\\\"raqat_app_locale_v1\\\":\\\"$loc\\\"}\" > files/RCTAsyncLocalStorage_V1/raqat_app_locale_v1'" 2>$null
  # Also try catalog DB format used by newer AsyncStorage
  & $adb shell "run-as $pkg ls files" 2>$null | Out-File "$outDir\files_$loc.txt"
  & $adb shell am force-stop $pkg
  Start-Sleep 1
  & $adb shell monkey -p $pkg -c android.intent.category.LAUNCHER 1 | Out-Null
  Start-Sleep 7
  $xml = Dump-Ui ("loc_${loc}_home")
  $leaks = Has-KkLeak $xml $loc
  $hits = @()
  if ($expect.ContainsKey($loc)) {
    foreach ($e in $expect[$loc]) {
      if ($xml -and $xml.Contains($e)) { $hits += $e }
    }
  }
  $line = "$loc leaks=$($leaks.Count) [$($leaks -join '; ')] hits=$($hits.Count) [$($hits -join ', ')]"
  Write-Host $line
  $report += $line
}

$report | Set-Content "$outDir\report.txt" -Encoding UTF8
Write-Host "Done -> $outDir\report.txt"
