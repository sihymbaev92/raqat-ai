import { Linking, NativeModules, Platform } from "react-native";
import type { PrayerTimesResult } from "../api/prayerTimes";
import { applyPrayerTimeShift, fetchPrayerTimesForLocationForDate } from "../api/prayerTimes";
import { kk } from "../i18n/kk";
import {
  getIftarEnabled,
  getNotifEnabled,
  getPrayerMosqueShiftMin,
  getPrayerNotifMutedSalatKeys,
  getPrayerNotifSoundId,
  getPrayerSourceMode,
  getSelectedCity,
  PRAYER_NOTIF_SALAT_KEYS,
  type PrayerNotifSalatKey,
  type PrayerNotifSoundId,
} from "../storage/prefs";
import { loadPrayerCache } from "../storage/prayerCache";
import { refreshPrayerCacheIfCalendarStale } from "./prayerDaySelfHeal";
import { AndroidNotificationPriority } from "expo-notifications";
import { getQuickActionCategoryId } from "./notificationQuickActions";
import { syncHatimReminderSchedule } from "./hatimReminderNotifications";
import { canPreviewPrayerNotifSound } from "../utils/previewPrayerNotifSound";
import {
  buildPrayerDayBuckets,
  collectUpcomingPrayerSlots,
  isPrayerNotificationIdentifier,
  localDayAtNoon,
  shouldPlayPrayerAdhanSound,
  type PrayerDayBucket,
} from "./prayerNotificationSchedule";
import {
  cancelFullScreenAzanAlarms,
  clearLegacyNativeAzanNotifications,
  getFullScreenAzanAlarmDiagnostics,
  openPrayerAzanScreen,
  prayerEnteredTitleForSlot,
  scheduleFullScreenAzanAlarms,
} from "./prayerFullScreenAzan";

let Notifications: typeof import("expo-notifications") | null = null;

async function loadNotifications() {
  if (Platform.OS === "web") return null;
  if (!Notifications) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    Notifications = require("expo-notifications") as typeof import("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
  return Notifications;
}

const PRAYER_FETCH_DAYS = 14;
const PRAYER_SCHEDULE_LIMIT = 64;

export async function requestNotificationPermissions(): Promise<boolean> {
  const N = await loadNotifications();
  if (!N) return false;
  const { status: existing } = await N.getPermissionsAsync();
  let final = existing;
  if (existing !== "granted") {
    const { status } = await N.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    });
    final = status;
  }
  if (final !== "granted") return false;
  const soundId = await getPrayerNotifSoundId();
  await ensurePrayerAndroidChannel(N, soundId);
  return true;
}

/** Android 12+: дәл уақыт триггерлері — жүйелік «Рұқсат беру» экраны. */
export async function openAndroidExactAlarmSettings(): Promise<void> {
  if (Platform.OS !== "android" || Number(Platform.Version) < 31) return;
  const PrayerWidget = NativeModules.PrayerWidget as {
    requestExactAlarmPermissionIfNeeded?: () => Promise<boolean>;
  };
  try {
    if (typeof PrayerWidget?.requestExactAlarmPermissionIfNeeded === "function") {
      const opened = await PrayerWidget.requestExactAlarmPermissionIfNeeded();
      if (opened) return;
    }
  } catch {
    /* */
  }
  try {
    await Linking.openSettings();
  } catch {
    /* */
  }
}

/** Android 14+: full-screen intent рұқсаты (locked-screen azan). */
export async function openAndroidFullScreenIntentSettings(): Promise<void> {
  if (Platform.OS !== "android" || Number(Platform.Version) < 34) return;
  const PrayerWidget = NativeModules.PrayerWidget as {
    requestFullScreenIntentPermissionIfNeeded?: () => Promise<boolean>;
  };
  try {
    if (typeof PrayerWidget?.requestFullScreenIntentPermissionIfNeeded === "function") {
      const opened = await PrayerWidget.requestFullScreenIntentPermissionIfNeeded();
      if (opened) return;
    }
  } catch {
    /* */
  }
  try {
    const pkg = "kz.raqat.app";
    await Linking.openURL(`android.settings.MANAGE_APP_USE_FULL_SCREEN_INTENT?package=${pkg}`);
  } catch {
    try {
      await Linking.openSettings();
    } catch {
      /* */
    }
  }
}

async function cancelPrayerScheduledNotificationsOnly(
  N: NonNullable<Awaited<ReturnType<typeof loadNotifications>>>
): Promise<void> {
  const all = await N.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter((n) => isPrayerNotificationIdentifier(n.identifier))
      .map((n) => N.cancelScheduledNotificationAsync(n.identifier!))
  );
}

async function clearAndroidPresentedPrayerNotifications(
  N: NonNullable<Awaited<ReturnType<typeof loadNotifications>>>
): Promise<void> {
  if (Platform.OS !== "android") return;
  clearLegacyNativeAzanNotifications();
  const withPresented = N as typeof N & {
    getPresentedNotificationsAsync?: () => Promise<Array<{ request?: { identifier?: string } }>>;
    dismissNotificationAsync?: (identifier: string) => Promise<void>;
    dismissAllNotificationsAsync?: () => Promise<void>;
  };
  try {
    const presented =
      typeof withPresented.getPresentedNotificationsAsync === "function"
        ? await withPresented.getPresentedNotificationsAsync()
        : [];
    const prayerIds = presented
      .map((n) => n.request?.identifier)
      .filter((id): id is string => isPrayerNotificationIdentifier(id));
    if (prayerIds.length > 0 && typeof withPresented.dismissNotificationAsync === "function") {
      await Promise.all(prayerIds.map((id) => withPresented.dismissNotificationAsync?.(id)));
    }
  } catch {
    // Legacy Expo/native prayer notifications can survive an app upgrade; clear app notifications once on Android.
    try {
      await withPresented.dismissAllNotificationsAsync?.();
    } catch {
      /* no-op */
    }
  }
}

async function fetchPrayerDaysAhead(
  city: string,
  country: string,
  anchor: Date,
  shiftMin: number = 0
): Promise<PrayerDayBucket[]> {
  const tasks = Array.from({ length: PRAYER_FETCH_DAYS }, (_, i) => {
    const day = localDayAtNoon(anchor, i);
    return fetchPrayerTimesForLocationForDate(city, country, day).then((pt) => ({
      day,
      pt: shiftMin === 0 ? pt : applyPrayerTimeShift(pt, shiftMin),
    }));
  });
  const settled = await Promise.allSettled(tasks);
  return settled
    .filter((r): r is PromiseFulfilledResult<PrayerDayBucket> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((x) => !x.pt.error);
}

/** Жинақтағы MP3 атаулары (app.config.js → expo-notifications sounds). */
const BUNDLED_SOUND: Record<Exclude<PrayerNotifSoundId, "off">, string> = {
  adhan_haramain: "prayer_azan_user_01.mp3",
  adhan_madina_clear: "prayer_azan_user_02.mp3",
  adhan_makkah_live: "prayer_azan_user_03.mp3",
  adhan_soft_cc0: "prayer_azan_user_04.mp3",
  adhan_takbir_high: "prayer_azan_user_05.mp3",
};

function prayerAndroidChannelId(soundId: PrayerNotifSoundId): string {
  /** Android channel дыбысы immutable, сондықтан дыбыс/fallback өзгергенде version bump керек. */
  return `prayer_v15_${soundId}`;
}

export function getPrayerAndroidChannelId(soundId: PrayerNotifSoundId): string {
  return prayerAndroidChannelId(soundId);
}

export type PrayerNotificationDiagnostics = {
  platform: typeof Platform.OS;
  permissionStatus: string;
  notificationsEnabled: boolean;
  scheduledPrayerCount: number;
  nativeAzanReliabilityStatus: "ready" | "blocked" | "idle" | "unavailable";
  nativeAzanAlarmCount: number;
  nativeAzanAlarmLastError: string | null;
  nativeAzanExactAlarmPermissionGranted: boolean | null;
  nativeAzanFullScreenIntentPermissionGranted: boolean | null;
  soundId: PrayerNotifSoundId;
  androidChannelId: string | null;
  mutedSalatKeys: PrayerNotifSalatKey[];
  exactAlarmSettingsAvailable: boolean;
};

function nativeAzanReliabilityStatus(args: {
  enabled: boolean;
  scheduledCount: number;
  lastError: string | null;
  exactAlarmPermissionGranted: boolean | null;
  fullScreenIntentPermissionGranted: boolean | null;
}): PrayerNotificationDiagnostics["nativeAzanReliabilityStatus"] {
  if (Platform.OS !== "android") return "unavailable";
  if (!args.enabled) return "idle";
  if (args.scheduledCount > 0) return "ready";
  if (args.lastError || args.exactAlarmPermissionGranted === false) return "blocked";
  return "idle";
}

function isPrayerNotifSalatKey(value: unknown): value is PrayerNotifSalatKey {
  return typeof value === "string" && (PRAYER_NOTIF_SALAT_KEYS as string[]).includes(value);
}

async function getPrayerScheduleShiftMin(): Promise<number> {
  const [sourceMode, shiftMin] = await Promise.all([getPrayerSourceMode(), getPrayerMosqueShiftMin()]);
  return sourceMode === "mosque" ? shiftMin : 0;
}

/**
 * Android 8+ үшін арна дыбысын дұрыс ойнату: әр таңдауға жеке channelId.
 * iOS дыбысын `content.sound` анықтайды.
 */
async function ensurePrayerAndroidChannel(
  N: typeof import("expo-notifications"),
  soundId: PrayerNotifSoundId
): Promise<void> {
  if (Platform.OS !== "android") return;
  const id = prayerAndroidChannelId(soundId);
  const base = {
    name: "Намаз уақыты",
    importance: N.AndroidImportance.MAX,
    vibrationPattern: [0, 280, 200, 280] as [number, number, ...number[]],
    enableLights: true,
    lightColor: "#E5C158",
    showBadge: true,
  };
  if (soundId === "off") {
    await N.setNotificationChannelAsync(id, {
      ...base,
      sound: null,
    });
  } else {
    await N.setNotificationChannelAsync(id, {
      ...base,
      sound: BUNDLED_SOUND[soundId],
    });
  }
}

function iosContentSound(soundId: PrayerNotifSoundId): boolean | string {
  if (soundId === "off") return false;
  return BUNDLED_SOUND[soundId];
}

function buildPrayerNotificationContent(
  soundId: PrayerNotifSoundId,
  body: string,
  opts?: { muteBundledSound?: boolean; title?: string }
): import("expo-notifications").NotificationContentInput {
  const contentChannelSoundId: PrayerNotifSoundId =
    opts?.muteBundledSound && Platform.OS === "android" ? "off" : soundId;
  const chId = prayerAndroidChannelId(contentChannelSoundId);
  const base = {
    title: opts?.title ?? kk.prayer.notifPushTitle,
    body,
    priority: AndroidNotificationPriority.MAX,
    categoryIdentifier: getQuickActionCategoryId(),
  };

  if (opts?.muteBundledSound) {
    if (Platform.OS === "android") {
      return {
        ...base,
        sound: false,
        android: { channelId: chId },
      } as import("expo-notifications").NotificationContentInput;
    }
    return { ...base, sound: false } as import("expo-notifications").NotificationContentInput;
  }

  if (Platform.OS === "android") {
    const c: Record<string, unknown> = {
      ...base,
      android: { channelId: chId },
    };
    if (soundId === "off") c.sound = false;
    /** Кей OEM-дерде тек арнадағы дыбыс жеткіліксіз — жоспарланған хабарламаға да asset атын береміз. */
    else c.sound = BUNDLED_SOUND[soundId];
    return c as import("expo-notifications").NotificationContentInput;
  }

  return { ...base, sound: iosContentSound(soundId) };
}

function prayerTriggerChannel(
  N: typeof import("expo-notifications"),
  soundId: PrayerNotifSoundId,
  when: Date
): import("expo-notifications").SchedulableNotificationTriggerInput {
  const chId = prayerAndroidChannelId(soundId);
  return {
    type: N.SchedulableTriggerInputTypes.DATE,
    date: when,
    ...(Platform.OS === "android" ? { channelId: chId } : {}),
  };
}

async function scheduleExpoPrayerSlots(
  N: typeof import("expo-notifications"),
  slots: ReturnType<typeof collectUpcomingPrayerSlots>,
  soundIdForSlot: (slot: (typeof slots)[number]) => PrayerNotifSoundId,
  opts: { iftarExtra: boolean }
): Promise<void> {
  const ensuredSoundIds = new Set<PrayerNotifSoundId>();
  const ensureSoundChannel = async (id: PrayerNotifSoundId) => {
    if (ensuredSoundIds.has(id)) return;
    await ensurePrayerAndroidChannel(N, id);
    ensuredSoundIds.add(id);
  };

  for (const slot of slots) {
    const isMaghrib = slot.salatKey === "maghrib";
    const body =
      slot.kind === "sun"
        ? kk.prayer.notifSunriseBody(slot.timeShort)
        : isMaghrib && opts.iftarExtra
          ? `${kk.prayer.notifPushBody(slot.label, slot.timeShort)} · Ифтар`
          : kk.prayer.notifPushBody(slot.label, slot.timeShort);
    const title =
      slot.kind === "sun" ? kk.prayer.notifPushTitle : prayerEnteredTitleForSlot(slot.label, slot.salatKey);
    const slotSoundId = soundIdForSlot(slot);
    await ensureSoundChannel(slotSoundId);

    await N.scheduleNotificationAsync({
      identifier: slot.identifier,
      content: buildPrayerNotificationContent(slotSoundId, body, { title }),
      trigger: prayerTriggerChannel(N, slotSoundId, slot.when),
    });
  }
}

async function ensureAndroidNotificationPermission(N: typeof import("expo-notifications")): Promise<boolean> {
  const { status: existing } = await N.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await N.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return status === "granted";
}

/** Келесі 14 күнге дейінгі намаз уақыттары (iOS ~64 pending лимиті). Кэш бірінші — фонда желі күтпейді. */
export async function reschedulePrayerNotifications(
  data: PrayerTimesResult,
  opts: { enabled: boolean; iftarExtra: boolean; prayerTimesAlreadyAdjusted?: boolean }
): Promise<void> {
  try {
    const N = await loadNotifications();
    if (!N && Platform.OS !== "android") return;

    if (!opts.enabled) {
      if (N) await cancelPrayerScheduledNotificationsOnly(N);
      if (N) await clearAndroidPresentedPrayerNotifications(N);
      cancelFullScreenAzanAlarms();
      return;
    }

    const permission = N ? await N.getPermissionsAsync() : null;
    if (Platform.OS !== "android" && permission?.status !== "granted") {
      if (N) await cancelPrayerScheduledNotificationsOnly(N);
      cancelFullScreenAzanAlarms();
      return;
    }

    if (data.error || !data.city || !data.country) {
      return;
    }

    const [soundId, mutedSalatKeys, shiftMin] = await Promise.all([
      getPrayerNotifSoundId(),
      getPrayerNotifMutedSalatKeys(),
      getPrayerScheduleShiftMin(),
    ]);
    const now = Date.now();
    const anchor = localDayAtNoon(new Date(), 0);

    const fetched = await fetchPrayerDaysAhead(data.city, data.country, anchor, shiftMin);
    const scheduleData =
      shiftMin !== 0 && !opts.prayerTimesAlreadyAdjusted ? applyPrayerTimeShift(data, shiftMin) : data;
    const dayBuckets = buildPrayerDayBuckets(scheduleData, fetched, anchor);
    const slots = collectUpcomingPrayerSlots(dayBuckets, now, PRAYER_SCHEDULE_LIMIT);

    if (slots.length === 0) {
      if (N) await cancelPrayerScheduledNotificationsOnly(N);
      if (N) await clearAndroidPresentedPrayerNotifications(N);
      cancelFullScreenAzanAlarms();
      return;
    }

    if (N) await cancelPrayerScheduledNotificationsOnly(N);
    if (N) await clearAndroidPresentedPrayerNotifications(N);
    const soundIdForSlot = (slot: (typeof slots)[number]): PrayerNotifSoundId =>
      shouldPlayPrayerAdhanSound(slot, mutedSalatKeys) ? soundId : "off";
    const nativeAzan = await scheduleFullScreenAzanAlarms(slots, soundIdForSlot);

    if (Platform.OS === "android") {
      const nativeOk = nativeAzan.accepted && nativeAzan.identifiers.size > 0;
      if (!nativeOk && N && (await ensureAndroidNotificationPermission(N))) {
        await scheduleExpoPrayerSlots(N, slots, soundIdForSlot, { iftarExtra: opts.iftarExtra });
      }
      return;
    }

    if (!N) return;
    await scheduleExpoPrayerSlots(N, slots, soundIdForSlot, { iftarExtra: opts.iftarExtra });
  } finally {
    await syncHatimReminderSchedule();
  }
}

/** Қолданба ашылғанда / фоннан оралғанда / background fetch — алдымен кэшті жаңарту, содан жоспарлау. */
export async function reschedulePrayerNotificationsFromCache(): Promise<void> {
  await refreshPrayerCacheIfCalendarStale();
  const [enabled, iftar, cached, selected] = await Promise.all([
    getNotifEnabled(),
    getIftarEnabled(),
    loadPrayerCache(),
    getSelectedCity(),
  ]);
  if (!cached || cached.error) {
    /** Кэш әлі жүктелмесе немесе уақытша қате болса — бұрын жоспарланған native азан оятқыштарын өшірмейміз. */
    return;
  }
  if (cached.city !== selected.city || cached.country !== selected.country) {
    await cancelAllPrayerNotifications();
    return;
  }
  await reschedulePrayerNotifications(cached, { enabled, iftarExtra: iftar, prayerTimesAlreadyAdjusted: true });
}

export async function cancelAllPrayerNotifications(): Promise<void> {
  const N = await loadNotifications();
  if (N) await cancelPrayerScheduledNotificationsOnly(N);
  if (N) await clearAndroidPresentedPrayerNotifications(N);
  cancelFullScreenAzanAlarms();
  await syncHatimReminderSchedule();
}

/** Баптауларда тексеру: жүйеге қанша намаз триггері жазылған. */
export async function getScheduledPrayerNotificationCount(): Promise<number> {
  const N = await loadNotifications();
  if (!N) return 0;
  const all = await N.getAllScheduledNotificationsAsync();
  return all.filter((n) => isPrayerNotificationIdentifier(n.identifier)).length;
}

export async function getPrayerNotificationDiagnostics(): Promise<PrayerNotificationDiagnostics> {
  const N = await loadNotifications();
  const [enabled, soundId, mutedSalatKeys] = await Promise.all([
    getNotifEnabled(),
    getPrayerNotifSoundId(),
    getPrayerNotifMutedSalatKeys(),
  ]);
  if (!N) {
    const nativeAzan = await getFullScreenAzanAlarmDiagnostics();
    return {
      platform: Platform.OS,
      permissionStatus: "unavailable",
      notificationsEnabled: enabled,
      scheduledPrayerCount: 0,
      nativeAzanReliabilityStatus: nativeAzanReliabilityStatus({
        enabled,
        scheduledCount: nativeAzan.scheduledCount,
        lastError: nativeAzan.lastError,
        exactAlarmPermissionGranted: nativeAzan.exactAlarmPermissionGranted,
        fullScreenIntentPermissionGranted: nativeAzan.fullScreenIntentPermissionGranted,
      }),
      nativeAzanAlarmCount: nativeAzan.scheduledCount,
      nativeAzanAlarmLastError: nativeAzan.lastError,
      nativeAzanExactAlarmPermissionGranted: nativeAzan.exactAlarmPermissionGranted,
      nativeAzanFullScreenIntentPermissionGranted: nativeAzan.fullScreenIntentPermissionGranted,
      soundId,
      androidChannelId: null,
      mutedSalatKeys,
      exactAlarmSettingsAvailable: false,
    };
  }
  const [permission, scheduledPrayerCount, nativeAzan] = await Promise.all([
    N.getPermissionsAsync(),
    getScheduledPrayerNotificationCount(),
    getFullScreenAzanAlarmDiagnostics(),
  ]);
  return {
    platform: Platform.OS,
    permissionStatus: permission.status,
    notificationsEnabled: enabled,
    scheduledPrayerCount,
    nativeAzanReliabilityStatus: nativeAzanReliabilityStatus({
      enabled,
      scheduledCount: nativeAzan.scheduledCount,
      lastError: nativeAzan.lastError,
      exactAlarmPermissionGranted: nativeAzan.exactAlarmPermissionGranted,
      fullScreenIntentPermissionGranted: nativeAzan.fullScreenIntentPermissionGranted,
    }),
    nativeAzanAlarmCount: nativeAzan.scheduledCount,
    nativeAzanAlarmLastError: nativeAzan.lastError,
    nativeAzanExactAlarmPermissionGranted: nativeAzan.exactAlarmPermissionGranted,
    nativeAzanFullScreenIntentPermissionGranted: nativeAzan.fullScreenIntentPermissionGranted,
    soundId,
    androidChannelId: Platform.OS === "android" ? prayerAndroidChannelId(soundId) : null,
    mutedSalatKeys,
    exactAlarmSettingsAvailable: Platform.OS === "android" && Number(Platform.Version) >= 31,
  };
}

/**
 * Қолданба ашық кезде де намаз минуты кірген сәтте дыбыспен жедел ескерту.
 * Dashboard-тан бір реттік pulse-пен шақырылады (қайталанып кетпеуі үшін).
 */
export async function fireInAppPrayerAlert(
  prayerLabel: string,
  timeLabel?: string,
  salatKey?: string
): Promise<boolean> {
  const N = await loadNotifications();
  if (!N && Platform.OS !== "android") return false;
  const [enabled, permission, soundId, mutedSalatKeys] = await Promise.all([
    getNotifEnabled(),
    N ? N.getPermissionsAsync() : Promise.resolve(null),
    getPrayerNotifSoundId(),
    getPrayerNotifMutedSalatKeys(),
  ]);
  if (!enabled) return false;
  if (Platform.OS !== "android" && permission?.status !== "granted") return false;
  const salatSoundKey = isPrayerNotifSalatKey(salatKey) ? salatKey : null;
  const shouldPlaySound =
    salatSoundKey != null &&
    shouldPlayPrayerAdhanSound({ kind: "salat", salatKey: salatSoundKey }, mutedSalatKeys);
  const alertSoundId = shouldPlaySound ? soundId : "off";
  if (N) await ensurePrayerAndroidChannel(N, alertSoundId);
  /** Жинақтағы MP3: хабарлама дыбысы жиі басылады — expo-av арқылы толық ойнатамыз. */
  if (canPreviewPrayerNotifSound(alertSoundId)) {
    await openPrayerAzanScreen({
      label: prayerLabel,
      enteredTitle: prayerEnteredTitleForSlot(prayerLabel, salatSoundKey ?? undefined),
      time: timeLabel,
      soundId: alertSoundId,
      salatKey: salatSoundKey ?? undefined,
    });
    return true;
  }

  if (Platform.OS !== "android" && N) {
    const body = timeLabel
      ? kk.prayer.notifPushBody(prayerLabel, timeLabel)
      : `${prayerLabel} уақыты кірді.`;
    await N.scheduleNotificationAsync({
      content: buildPrayerNotificationContent(alertSoundId, body, {
        title: prayerEnteredTitleForSlot(prayerLabel, salatSoundKey ?? undefined),
      }),
      trigger: null,
    });
  }
  return true;
}
