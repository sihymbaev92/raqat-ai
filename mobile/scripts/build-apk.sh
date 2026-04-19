#!/usr/bin/env bash
# Жергілікті APK: JDK 17+ және Android SDK (ANDROID_HOME) қажет.
# Gradle JS бандлында EXPO_PUBLIC_* үшін түбір .env / mobile/.env жүктеледі (load-raqat-expo-env.sh).
# release: алдымен NODE_ENV=production + mobile/.env.production (болса) — түбірдегі 127.0.0.1 APK-ға кірмейді.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export MOBILE_ROOT="$ROOT"

TARGET="${1:-release}"
if [[ "$TARGET" == "debug" ]]; then
  export NODE_ENV="${NODE_ENV:-development}"
  export RAQAT_EXPO_RELEASE_BUILD=0
else
  export NODE_ENV="${NODE_ENV:-production}"
  export RAQAT_EXPO_RELEASE_BUILD=1
fi

# shellcheck disable=SC1091
source "$ROOT/scripts/load-raqat-expo-env.sh"
if [[ -n "${EXPO_PUBLIC_RAQAT_API_BASE:-}" ]]; then
  echo "EXPO_PUBLIC_RAQAT_API_BASE=${EXPO_PUBLIC_RAQAT_API_BASE}"
fi
if [[ -n "${EXPO_PUBLIC_RAQAT_AI_SECRET:-}" ]]; then
  echo "EXPO_PUBLIC_RAQAT_AI_SECRET=***орнатылған***"
else
  echo "Ескерту: EXPO_PUBLIC_RAQAT_AI_SECRET бос — OAuth JWT немесе түбір .env ішінде RAQAT_AI_PROXY_SECRET қосыңыз."
fi
cd "$ROOT/android"

if [[ -z "${JAVA_HOME:-}" ]]; then
  for candidate in \
    /usr/lib/jvm/java-17-openjdk-amd64 \
    /usr/lib/jvm/java-21-openjdk-amd64 \
    /usr/lib/jvm/default-java; do
    if [[ -d "$candidate" ]]; then
      export JAVA_HOME="$candidate"
      break
    fi
  done
fi

if ! command -v java >/dev/null 2>&1 && [[ -z "${JAVA_HOME:-}" ]]; then
  echo "JDK табылмады. Ubuntu/Debian: sudo apt install -y openjdk-17-jdk" >&2
  echo "Содан: export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64" >&2
  exit 1
fi

if [[ -n "${JAVA_HOME:-}" && -x "$JAVA_HOME/bin/java" ]]; then
  export PATH="$JAVA_HOME/bin:$PATH"
fi

export ANDROID_HOME="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
if [[ -z "${ANDROID_HOME}" && -d "${HOME}/Android/Sdk" ]]; then
  export ANDROID_HOME="${HOME}/Android/Sdk"
fi
if [[ -z "${ANDROID_HOME}" || ! -d "${ANDROID_HOME}/platforms" ]]; then
  echo "Android SDK табылмады. ANDROID_HOME орнатыңыз (мысалы Android Studio кейін):" >&2
  echo "  export ANDROID_HOME=\$HOME/Android/Sdk" >&2
  echo "немесе mobile/android/local.properties: sdk.dir=/толық/жол/Android/Sdk" >&2
  exit 1
fi

# Gradle кэшін /tmp-ке (cursor sandbox cache) жібермеу — диск толып build құлауы мүмкін.
export GRADLE_USER_HOME="${GRADLE_USER_HOME:-$HOME/.gradle}"
export ANDROID_GRADLE_USER_HOME="${ANDROID_GRADLE_USER_HOME:-$GRADLE_USER_HOME}"
export TMPDIR="${TMPDIR:-$HOME/.tmp}"
mkdir -p "$TMPDIR" "$GRADLE_USER_HOME"

if [[ "$TARGET" == "debug" ]]; then
  echo "=== assembleDebug (JAVA_HOME=${JAVA_HOME:-auto}) ==="
  ./gradlew --stop >/dev/null 2>&1 || true
  ./gradlew --no-daemon assembleDebug
  echo "APK: $ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
else
  echo "=== assembleRelease (JAVA_HOME=${JAVA_HOME:-auto}) ==="
  ./gradlew --stop >/dev/null 2>&1 || true
  ./gradlew --no-daemon assembleRelease
  echo "APK: $ROOT/android/app/build/outputs/apk/release/app-release.apk"
fi
