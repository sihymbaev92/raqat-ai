import { NativeModules, Platform } from "react-native";

type SecureFlagModule = {
  setWindowSecure?: (enabled: boolean) => Promise<boolean> | void;
};

/**
 * Скриншот / экран жазу / App Switcher превью — логин және сезімтал экрандарда.
 * Android: FLAG_SECURE. iOS: secure overlay (native).
 */
export async function setWindowSecureFlag(enabled: boolean): Promise<void> {
  if (Platform.OS !== "android" && Platform.OS !== "ios") return;
  const mod = NativeModules.PrayerWidget as SecureFlagModule | undefined;
  try {
    await mod?.setWindowSecure?.(enabled);
  } catch {
    /* OEM / activity жоқ */
  }
}
