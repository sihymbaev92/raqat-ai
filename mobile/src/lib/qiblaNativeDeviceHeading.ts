import { NativeEventEmitter, NativeModules, Platform } from "react-native";

type PrayerWidgetHeadingModule = {
  startDeviceHeadingUpdates?: () => Promise<boolean>;
  stopDeviceHeadingUpdates?: () => void;
  addListener?: (eventName: string) => void;
  removeListeners?: (count: number) => void;
};

const PrayerWidget = NativeModules.PrayerWidget as PrayerWidgetHeadingModule | undefined;

export const QIBLA_NATIVE_HEADING_EVENT = "QiblaDeviceHeading";

/** Android SensorManager accuracy → compass quality. */
export type NativeHeadingSample = {
  magneticHeadingDeg: number;
  /** SensorManager.SENSOR_STATUS_* (0–3), null if legacy payload. */
  sensorAccuracy: number | null;
};

export function canUseNativeDeviceHeading(): boolean {
  return Platform.OS === "android" && typeof PrayerWidget?.startDeviceHeadingUpdates === "function";
}

function parseHeadingEvent(value: unknown): NativeHeadingSample | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return { magneticHeadingDeg: value, sensorAccuracy: null };
  }
  if (value && typeof value === "object") {
    const rec = value as { heading?: unknown; accuracy?: unknown };
    const heading = typeof rec.heading === "number" ? rec.heading : NaN;
    if (!Number.isFinite(heading)) return null;
    const accuracy = typeof rec.accuracy === "number" && Number.isFinite(rec.accuracy) ? rec.accuracy : null;
    return { magneticHeadingDeg: heading, sensorAccuracy: accuracy };
  }
  return null;
}

export function compassQualityFromAndroidSensorAccuracy(
  accuracy: number | null
): "unknown" | "high" | "medium" | "low" {
  if (accuracy == null) return "unknown";
  if (accuracy >= 3) return "high";
  if (accuracy === 2) return "medium";
  if (accuracy === 1) return "low";
  return "low";
}

export async function startNativeDeviceHeading(
  onHeading: (sample: NativeHeadingSample) => void
): Promise<() => void> {
  if (!canUseNativeDeviceHeading()) {
    return () => undefined;
  }
  const emitter = new NativeEventEmitter(
    PrayerWidget as unknown as import("react-native").NativeModule
  );
  const sub = emitter.addListener(QIBLA_NATIVE_HEADING_EVENT, (value: unknown) => {
    const sample = parseHeadingEvent(value);
    if (sample) onHeading(sample);
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
