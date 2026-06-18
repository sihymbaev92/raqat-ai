import { Linking, NativeModules, Platform } from "react-native";
import type { PrayerNotifSoundId } from "../storage/prefs";
import type { PrayerScheduleSlot } from "./prayerNotificationSchedule";

type PrayerWidgetNativeModule = {
  scheduleFullScreenAzanAlarms?: (json: string) => Promise<{
    scheduledCount?: number;
    identifiers?: string[];
    lastError?: string | null;
    exactAlarmPermissionGranted?: boolean;
    fullScreenIntentPermissionGranted?: boolean;
  } | void>;
  scheduleTestAzanAlarm?: (delaySeconds: number) => Promise<{
    scheduledCount?: number;
    exactAlarmPermissionGranted?: boolean;
    fullScreenIntentPermissionGranted?: boolean;
    delaySeconds?: number;
  }>;
  cancelFullScreenAzanAlarms?: () => void;
  getFullScreenAzanAlarmDiagnostics?: () => Promise<{
    scheduledCount?: number;
    lastError?: string | null;
    exactAlarmPermissionGranted?: boolean;
    fullScreenIntentPermissionGranted?: boolean;
  }>;
  stopNativeAzanAudio?: () => void;
  playNativeAzanAudio?: (soundId: string) => void;
  clearLegacyAzanNotifications?: () => void;
};

type FullScreenAzanSlot = {
  identifier: string;
  atMillis: number;
  label: string;
  enteredTitle: string;
  timeShort: string;
  salatKey: string;
  soundId: PrayerNotifSoundId;
};

const PrayerWidget = NativeModules.PrayerWidget as PrayerWidgetNativeModule | undefined;

export type FullScreenAzanScheduleResult = {
  accepted: boolean;
  identifiers: Set<string>;
};

export function prayerEnteredTitleForSlot(label: string, salatKey?: string): string {
  switch (salatKey) {
    case "fajr":
      return "Таң намазы кірді";
    case "dhuhr":
      return "Бесін намазы кірді";
    case "asr":
      return "Екінті намазы кірді";
    case "maghrib":
      return "Ақшам намазы кірді";
    case "isha":
      return "Құптан намазы кірді";
    default: {
      const clean = label.trim();
      return clean ? `${clean} намазы кірді` : "Намаз уақыты кірді";
    }
  }
}

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
      enteredTitle: prayerEnteredTitleForSlot(slot.label, slot.salatKey),
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
): Promise<FullScreenAzanScheduleResult> {
  const rejected: FullScreenAzanScheduleResult = { accepted: false, identifiers: new Set() };
  if (Platform.OS !== "android") return Promise.resolve(rejected);
  const payload = buildFullScreenAzanSlots(slots, soundIdForSlot);
  if (payload.length === 0) return Promise.resolve(rejected);
  const schedule = PrayerWidget?.scheduleFullScreenAzanAlarms;
  if (typeof schedule !== "function") return Promise.resolve(rejected);
  return Promise.resolve()
    .then(() => schedule(JSON.stringify(payload)))
    .then((result) => scheduleFullScreenAzanAlarmsForResult(payload, result))
    .catch(() => rejected);
}

export function scheduleFullScreenAzanAlarmsForResult(
  payload: FullScreenAzanSlot[],
  result:
    | {
        scheduledCount?: number;
        identifiers?: string[];
        exactAlarmPermissionGranted?: boolean;
        fullScreenIntentPermissionGranted?: boolean;
      }
    | void
): FullScreenAzanScheduleResult {
  const rejected: FullScreenAzanScheduleResult = { accepted: false, identifiers: new Set() };
  const nativeIds = Array.isArray(result?.identifiers)
    ? result.identifiers.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];
  if (nativeIds.length > 0) {
    return {
      accepted: true,
      identifiers: new Set(nativeIds),
    };
  }
  const scheduledCount = Math.max(0, Math.trunc(Number(result?.scheduledCount ?? 0)));
  if (scheduledCount > 0) {
    return {
      accepted: true,
      identifiers: new Set(payload.map((slot) => slot.identifier)),
    };
  }
  return rejected;
}

export type AzanQaScheduleResult = {
  ok: boolean;
  delaySeconds: number;
  exactAlarmPermissionGranted: boolean | null;
  fullScreenIntentPermissionGranted: boolean | null;
  error?: string;
};

/** Locked-screen QA: native AlarmManager арқылы N секундтан кейін азan. */
export async function scheduleTestAzanAlarmForQa(delaySeconds = 90): Promise<AzanQaScheduleResult> {
  const delay = Math.min(600, Math.max(15, Math.trunc(delaySeconds)));
  if (Platform.OS !== "android") {
    return {
      ok: false,
      delaySeconds: delay,
      exactAlarmPermissionGranted: null,
      fullScreenIntentPermissionGranted: null,
      error: "android_only",
    };
  }
  const schedule = PrayerWidget?.scheduleTestAzanAlarm;
  if (typeof schedule !== "function") {
    return {
      ok: false,
      delaySeconds: delay,
      exactAlarmPermissionGranted: null,
      fullScreenIntentPermissionGranted: null,
      error: "native_module_missing",
    };
  }
  try {
    const result = await schedule(delay);
    const scheduledCount = Math.max(0, Math.trunc(Number(result?.scheduledCount ?? 0)));
    return {
      ok: scheduledCount > 0,
      delaySeconds: Math.trunc(Number(result?.delaySeconds ?? delay)),
      exactAlarmPermissionGranted:
        typeof result?.exactAlarmPermissionGranted === "boolean"
          ? result.exactAlarmPermissionGranted
          : null,
      fullScreenIntentPermissionGranted:
        typeof result?.fullScreenIntentPermissionGranted === "boolean"
          ? result.fullScreenIntentPermissionGranted
          : null,
      error: scheduledCount > 0 ? undefined : "schedule_empty",
    };
  } catch (e) {
    return {
      ok: false,
      delaySeconds: delay,
      exactAlarmPermissionGranted: null,
      fullScreenIntentPermissionGranted: null,
      error: e instanceof Error ? e.message : "schedule_failed",
    };
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

export function clearLegacyNativeAzanNotifications(): void {
  if (Platform.OS !== "android") return;
  try {
    PrayerWidget?.clearLegacyAzanNotifications?.();
  } catch {
    /* no-op */
  }
}

export async function getFullScreenAzanAlarmDiagnostics(): Promise<{
  scheduledCount: number;
  lastError: string | null;
  exactAlarmPermissionGranted: boolean | null;
  fullScreenIntentPermissionGranted: boolean | null;
}> {
  if (Platform.OS !== "android") {
    return {
      scheduledCount: 0,
      lastError: null,
      exactAlarmPermissionGranted: null,
      fullScreenIntentPermissionGranted: null,
    };
  }
  try {
    const diag = await PrayerWidget?.getFullScreenAzanAlarmDiagnostics?.();
    return {
      scheduledCount: Math.max(0, Math.trunc(Number(diag?.scheduledCount ?? 0))),
      lastError: typeof diag?.lastError === "string" && diag.lastError ? diag.lastError : null,
      exactAlarmPermissionGranted:
        typeof diag?.exactAlarmPermissionGranted === "boolean" ? diag.exactAlarmPermissionGranted : null,
      fullScreenIntentPermissionGranted:
        typeof diag?.fullScreenIntentPermissionGranted === "boolean"
          ? diag.fullScreenIntentPermissionGranted
          : null,
    };
  } catch (e) {
    return {
      scheduledCount: 0,
      lastError: e instanceof Error ? e.message : "Native diagnostics unavailable",
      exactAlarmPermissionGranted: null,
      fullScreenIntentPermissionGranted: null,
    };
  }
}

export function prayerAzanDeepLink(params: {
  label: string;
  enteredTitle?: string;
  time?: string;
  soundId: PrayerNotifSoundId;
  salatKey?: string;
}): string {
  const q = new URLSearchParams({
    label: params.label,
    enteredTitle: params.enteredTitle ?? prayerEnteredTitleForSlot(params.label, params.salatKey),
    time: params.time ?? "",
    soundId: params.soundId,
    salatKey: params.salatKey ?? "",
  });
  return `imamai://azan?${q.toString()}`;
}

export async function openPrayerAzanScreen(params: {
  label: string;
  enteredTitle?: string;
  time?: string;
  soundId: PrayerNotifSoundId;
  salatKey?: string;
}): Promise<void> {
  try {
    await Linking.openURL(prayerAzanDeepLink(params));
  } catch {
    /* Native alarm receiver also opens this deep link when the app is backgrounded. */
  }
}

export function stopNativePrayerAzanAudio(): void {
  if (Platform.OS !== "android") return;
  try {
    PrayerWidget?.stopNativeAzanAudio?.();
  } catch {
    /* no-op */
  }
}

export function playNativePrayerAzanAudio(soundId: PrayerNotifSoundId): boolean {
  if (Platform.OS !== "android" || soundId === "off") return false;
  const play = PrayerWidget?.playNativeAzanAudio;
  if (typeof play !== "function") return false;
  try {
    play(soundId);
    return true;
  } catch {
    return false;
  }
}
