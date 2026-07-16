import { NativeModules, Platform } from "react-native";

type PrayerWidgetPinModule = {
  isPrayerWidgetPinSupported?: () => Promise<boolean>;
  getPinnedPrayerWidgetCount?: () => Promise<number>;
  requestPinPrayerHomeStripWidget?: () => Promise<boolean>;
};

function prayerWidgetModule(): PrayerWidgetPinModule | undefined {
  return NativeModules.PrayerWidget as PrayerWidgetPinModule | undefined;
}

export type PrayerWidgetPinStatus = {
  platform: "android" | "ios" | "other";
  pinSupported: boolean;
  pinnedCount: number;
};

export async function getPrayerWidgetPinStatus(): Promise<PrayerWidgetPinStatus> {
  if (Platform.OS === "android") {
    const pinSupported = (await prayerWidgetModule()?.isPrayerWidgetPinSupported?.()) === true;
    const raw = await prayerWidgetModule()?.getPinnedPrayerWidgetCount?.();
    const pinnedCount = typeof raw === "number" && Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
    return { platform: "android", pinSupported, pinnedCount };
  }
  if (Platform.OS === "ios") {
    return { platform: "ios", pinSupported: false, pinnedCount: 0 };
  }
  return { platform: "other", pinSupported: false, pinnedCount: 0 };
}

/** Android 8+: launcher pin диалогы; қолдау жоқ болса false. */
export async function requestPinPrayerWidget(): Promise<boolean> {
  if (Platform.OS !== "android") return false;
  return (await prayerWidgetModule()?.requestPinPrayerHomeStripWidget?.()) === true;
}
