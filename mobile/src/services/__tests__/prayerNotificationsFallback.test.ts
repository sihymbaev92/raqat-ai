import type { PrayerTimesResult } from "../../api/prayerTimes";

type ExpoNotificationMock = {
  scheduleNotificationAsync: jest.Mock;
  setNotificationChannelAsync: jest.Mock;
  getAllScheduledNotificationsAsync: jest.Mock;
  cancelScheduledNotificationAsync: jest.Mock;
  getPermissionsAsync: jest.Mock;
  requestPermissionsAsync: jest.Mock;
};

const samplePrayerTimes: PrayerTimesResult = {
  city: "Алматы",
  country: "Kazakhstan",
  date: "09-06-2026",
  fajr: "05:00",
  sunrise: "06:00",
  dhuhr: "13:00",
  asr: "16:00",
  maghrib: "19:00",
  isha: "21:00",
};

async function loadPrayerNotificationsWithNative(
  scheduleFullScreenAzanAlarms?: jest.Mock,
  opts: {
    cachedPrayer?: PrayerTimesResult | null;
    selectedCity?: { city: string; country: string };
    scheduledNotificationIds?: string[];
    permissionStatus?: string;
  } = {}
): Promise<{
  reschedulePrayerNotifications: typeof import("../prayerNotifications").reschedulePrayerNotifications;
  reschedulePrayerNotificationsFromCache: typeof import("../prayerNotifications").reschedulePrayerNotificationsFromCache;
  notifications: ExpoNotificationMock;
  nativeCancel: jest.Mock;
}> {
  jest.resetModules();

  const nativeCancel = jest.fn();
  const notifications: ExpoNotificationMock = {
    scheduleNotificationAsync: jest.fn(async () => "scheduled"),
    setNotificationChannelAsync: jest.fn(async () => undefined),
    getAllScheduledNotificationsAsync: jest.fn(async () =>
      (opts.scheduledNotificationIds ?? []).map((identifier) => ({ identifier }))
    ),
    cancelScheduledNotificationAsync: jest.fn(async () => undefined),
    getPermissionsAsync: jest.fn(async () => ({ status: opts.permissionStatus ?? "granted" })),
    requestPermissionsAsync: jest.fn(async () => ({ status: opts.permissionStatus ?? "granted" })),
  };

  jest.doMock("react-native", () => ({
    Platform: { OS: "android", Version: 35 },
    NativeModules: {
      PrayerWidget: scheduleFullScreenAzanAlarms
        ? { scheduleFullScreenAzanAlarms, cancelFullScreenAzanAlarms: nativeCancel }
        : { cancelFullScreenAzanAlarms: nativeCancel },
    },
    Linking: { openSettings: jest.fn() },
  }));

  jest.doMock("expo-notifications", () => ({
    AndroidNotificationPriority: { MAX: "max" },
    AndroidImportance: { MAX: "max" },
    SchedulableTriggerInputTypes: { DATE: "date" },
    setNotificationHandler: jest.fn(),
    ...notifications,
  }));

  jest.doMock("../../api/prayerTimes", () => ({
    applyPrayerTimeShift: (pt: PrayerTimesResult) => pt,
    fetchPrayerTimesForLocation: jest.fn(async (city: string, country: string) => ({
      ...samplePrayerTimes,
      city,
      country,
    })),
    fetchPrayerTimesForLocationForDate: jest.fn(async () => samplePrayerTimes),
    isPrayerTimesResultForLocalToday: jest.fn(() => true),
  }));

  jest.doMock("../../storage/prefs", () => ({
    getIftarEnabled: jest.fn(async () => false),
    getNotifEnabled: jest.fn(async () => true),
    getPrayerMosqueShiftMin: jest.fn(async () => 0),
    getPrayerNotifMutedSalatKeys: jest.fn(async () => []),
    getPrayerNotifSoundId: jest.fn(async () => "adhan_haramain"),
    getPrayerSourceMode: jest.fn(async () => "auto"),
    getSelectedCity: jest.fn(async () => opts.selectedCity ?? { city: "Алматы", country: "Kazakhstan" }),
    PRAYER_NOTIF_SALAT_KEYS: ["fajr", "dhuhr", "asr", "maghrib", "isha"],
  }));

  const savePrayerCache = jest.fn(async () => undefined);
  jest.doMock("../../storage/prayerCache", () => ({
    loadPrayerCache: jest.fn(async () => opts.cachedPrayer ?? null),
    savePrayerCache,
  }));
  jest.doMock("../hatimReminderNotifications", () => ({
    syncHatimReminderSchedule: jest.fn(async () => undefined),
  }));
  jest.doMock("../notificationQuickActions", () => ({
    getQuickActionCategoryId: jest.fn(() => "prayer-actions"),
  }));
  jest.doMock("../prayerDaySelfHeal", () => ({
    refreshPrayerCacheIfCalendarStale: jest.fn(async () => undefined),
  }));
  jest.doMock("../../utils/previewPrayerNotifSound", () => ({
    canPreviewPrayerNotifSound: jest.fn((id: string) => id !== "off"),
  }));

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("../prayerNotifications") as typeof import("../prayerNotifications");
  return {
    reschedulePrayerNotifications: mod.reschedulePrayerNotifications,
    reschedulePrayerNotificationsFromCache: mod.reschedulePrayerNotificationsFromCache,
    notifications,
    nativeCancel,
  };
}

describe("Android prayer azan scheduling", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-06-09T00:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it("schedules native azan alarms without Expo prayer notifications", async () => {
    const nativeSchedule = jest.fn(async (json: string) => ({
      scheduledCount: JSON.parse(json).length,
      identifiers: JSON.parse(json).map((slot: { identifier: string }) => slot.identifier),
    }));
    const { reschedulePrayerNotifications, notifications } =
      await loadPrayerNotificationsWithNative(nativeSchedule);

    await reschedulePrayerNotifications(samplePrayerTimes, {
      enabled: true,
      iftarExtra: false,
      prayerTimesAlreadyAdjusted: true,
    });

    expect(nativeSchedule).toHaveBeenCalledTimes(1);
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("does not fall back to Expo prayer notifications when native scheduling reports zero alarms", async () => {
    const nativeSchedule = jest.fn(async () => ({ scheduledCount: 0, identifiers: [] }));
    const { reschedulePrayerNotifications, notifications } =
      await loadPrayerNotificationsWithNative(nativeSchedule);

    await reschedulePrayerNotifications(samplePrayerTimes, {
      enabled: true,
      iftarExtra: false,
      prayerTimesAlreadyAdjusted: true,
    });

    expect(nativeSchedule).toHaveBeenCalledTimes(1);
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("does not fall back to Expo when the native schedule module is missing", async () => {
    const { reschedulePrayerNotifications, notifications } =
      await loadPrayerNotificationsWithNative(undefined);

    await reschedulePrayerNotifications(samplePrayerTimes, {
      enabled: true,
      iftarExtra: false,
      prayerTimesAlreadyAdjusted: true,
    });

    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("does not fall back to Expo when native scheduling throws", async () => {
    const nativeSchedule = jest.fn(() => {
      throw new Error("native exact alarm unavailable");
    });
    const { reschedulePrayerNotifications, notifications } =
      await loadPrayerNotificationsWithNative(nativeSchedule);

    await reschedulePrayerNotifications(samplePrayerTimes, {
      enabled: true,
      iftarExtra: false,
      prayerTimesAlreadyAdjusted: true,
    });

    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("still schedules native azan alarms when Android notification permission is denied", async () => {
    const nativeSchedule = jest.fn(async (json: string) => ({
      scheduledCount: JSON.parse(json).length,
      identifiers: JSON.parse(json).map((slot: { identifier: string }) => slot.identifier),
    }));
    const { reschedulePrayerNotifications, notifications } =
      await loadPrayerNotificationsWithNative(nativeSchedule, { permissionStatus: "denied" });

    await reschedulePrayerNotifications(samplePrayerTimes, {
      enabled: true,
      iftarExtra: false,
      prayerTimesAlreadyAdjusted: true,
    });

    expect(nativeSchedule).toHaveBeenCalledTimes(1);
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("keeps existing native azan alarms when prayer cache is not ready yet", async () => {
    const { reschedulePrayerNotificationsFromCache, notifications, nativeCancel } =
      await loadPrayerNotificationsWithNative(jest.fn(), {
        cachedPrayer: null,
        scheduledNotificationIds: ["raqat-prayer-v2-20260609-dhuhr"],
      });

    await reschedulePrayerNotificationsFromCache();

    expect(notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
    expect(nativeCancel).not.toHaveBeenCalled();
  });

  it("refetches and reschedules when selected city differs from prayer cache", async () => {
    const nativeSchedule = jest.fn(async (json: string) => ({
      scheduledCount: JSON.parse(json).length,
      identifiers: JSON.parse(json).map((slot: { identifier: string }) => slot.identifier),
    }));
    const { reschedulePrayerNotificationsFromCache, nativeCancel } =
      await loadPrayerNotificationsWithNative(nativeSchedule, {
        cachedPrayer: { ...samplePrayerTimes, city: "Алматы" },
        selectedCity: { city: "Астана", country: "Kazakhstan" },
        scheduledNotificationIds: ["raqat-prayer-v2-20260609-dhuhr"],
      });

    await reschedulePrayerNotificationsFromCache();

    expect(nativeCancel).not.toHaveBeenCalled();
    expect(nativeSchedule).toHaveBeenCalled();
  });
});
