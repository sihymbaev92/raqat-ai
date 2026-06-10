import { Linking, NativeModules, Platform } from "react-native";
import type { PrayerNotifSoundId } from "../storage/prefs";
import type { PrayerScheduleSlot } from "./prayerNotificationSchedule";

type PrayerWidgetNativeModule = {
  scheduleFullScreenAzanAlarms?: (json: string) => void;
  cancelFullScreenAzanAlarms?: () => void;
  getFullScreenAzanAlarmDiagnostics?: () => Promise<{
    scheduledCount?: number;
    lastError?: string | null;
  }>;
};

type FullScreenAzanSlot = {
  identifier: string;
  atMillis: number;
  label: string;
  timeShort: string;
  salatKey: string;
  soundId: PrayerNotifSoundId;
};

const PrayerWidget = NativeModules.PrayerWidget as PrayerWidgetNativeModule | undefined;

export function buildFullScreenAzanSlots(
  slots: PrayerScheduleSlot[],
  soundIdForSlot: (slot: PrayerScheduleSlot) => PrayerNotifSoundId
): FullScreenAzanSlot[] {
  return slots
    .map((slot) => ({ slot, soundId: soundIdForSlot(slot) }))
    .filter(({ slot, soundId }) => slot.kind === "salat" && soundId !== "off")
    .map(({ slot, soundId }) => ({
      identifier: slot.identifier,
      atMillis: slot.when.getTime(),
      label: slot.label,
      timeShort: slot.timeShort,
      salatKey: slot.salatKey,
      soundId,
    }));
}

export function shouldRoutePrayerSoundToFullScreenAzan(
  slot: PrayerScheduleSlot,
  soundId: PrayerNotifSoundId,
  platform: typeof Platform.OS = Platform.OS
): boolean {
  return platform === "android" && slot.kind === "salat" && soundId !== "off";
}

export function scheduleFullScreenAzanAlarms(
  slots: PrayerScheduleSlot[],
  soundIdForSlot: (slot: PrayerScheduleSlot) => PrayerNotifSoundId
): void {
  if (Platform.OS !== "android") return;
  const payload = buildFullScreenAzanSlots(slots, soundIdForSlot);
  try {
    PrayerWidget?.scheduleFullScreenAzanAlarms?.(JSON.stringify(payload));
  } catch {
    /* Native support is best-effort; Expo notifications remain scheduled. */
  }
}

export function cancelFullScreenAzanAlarms(): void {
  if (Platform.OS !== "android") return;
  try {
    PrayerWidget?.cancelFullScreenAzanAlarms?.();
  } catch {
    /* no-op */
  }
}

export async function getFullScreenAzanAlarmDiagnostics(): Promise<{
  scheduledCount: number;
  lastError: string | null;
}> {
  if (Platform.OS !== "android") return { scheduledCount: 0, lastError: null };
  try {
    const diag = await PrayerWidget?.getFullScreenAzanAlarmDiagnostics?.();
    return {
      scheduledCount: Math.max(0, Math.trunc(Number(diag?.scheduledCount ?? 0))),
      lastError: typeof diag?.lastError === "string" && diag.lastError ? diag.lastError : null,
    };
  } catch (e) {
    return {
      scheduledCount: 0,
      lastError: e instanceof Error ? e.message : "Native diagnostics unavailable",
    };
  }
}

export function prayerAzanDeepLink(params: {
  label: string;
  time?: string;
  soundId: PrayerNotifSoundId;
  salatKey?: string;
}): string {
  const q = new URLSearchParams({
    label: params.label,
    time: params.time ?? "",
    soundId: params.soundId,
    salatKey: params.salatKey ?? "",
  });
  return `imamai://azan?${q.toString()}`;
}

export async function openPrayerAzanScreen(params: {
  label: string;
  time?: string;
  soundId: PrayerNotifSoundId;
  salatKey?: string;
}): Promise<void> {
  try {
    await Linking.openURL(prayerAzanDeepLink(params));
  } catch {
    /* If self deep-link fails, notification sound fallback still runs. */
  }
}
