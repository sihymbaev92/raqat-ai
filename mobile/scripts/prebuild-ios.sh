#!/usr/bin/env bash
# Regenerate mobile/ios from app.config.js (macOS/Linux). Windows: use prebuild-ios.ps1 (Docker).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export RAQAT_INCLUDE_NATIVE_EXPO_CONFIG=1

if [[ "$(uname -s)" == "Darwin" ]]; then
  npx expo prebuild --platform ios --no-install
  echo "Next (Mac): cd ios && pod install && open RAHATOMIR.xcworkspace"
elif [[ "$(uname -s)" == "Linux" ]]; then
  npx expo prebuild --platform ios --no-install
  echo "iOS folder updated. Run pod install on macOS before Xcode build."
else
  echo "Unsupported OS. On Windows run: npm run prebuild:ios" >&2
  exit 1
fi
