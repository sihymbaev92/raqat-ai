import { Linking, NativeModules, Platform } from "react-native";
import type { PrayerNotifSoundId } from "../storage/prefs";
import type { PrayerScheduleSlot } from "./prayerNotificationSchedule";
import { parsePrayerAzanQueryParams } from "../navigation/linking";
import { rootNavigationRef } from "../navigation/rootNavigationRef";
import type { RootStackParamList } from "../navigation/types";
import { kk } from "../i18n/kk";

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
    fullScreenIntentAllowed?: boolean;
    overlayAllowed?: boolean;
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
  getPendingAzanLaunch?: () => Promise<{
    label?: string;
    enteredTitle?: string;
    time?: string;
    soundId?: string;
    salatKey?: string;
  } | null>;
  clearPendingAzanLaunch?: () => void;
  isAzanSessionActive?: () => Promise<boolean>;
  clearLegacyAzanNotifications?: () => void;
  finishAzanDelivery?: () => void;
  suppressAzanHeadsUp?: () => void;
  requestAlarmKitAuthorization?: () => Promise<{
    authorized?: boolean;
    state?: string;
  }>;
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
      return kk.prayer.enteredFajr;
    case "dhuhr":
      return kk.prayer.enteredDhuhr;
    case "asr":
      return kk.prayer.enteredAsr;
    case "maghrib":
      return kk.prayer.enteredMaghrib;
    case "isha":
      return kk.prayer.enteredIsha;
    default: {
      const clean = label.trim();
      return clean ? kk.prayer.enteredGeneric(clean) : kk.prayer.enteredDefault;
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
  return (
    (platform === "android" || platform === "ios") &&
    slot.kind === "salat" &&
    soundId !== "off"
  );
}

export function scheduleFullScreenAzanAlarms(
  slots: PrayerScheduleSlot[],
  soundIdForSlot: (slot: PrayerScheduleSlot) => PrayerNotifSoundId
): Promise<FullScreenAzanScheduleResult> {
  const rejected: FullScreenAzanScheduleResult = { accepted: false, identifiers: new Set() };
  if (Platform.OS !== "android" && Platform.OS !== "ios") return Promise.resolve(rejected);
  const payload = buildFullScreenAzanSlots(slots, soundIdForSlot);
  /** Дыбыс off / бәрі muted — ескі native оятқыштарды өшіру. */
  if (payload.length === 0) {
    cancelFullScreenAzanAlarms();
    return Promise.resolve({ accepted: true, identifiers: new Set() });
  }
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
  const nativeIds = Array.isArray(result?.identifiers)
    ? result.identifiers.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];
  const scheduledCount = Math.max(0, Math.trunc(Number(result?.scheduledCount ?? 0)));
  if (Platform.OS === "android" && Number(Platform.Version) >= 31) {
    if (result?.exactAlarmPermissionGranted === false && nativeIds.length === 0 && scheduledCount === 0) {
      return rejected;
    }
  }
  if (nativeIds.length > 0) {
    return {
      accepted: true,
      identifiers: new Set(nativeIds),
    };
  }
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
  fullScreenIntentAllowed: boolean | null;
  overlayAllowed: boolean | null;
}> {
  if (Platform.OS !== "android" && Platform.OS !== "ios") {
    return {
      scheduledCount: 0,
      lastError: null,
      exactAlarmPermissionGranted: null,
      fullScreenIntentAllowed: null,
      overlayAllowed: null,
    };
  }
  try {
    const diag = await PrayerWidget?.getFullScreenAzanAlarmDiagnostics?.();
    return {
      scheduledCount: Math.max(0, Math.trunc(Number(diag?.scheduledCount ?? 0))),
      lastError: typeof diag?.lastError === "string" && diag.lastError ? diag.lastError : null,
      exactAlarmPermissionGranted:
        typeof diag?.exactAlarmPermissionGranted === "boolean" ? diag.exactAlarmPermissionGranted : null,
      fullScreenIntentAllowed:
        typeof diag?.fullScreenIntentAllowed === "boolean" ? diag.fullScreenIntentAllowed : null,
      overlayAllowed: typeof diag?.overlayAllowed === "boolean" ? diag.overlayAllowed : null,
    };
  } catch (e) {
    return {
      scheduledCount: 0,
      lastError: e instanceof Error ? e.message : "Native diagnostics unavailable",
      exactAlarmPermissionGranted: null,
      fullScreenIntentAllowed: null,
      overlayAllowed: null,
    };
  }
}

export function prayerAzanDeepLink(params: {
  label: string;
  enteredTitle?: string;
  time?: string;
  soundId: PrayerNotifSoundId;
  salatKey?: string;
  nativeAudio?: boolean;
}): string {
  const q = new URLSearchParams({
    label: params.label,
    enteredTitle: params.enteredTitle ?? prayerEnteredTitleForSlot(params.label, params.salatKey),
    time: params.time ?? "",
    soundId: params.soundId,
    salatKey: params.salatKey ?? "",
  });
  if (params.nativeAudio) q.set("nativeAudio", "1");
  return `raqat://azan?${q.toString()}`;
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
        nativeAudio: params.nativeAudio === true,
      })
    );
  } catch {
    /* Native alarm receiver also opens this deep link when the app is backgrounded. */
  }
}

export function isPrayerAzanRouteFocused(): boolean {
  if (!rootNavigationRef.isReady()) return false;
  const state = rootNavigationRef.getRootState();
  const route = state?.routes?.[state.index ?? 0];
  return route?.name === "PrayerAzan";
}

function normalizePendingAzanSoundId(raw: unknown): PrayerNotifSoundId {
  return raw === "off" || raw === "adhan_haramain" ? raw : "adhan_haramain";
}

export function prayerAzanParamsFromUrl(url: string | null | undefined): {
  label: string;
  enteredTitle?: string;
  time?: string;
  soundId: PrayerNotifSoundId;
  salatKey?: string;
  nativeAudio?: boolean;
} | null {
  if (!url || !url.includes("azan")) return null;
  const azanIdx = url.indexOf("azan");
  const parsed = parsePrayerAzanQueryParams(url.slice(azanIdx));
  if (!parsed?.label?.trim()) return null;
  return {
    label: parsed.label.trim(),
    enteredTitle: parsed.enteredTitle,
    time: parsed.time,
    soundId: normalizePendingAzanSoundId(parsed.soundId),
    salatKey: parsed.salatKey,
    nativeAudio: parsed.nativeAudio === "1",
  };
}

async function readPendingAzanLaunchFromNative(): Promise<{
  label: string;
  enteredTitle?: string;
  time?: string;
  soundId: PrayerNotifSoundId;
  salatKey?: string;
} | null> {
  if (Platform.OS !== "android" && Platform.OS !== "ios") return null;
  const read = PrayerWidget?.getPendingAzanLaunch;
  if (typeof read !== "function") return null;
  try {
    const pending = await read();
    const label = pending?.label?.trim();
    if (!label) return null;
    return {
      label,
      enteredTitle: pending?.enteredTitle?.trim() || undefined,
      time: pending?.time?.trim() || undefined,
      soundId: normalizePendingAzanSoundId(pending?.soundId),
      salatKey: pending?.salatKey?.trim() || undefined,
    };
  } catch {
    return null;
  }
}

export async function isNativeAzanSessionActive(): Promise<boolean> {
  if (Platform.OS !== "android" && Platform.OS !== "ios") return false;
  const read = PrayerWidget?.isAzanSessionActive;
  if (typeof read !== "function") return false;
  try {
    return (await read()) === true;
  } catch {
    return false;
  }
}

/**
 * Азан бетін launch URL/pending арқылы ашу керек пе.
 * Жабудан кейін stale `raqat://azan` getInitialURL жалғыз өзі қайта ашпасын.
 */
export function shouldOpenPrayerAzanFromLaunchState(opts: {
  hasPending: boolean;
  sessionActive: boolean;
  playbackAlive: boolean;
  hasLaunchUrl: boolean;
}): boolean {
  if (opts.hasPending) return true;
  if (opts.sessionActive && opts.playbackAlive && opts.hasLaunchUrl) return true;
  return false;
}

/**
 * Азан дыбысы native-де ойнаса да RN boot/nav кешіккенде PrayerAzan экранын ашады.
 * NavContainer.onReady және app active кезінде шақырылады.
 */
export async function ensurePrayerAzanRouteFromLaunch(): Promise<boolean> {
  if (Platform.OS === "web" || !rootNavigationRef.isReady()) return false;
  if (isPrayerAzanRouteFocused()) return false;

  const pending = await readPendingAzanLaunchFromNative();
  if (pending) {
    playNativePrayerAzanAudio(pending.soundId);
    await openPrayerAzanScreen({ ...pending, nativeAudio: true });
    try {
      PrayerWidget?.clearPendingAzanLaunch?.();
    } catch {
      /* */
    }
    return true;
  }

  const sessionActive = await isNativeAzanSessionActive();
  const playback = sessionActive ? await getNativeAzanPlaybackStatus() : null;
  const playbackAlive = Boolean(playback?.isPlaying || playback?.completed || playback?.isDua);
  const fromUrl = prayerAzanParamsFromUrl(await Linking.getInitialURL().catch(() => null));
  if (
    shouldOpenPrayerAzanFromLaunchState({
      hasPending: false,
      sessionActive,
      playbackAlive,
      hasLaunchUrl: Boolean(fromUrl),
    }) &&
    fromUrl
  ) {
    await openPrayerAzanScreen({ ...fromUrl, nativeAudio: true });
    return true;
  }

  return false;
}

/**
 * Азан deep link / pending launch бар болса — тіл onboarding NavigationContainer-ды бөгемесін.
 */
export async function ensurePrayerAzanShouldBypassOnboarding(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  if (await readPendingAzanLaunchFromNative()) return true;
  const sessionActive = await isNativeAzanSessionActive();
  if (!sessionActive) return false;
  const playback = await getNativeAzanPlaybackStatus();
  return Boolean(playback?.isPlaying || playback?.completed || playback?.isDua);
}

let azanLaunchRoutingInit = false;

/** Warm start: onNewIntent azan deep link — linking қосымша сақтық. */
export function initPrayerAzanLaunchRouting(): void {
  if (azanLaunchRoutingInit || Platform.OS === "web") return;
  azanLaunchRoutingInit = true;
  Linking.addEventListener("url", ({ url }) => {
    if (!url.includes("azan")) return;
    void ensurePrayerAzanRouteFromLaunch().catch(() => {
      /* OEM Linking failures must not become unhandled rejections. */
    });
  });
}

export function stopNativePrayerAzanAudio(): void {
  if (Platform.OS !== "android" && Platform.OS !== "ios") return;
  try {
    PrayerWidget?.stopNativeAzanAudio?.();
  } catch {
    /* no-op */
  }
}

/** Азанды тоқтату: дыбыс және жабу — толық жабу. */
export function finishAzanDelivery(): void {
  if (Platform.OS === "android" || Platform.OS === "ios") {
    try {
      PrayerWidget?.finishAzanDelivery?.();
    } catch {
      /* no-op */
    }
  }
  stopNativePrayerAzanAudio();
  clearLegacyNativeAzanNotifications();
}

/** Төбедегі азан heads-up баннерін жасыру (толық экран беті қалады). */
export function suppressAzanHeadsUpBanner(): void {
  if (Platform.OS !== "android") return;
  try {
    PrayerWidget?.suppressAzanHeadsUp?.();
  } catch {
    /* no-op */
  }
}

export function playNativePrayerAzanAudio(soundId: PrayerNotifSoundId): boolean {
  if ((Platform.OS !== "android" && Platform.OS !== "ios") || soundId === "off") return false;
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
  if (Platform.OS !== "android" && Platform.OS !== "ios") return false;
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
  if (Platform.OS !== "android" && Platform.OS !== "ios") return null;
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
