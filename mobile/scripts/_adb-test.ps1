$adb = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"
$adbArgs = @("-s", "R58R54KA0FE")
function Invoke-Adb { param([string[]]$Cmd)
  & "$adb" @adbArgs @Cmd 2>&1
}
Invoke-Adb @("devices")
