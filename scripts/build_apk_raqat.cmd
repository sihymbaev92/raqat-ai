@echo off
REM RAQAT Android APK: CMD іске қосу (PowerShell'dегі npm execution policy-ден аулақ)
REM New arch + барлық ABI: mobile\android\gradle.properties.full -> gradle.properties (алдын ада long paths/қысқа жол, mobile\android\gradle.properties тақырыбына қараңыз)
setlocal
if exist "D:\nodejs\node-v22.15.1-win-x64\npm.cmd" (
  set "NPM_CMD=D:\nodejs\node-v22.15.1-win-x64\npm.cmd"
) else (
  where npm.cmd >nul 2>&1 && (for /f "delims=" %%i in ('where npm.cmd') do set "NPM_CMD=%%i" & goto :haveNpm
  )
  echo npm.cmd табылмады. Node.js орнатып, PATH-қа қосыңыз немесе бұл .cmd жоғарыдагы npm жолын түзетіңіз.
  exit /b 1
)
:haveNpm
if exist "C:\openjdk-17\extracted\jdk-17.0.13+11\bin\java.exe" (
  set "JAVA_HOME=C:\openjdk-17\extracted\jdk-17.0.13+11"
) else (
  set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
)
set "ANDROID_HOME=C:\Android\Sdk"
set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
if exist "D:\gradle-raqat" set "GRADLE_USER_HOME=D:\gradle-raqat"
set "Path=%JAVA_HOME%\bin;%Path%"
cd /d "%~dp0..\mobile"
call "%NPM_CMD%" run build:apk
endlocal
exit /b %ERRORLEVEL%
