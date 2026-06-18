import { NativeEventEmitter, NativeModules, Platform } from "react-native";

type PrayerWidgetHeadingModule = {
  startDeviceHeadingUpdates?: () => Promise<boolean>;
  stopDeviceHeadingUpdates?: () => void;
  addListener?: (eventName: string) => void;
  removeListeners?: (count: number) => void;
};

const PrayerWidget = NativeModules.PrayerWidget as PrayerWidgetHeadingModule | undefined;

export const QIBLA_NATIVE_HEADING_EVENT = "QiblaDeviceHeading";

export function canUseNativeDeviceHeading(): boolean {
  return Platform.OS === "android" && typeof PrayerWidget?.startDeviceHeadingUpdates === "function";
}

export async function startNativeDeviceHeading(
  onHeading: (magneticHeadingDeg: number) => void
): Promise<() => void> {
  if (!canUseNativeDeviceHeading()) {
    return () => undefined;
  }
  const emitter = new NativeEventEmitter(PrayerWidget as NonNullable<typeof PrayerWidget>);
  const sub = emitter.addListener(QIBLA_NATIVE_HEADING_EVENT, (value: number) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      onHeading(value);
    }
  });
  try {
    await PrayerWidget?.startDeviceHeadingUpdates?.();
  } catch {
    sub.remove();
    return () => undefined;
  }
  return () => {
    sub.remove();
    try {
      PrayerWidget?.stopDeviceHeadingUpdates?.();
    } catch {
      /* no-op */
    }
  };
}

export function stopNativeDeviceHeading(): void {
  if (!canUseNativeDeviceHeading()) return;
  try {
    PrayerWidget?.stopDeviceHeadingUpdates?.();
  } catch {
    /* no-op */
  }
}
