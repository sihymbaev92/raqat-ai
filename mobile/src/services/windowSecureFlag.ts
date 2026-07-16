import { NativeModules, Platform } from "react-native";

type SecureFlagModule = {
  setWindowSecure?: (enabled: boolean) => Promise<boolean> | void;
};

/**
 * Android FLAG_SECURE — логин экрандарында скриншот/жазуды болдырмау.
 * iOS / web: no-op.
 */
export async function setWindowSecureFlag(enabled: boolean): Promise<void> {
  if (Platform.OS !== "android") return;
  const mod = NativeModules.PrayerWidget as SecureFlagModule | undefined;
  try {
    await mod?.setWindowSecure?.(enabled);
  } catch {
    /* OEM / activity жоқ */
  }
}
