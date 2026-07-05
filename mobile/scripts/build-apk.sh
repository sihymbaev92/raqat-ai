#!/usr/bin/env bash
# Жергілікті APK/AAB: JDK 17+ және Android SDK (ANDROID_HOME) қажет.
# ./scripts/build-apk.sh release | debug | aab
# Gradle JS бандлында EXPO_PUBLIC_* үшін түбір .env / mobile/.env жүктеледі (load-raqat-expo-env.sh).
# release: алдымен NODE_ENV=production + mobile/.env.production (болса) — түбірдегі 127.0.0.1 APK-ға кірмейді.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export MOBILE_ROOT="$ROOT"

TARGET="${1:-release}"
if [[ "$TARGET" == "debug" ]]; then
  export NODE_ENV="${NODE_ENV:-development}"
  export RAQAT_EXPO_RELEASE_BUILD=0
elif [[ "$TARGET" == "aab" || "$TARGET" == "release" ]]; then
  export NODE_ENV="${NODE_ENV:-production}"
  export RAQAT_EXPO_RELEASE_BUILD=1
else
  echo "Unknown target: $TARGET (use release, debug, or aab)" >&2
  exit 1
fi

# shellcheck disable=SC1091
source "$ROOT/scripts/load-raqat-expo-env.sh"
if [[ -n "${EXPO_PUBLIC_RAQAT_API_BASE:-}" ]]; then
  echo "EXPO_PUBLIC_RAQAT_API_BASE=${EXPO_PUBLIC_RAQAT_API_BASE}"
fi
echo "Клиент бандлы: AI/content үшін тек JWT (client secret қолданылмайды)."

# HTTP API хосттарын network_security_config.xml ішіне автоматты қосу (debug/local cleartext allowlist).
REPO_ROOT="$(cd "$ROOT/.." && pwd)"
_patch="$REPO_ROOT/scripts/patch_android_network_security.py"
if [[ "${RAQAT_EXPO_RELEASE_BUILD:-0}" == "1" ]]; then
  echo "cleartext patch: release build — skipped (Play AAB ships HTTPS-only)."
elif [[ -f "$_patch" ]]; then
  # Windows Git Bash: PATH-тегі python3 көбінесе WindowsApps түйіндемесі — код 49 қайтарады; алдымен python.
  if command -v python >/dev/null 2>&1; then
    python "$_patch"
  elif command -v python3 >/dev/null 2>&1; then
    python3 "$_patch"
  else
    echo "Ескерту: python табылмады — $_patch өткізілді (HTTP хостты XML-ге қолмен қосыңыз)." >&2
  fi
fi

cd "$ROOT/android"

if [[ -z "${JAVA_HOME:-}" ]]; then
  # Linux / macOS
  for candidate in \
    /usr/lib/jvm/java-17-openjdk-amd64 \
    /usr/lib/jvm/java-21-openjdk-amd64 \
    /usr/lib/jvm/default-java; do
    if [[ -d "$candidate" && -x "$candidate/bin/java" ]]; then
      export JAVA_HOME="$candidate"
      break
    fi
  done
fi

# Windows (Git Bash / MSYS): Android Studio JBR немесе Adoptium
if [[ -z "${JAVA_HOME:-}" || ! -x "${JAVA_HOME}/bin/java" ]]; then
  if [[ -n "${WINDIR:-}" || "$(uname -s 2>/dev/null)" = MINGW* ]]; then
    _win_java() {
      local c
      for c in \
        "/c/Program Files/Android/Android Studio/jbr" \
        "/c/Program Files/Java/jdk-17" \
        "/c/Program Files/Java/jdk-21" \
        "/c/Program Files/Microsoft/jdk-17.0.13.8-hotspot" \
        "/c/Program Files/Eclipse Adoptium/jdk-17.0.13.7-hotspot"; do
        if [[ -x "$c/bin/java" ]]; then
          echo "$c"
          return 0
        fi
      done
      if [[ -d "/c/Program Files/Eclipse Adoptium" ]]; then
        for c in /c/Program\ Files/Eclipse\ Adoptium/*; do
          if [[ -x "$c/bin/java" ]]; then
            echo "$c"
            return 0
          fi
        done
      fi
      if [[ -d "$HOME/AppData/Local/Programs/Eclipse Adoptium" ]]; then
        for c in "$HOME"/AppData/Local/Programs/Eclipse\ Adoptium/*; do
          if [[ -x "$c/bin/java" ]]; then
            echo "$c"
            return 0
          fi
        done
      fi
    }
    _j="$(_win_java)"
    if [[ -n "$_j" ]]; then
      export JAVA_HOME="$_j"
    fi
  fi
fi

if ! command -v java >/dev/null 2>&1 && [[ -z "${JAVA_HOME:-}" ]]; then
  echo "JDK табылмады. Ubuntu/Debian: sudo apt install -y openjdk-17-jdk" >&2
  echo "Содан: export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64" >&2
  echo "Windows: Android Studio (және ішіндегі JBR) немесе Temurin 17+ орнатыңыз; " >&2
  echo "  setx JAVA_HOME \"C:\\Program Files\\Android\\Android Studio\\jbr\"" >&2
  exit 1
fi

if [[ -n "${JAVA_HOME:-}" && -x "$JAVA_HOME/bin/java" ]]; then
  export PATH="$JAVA_HOME/bin:$PATH"
fi

export ANDROID_HOME="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
if [[ -z "${ANDROID_HOME}" && -d "${HOME}/Android/Sdk" ]]; then
  export ANDROID_HOME="${HOME}/Android/Sdk"
fi
# Windows: стандартты SDK жолы
if [[ -z "${ANDROID_HOME}" || ! -d "${ANDROID_HOME}/platforms" ]]; then
  if [[ -d "$HOME/AppData/Local/Android/Sdk/platforms" ]]; then
    export ANDROID_HOME="$HOME/AppData/Local/Android/Sdk"
  fi
fi
# local.properties: sdk.dir
if [[ -z "${ANDROID_HOME}" || ! -d "${ANDROID_HOME}/platforms" ]]; then
  _lp="${ROOT}/android/local.properties"
  if [[ -f "$_lp" ]] && command -v sed >/dev/null 2>&1; then
    _sdk="$(sed -n 's/^[[:space:]]*sdk[.]dir=//p' "$_lp" | tr -d '\r' | head -1)"
    if [[ -n "$_sdk" && -d "$_sdk/platforms" ]]; then
      # Windows-та sdk.dir=\\ пішімін Git bash үшін / құраймыз
      _sdk="${_sdk//\\\\//}"
      export ANDROID_HOME="$_sdk"
    fi
  fi
fi
if [[ -z "${ANDROID_HOME}" || ! -d "${ANDROID_HOME}/platforms" ]]; then
  echo "Android SDK табылмады. ANDROID_HOME орнатыңыз (мысалы Android Studio кейін):" >&2
  echo "  export ANDROID_HOME=\$HOME/Android/Sdk" >&2
  echo "  Windows: %LOCALAPPDATA%\\Android\\Sdk" >&2
  echo "немесе mobile/android/local.properties: sdk.dir=/толық/жол/Android/Sdk" >&2
  exit 1
fi

artifact_info() {
  local artifact="$1"
  if [[ ! -f "$artifact" ]]; then
    return 0
  fi
  if command -v python >/dev/null 2>&1; then
    python -c "import hashlib, pathlib, sys; p=pathlib.Path(sys.argv[1]); data=p.read_bytes(); print(f'Artifact: {p}'); print(f'Size: {len(data)/1024/1024:.2f} MB'); print(f'SHA256: {hashlib.sha256(data).hexdigest()}')" "$artifact"
  else
    echo "Artifact: $artifact"
  fi
}

if [[ "$TARGET" == "aab" || "$TARGET" == "release" ]]; then
  if [[ ! -f "$ROOT/assets/sounds/prayer_azan_user_01.mp3" ]]; then
    echo "Азан MP3 файлы жоқ: prayer_azan_user_01.mp3" >&2
    echo "  mobile/assets/sounds/prayer_azan_user_01.mp3 орнына қойыңыз." >&2
    exit 1
  fi
  if [[ ! -f "$ROOT/android/keystore.properties" ]]; then
    echo "Play release signing жоқ: mobile/android/keystore.properties табылмады." >&2
    echo "  mobile/android/keystore.properties.example файлын көшіріп, upload key JKS мәндерін толтырыңыз." >&2
    exit 1
  fi
  _store_file="$(sed -n 's/^[[:space:]]*storeFile=//p' "$ROOT/android/keystore.properties" | tr -d '\r' | head -1)"
  if [[ -z "$_store_file" || ! -f "$ROOT/android/$_store_file" ]]; then
    echo "Play release signing жоқ: storeFile табылмады ($ROOT/android/${_store_file:-<empty>})." >&2
    exit 1
  fi
fi

_apk_slim_restore() {
  node "$ROOT/scripts/strip-apk-remote-assets.cjs" restore 2>/dev/null || true
  bash "$ROOT/scripts/apk-slim-assets.sh" restore 2>/dev/null || true
}

if [[ "$TARGET" == "aab" || "$TARGET" == "release" ]]; then
  trap _apk_slim_restore EXIT
  echo "=== QCF4 bundled page map (offline Hatim) ==="
  node "$ROOT/scripts/generate-qcf4-bundled-page-map.cjs"
  echo "=== APK slim: CDN-only asset-терді stash (Metro/APK-ға кірмейді) ==="
  _apk_slim_restore
  bash "$ROOT/scripts/apk-slim-assets.sh" stash
  node "$ROOT/scripts/strip-apk-remote-assets.cjs" strip
fi

# Gradle кэшін /tmp-ке (cursor sandbox cache) жібермеу — диск толып build құлауы мүмкін.
# Windows Git Bash: %USERPROFILE% ішіндегі .gradle (кирилл/unicode) — prefab
# `java -cp` сынып, ClassNotFoundException: com.google.prefab.cli.AppKt болады.
# Репо жолы (transfer/.../mobile) ұзын болса, кэшті сонда ұстау C++/ninja «260 таңбадан ұзар» деген қате береді.
# Сондықтан MINGW/MSYS-та кэшті қысқа ASCII дискі жолына қоямыз (RAQAT_GRADLE_USER_HOME тексеріледі).
# Ескерту: GRADLE_USER_HOME репо ішінде болса «Could not move temporary workspace … transforms» жиі шығады —
# сондықтан Git Bash-та әрқашан қысқа жол (немесе RAQAT_GRADLE_USER_HOME) қолданылады.
if [[ -n "${WINDIR:-}" ]] && [[ "$(uname -s 2>/dev/null)" = MINGW* || "$(uname -s 2>/dev/null)" = MSYS* ]]; then
  export GRADLE_USER_HOME="${RAQAT_GRADLE_USER_HOME:-D:/raqat-gradle}"
elif [[ -z "${GRADLE_USER_HOME:-}" ]]; then
  export GRADLE_USER_HOME="${HOME}/.gradle"
fi
export ANDROID_GRADLE_USER_HOME="${ANDROID_GRADLE_USER_HOME:-$GRADLE_USER_HOME}"
export TMPDIR="${TMPDIR:-$HOME/.tmp}"
mkdir -p "$TMPDIR" "$GRADLE_USER_HOME"
if [[ -n "${WINDIR:-}" ]] && [[ "$(uname -s 2>/dev/null)" = MINGW* || "$(uname -s 2>/dev/null)" = MSYS* ]]; then
  echo "GRADLE_USER_HOME=${GRADLE_USER_HOME} (Windows: қысқа жол + prefab/ASCII; RAQAT_GRADLE_USER_HOME өзгертуге болады)"
fi

if [[ "$TARGET" == "debug" ]]; then
  echo "=== assembleDebug (JAVA_HOME=${JAVA_HOME:-auto}) ==="
  ./gradlew --stop >/dev/null 2>&1 || true
  ./gradlew --no-daemon -Dorg.gradle.parallel=false -Dorg.gradle.workers.max=2 assembleDebug
  echo "APK: $ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
  artifact_info "$ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
elif [[ "$TARGET" == "aab" ]]; then
  echo "=== bundleRelease (JAVA_HOME=${JAVA_HOME:-auto}) ==="
  ./gradlew --stop >/dev/null 2>&1 || true
  ./gradlew --no-daemon -Dorg.gradle.parallel=false -Dorg.gradle.workers.max=2 bundleRelease
  echo "AAB: $ROOT/android/app/build/outputs/bundle/release/app-release.aab"
  artifact_info "$ROOT/android/app/build/outputs/bundle/release/app-release.aab"
else
  echo "=== assembleRelease (JAVA_HOME=${JAVA_HOME:-auto}) ==="
  ./gradlew --stop >/dev/null 2>&1 || true
  ./gradlew --no-daemon -Dorg.gradle.parallel=false -Dorg.gradle.workers.max=2 assembleRelease
  echo "APK: $ROOT/android/app/build/outputs/apk/release/app-release.apk"
  artifact_info "$ROOT/android/app/build/outputs/apk/release/app-release.apk"
fi
