import { Linking, NativeModules, Platform } from "react-native";
import type { PrayerNotifSoundId } from "../storage/prefs";
import type { PrayerScheduleSlot } from "./prayerNotificationSchedule";
import { rootNavigationRef } from "../navigation/rootNavigationRef";
import type { RootStackParamList } from "../navigation/types";

type PrayerWidgetNativeModule = {
  scheduleFullScreenAzanAlarms?: (json: string) => Promise<{
    scheduledCount?: number;
    identifiers?: string[];
    lastError?: string | null;
    exactAlarmPermissionGranted?: boolean;
  } | void>;
  scheduleTestAzanAlarm?: (delaySeconds: number) => Promise<{
    scheduledCount?: number;
    exactAlarmPermissionGranted?: boolean;
    delaySeconds?: number;
  }>;
  cancelFullScreenAzanAlarms?: () => void;
  getFullScreenAzanAlarmDiagnostics?: () => Promise<{
    scheduledCount?: number;
    lastError?: string | null;
    exactAlarmPermissionGranted?: boolean;
  }>;
  stopNativeAzanAudio?: () => void;
  playNativeAzanAudio?: (soundId: string) => void;
  playNativeAzanDuaAudio?: () => void;
  getNativeAzanPlaybackStatus?: () => Promise<{
    positionMs?: number;
    durationMs?: number;
    isPlaying?: boolean;
    completed?: boolean;
    isDua?: boolean;
    fullyFinished?: boolean;
  }>;
  clearLegacyAzanNotifications?: () => void;
  finishAzanDelivery?: () => void;
};

export type AzanPlaybackStatus = {
  positionMs: number;
  durationMs: number;
  isPlaying: boolean;
  completed?: boolean;
  isDua?: boolean;
  fullyFinished?: boolean;
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

const PrayerWidget = (NativeModules as { PrayerWidget?: PrayerWidgetNativeModule } | undefined)
  ?.PrayerWidget;

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
  if (Platform.OS !== "android" && Platform.OS !== "ios") return Promise.resolve(rejected);
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
      }
    | void
): FullScreenAzanScheduleResult {
  const rejected: FullScreenAzanScheduleResult = { accepted: false, identifiers: new Set() };
  if (Platform.OS === "android" && Number(Platform.Version) >= 31) {
    if (result?.exactAlarmPermissionGranted === false) {
      return rejected;
    }
  }
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
  error?: string;
};

/** Locked-screen QA: native AlarmManager арқылы N секундтан кейін азan. */
export async function scheduleTestAzanAlarmForQa(delaySeconds = 90): Promise<AzanQaScheduleResult> {
  const delay = Math.min(600, Math.max(15, Math.trunc(delaySeconds)));
  if (Platform.OS !== "android" && Platform.OS !== "ios") {
    return {
      ok: false,
      delaySeconds: delay,
      exactAlarmPermissionGranted: null,
      error: "native_only",
    };
  }
  const schedule = PrayerWidget?.scheduleTestAzanAlarm;
  if (typeof schedule !== "function") {
    return {
      ok: false,
      delaySeconds: delay,
      exactAlarmPermissionGranted: null,
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
      error: scheduledCount > 0 ? undefined : "schedule_empty",
    };
  } catch (e) {
    return {
      ok: false,
      delaySeconds: delay,
      exactAlarmPermissionGranted: null,
      error: e instanceof Error ? e.message : "schedule_failed",
    };
  }
}

export function cancelFullScreenAzanAlarms(): void {
  if (Platform.OS !== "android" && Platform.OS !== "ios") return;
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
}> {
  if (Platform.OS !== "android" && Platform.OS !== "ios") {
    return {
      scheduledCount: 0,
      lastError: null,
      exactAlarmPermissionGranted: null,
    };
  }
  try {
    const diag = await PrayerWidget?.getFullScreenAzanAlarmDiagnostics?.();
    return {
      scheduledCount: Math.max(0, Math.trunc(Number(diag?.scheduledCount ?? 0))),
      lastError: typeof diag?.lastError === "string" && diag.lastError ? diag.lastError : null,
      exactAlarmPermissionGranted:
        typeof diag?.exactAlarmPermissionGranted === "boolean" ? diag.exactAlarmPermissionGranted : null,
    };
  } catch (e) {
    return {
      scheduledCount: 0,
      lastError: e instanceof Error ? e.message : "Native diagnostics unavailable",
      exactAlarmPermissionGranted: null,
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
  nativeAudio?: boolean;
}): Promise<void> {
  const routeParams: NonNullable<RootStackParamList["PrayerAzan"]> = {
    label: params.label,
    enteredTitle: params.enteredTitle ?? prayerEnteredTitleForSlot(params.label, params.salatKey),
    time: params.time ?? "",
    soundId: params.soundId,
    salatKey: params.salatKey ?? "",
    ...(params.nativeAudio ? { nativeAudio: "1" } : {}),
  };

  if (rootNavigationRef.isReady()) {
    rootNavigationRef.navigate("PrayerAzan", routeParams);
    return;
  }

  try {
    await Linking.openURL(
      prayerAzanDeepLink({
        ...params,
        enteredTitle: routeParams.enteredTitle,
      })
    );
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

/** Азанды тоқтату: дыбыс және жабу — толық жабу. */
export function finishAzanDelivery(): void {
  if (Platform.OS === "android") {
    try {
      PrayerWidget?.finishAzanDelivery?.();
    } catch {
      /* no-op */
    }
  }
  stopNativePrayerAzanAudio();
  clearLegacyNativeAzanNotifications();
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

export function playNativePrayerAzanDuaAudio(): boolean {
  if (Platform.OS !== "android") return false;
  const play = PrayerWidget?.playNativeAzanDuaAudio;
  if (typeof play !== "function") return false;
  try {
    play();
    return true;
  } catch {
    return false;
  }
}

export async function getNativeAzanPlaybackStatus(): Promise<AzanPlaybackStatus | null> {
  if (Platform.OS !== "android") return null;
  const read = PrayerWidget?.getNativeAzanPlaybackStatus;
  if (typeof read !== "function") return null;
  try {
    const status = await read();
    return {
      positionMs: Math.max(0, Math.trunc(Number(status?.positionMs ?? 0))),
      durationMs: Math.max(0, Math.trunc(Number(status?.durationMs ?? 0))),
      isPlaying: status?.isPlaying === true,
      completed: status?.completed === true,
      isDua: status?.isDua === true,
      fullyFinished: status?.fullyFinished === true,
    };
  } catch {
    return null;
  }
}
