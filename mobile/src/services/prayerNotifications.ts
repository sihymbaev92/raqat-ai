import { Platform } from "react-native";
import type { PrayerTimesResult } from "../api/prayerTimes";
import { fetchPrayerTimesByCityForDate } from "../api/prayerTimes";
import { kk } from "../i18n/kk";
import { getIftarEnabled, getNotifEnabled } from "../storage/prefs";
import { loadPrayerCache } from "../storage/prayerCache";
import { AndroidNotificationPriority } from "expo-notifications";

let Notifications: typeof import("expo-notifications") | null = null;

async function loadNotifications() {
  if (Platform.OS === "web") return null;
  if (!Notifications) {
    Notifications = await import("expo-notifications");
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

function atTimeOnDay(hhmm: string, day: Date): Date {
  const p = hhmm.split(":");
  const h = parseInt(p[0] ?? "0", 10);
  const m = parseInt(p[1] ?? "0", 10);
  const d = new Date(day);
  d.setSeconds(0, 0);
  d.setMilliseconds(0);
  d.setHours(h, m, 0, 0);
  return d;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const N = await loadNotifications();
  if (!N) return false;
  const { status: existing } = await N.getPermissionsAsync();
  let final = existing;
  if (existing !== "granted") {
    const { status } = await N.requestPermissionsAsync();
    final = status;
  }
  return final === "granted";
}

const PRAYER_CHANNEL_ID = "prayer_alerts_v2";

async function ensureAndroidChannel(N: typeof import("expo-notifications")) {
  if (Platform.OS === "android") {
    await N.setNotificationChannelAsync(PRAYER_CHANNEL_ID, {
      name: "Намаз уақыты",
      importance: N.AndroidImportance.MAX,
      vibrationPattern: [0, 280, 200, 280],
      enableLights: true,
      lightColor: "#E5C158",
      sound: "default",
      showBadge: true,
    });
  }
}

/** Бүгін + ертеңгі намаз уақыттары (келесі 36 сағатқа дейін); қолданба ашылғанда жаңартылады. */
export async function reschedulePrayerNotifications(
  data: PrayerTimesResult,
  opts: { enabled: boolean; iftarExtra: boolean }
): Promise<void> {
  const N = await loadNotifications();
  if (!N || !opts.enabled) {
    if (N) await N.cancelAllScheduledNotificationsAsync();
    return;
  }

  await ensureAndroidChannel(N);
  await N.cancelAllScheduledNotificationsAsync();

  const now = Date.now();
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let tomorrowData: PrayerTimesResult | null = null;
  if (!data.error && data.city && data.country) {
    tomorrowData = await fetchPrayerTimesByCityForDate(data.city, data.country, tomorrow, 3);
    if (tomorrowData.error) tomorrowData = null;
  }

  const dayBuckets: { day: Date; pt: PrayerTimesResult }[] = [{ day: today, pt: data }];
  if (tomorrowData) {
    dayBuckets.push({ day: tomorrow, pt: tomorrowData });
  }

  const salatKeys: { k: keyof PrayerTimesResult; label: string; kind: "salat" | "sun" }[] = [
    { k: "fajr", label: "Таң", kind: "salat" },
    { k: "sunrise", label: "Күн", kind: "sun" },
    { k: "dhuhr", label: "Бесін", kind: "salat" },
    { k: "asr", label: "Екінті", kind: "salat" },
    { k: "maghrib", label: "Ақшам", kind: "salat" },
    { k: "isha", label: "Құптан", kind: "salat" },
  ];

  let n = 0;
  for (const { day, pt } of dayBuckets) {
    for (const row of salatKeys) {
      if (n >= 64) break;
      const time = pt[row.k];
      if (typeof time !== "string" || !time) continue;
      const when = atTimeOnDay(time, day);
      if (when.getTime() <= now) continue;

      const isMaghrib = row.k === "maghrib";
      const timeShort = time.trim().split(/\s+/)[0] ?? time;
      const body =
        row.kind === "sun"
          ? kk.prayer.notifSunriseBody(timeShort)
          : isMaghrib && opts.iftarExtra
            ? `${kk.prayer.notifPushBody(row.label, timeShort)} · Ифтар`
            : kk.prayer.notifPushBody(row.label, timeShort);

      await N.scheduleNotificationAsync({
        content: {
          title: kk.prayer.notifPushTitle,
          body,
          sound: true,
          priority: AndroidNotificationPriority.MAX,
        },
        trigger: {
          type: N.SchedulableTriggerInputTypes.DATE,
          date: when,
          channelId: PRAYER_CHANNEL_ID,
        },
      });
      n += 1;
    }
  }
}

/** Қолданба алғаш ашылғанда немесе фоннан оралғанда — кестені кэштан қайта жоспарлау */
export async function reschedulePrayerNotificationsFromCache(): Promise<void> {
  const [enabled, iftar, cached] = await Promise.all([
    getNotifEnabled(),
    getIftarEnabled(),
    loadPrayerCache(),
  ]);
  if (!cached || cached.error) return;
  await reschedulePrayerNotifications(cached, { enabled, iftarExtra: iftar });
}

export async function cancelAllPrayerNotifications(): Promise<void> {
  const N = await loadNotifications();
  if (N) await N.cancelAllScheduledNotificationsAsync();
}
