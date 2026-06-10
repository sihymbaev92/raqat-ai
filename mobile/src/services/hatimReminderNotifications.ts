import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { kk } from "../i18n/kk";

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

const K_ENABLED = "raqat_hatim_reminder_enabled_v1";
const K_HOUR = "raqat_hatim_reminder_hour_v1";
const K_MINUTE = "raqat_hatim_reminder_minute_v1";
const K_SCHEDULED_ID = "raqat_hatim_reminder_scheduled_id_v1";

const ANDROID_CHANNEL = "hatim_reading_v1";
const DEFAULT_HOUR = 20;
const DEFAULT_MINUTE = 0;

function clampHour(h: number): number {
  if (!Number.isFinite(h)) return DEFAULT_HOUR;
  return Math.min(23, Math.max(6, Math.round(h)));
}

function clampMinute(m: number): number {
  if (!Number.isFinite(m)) return 0;
  return Math.min(59, Math.max(0, Math.round(m)));
}

export async function getHatimReminderEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(K_ENABLED)) === "1";
  } catch {
    return false;
  }
}

export async function setHatimReminderEnabled(on: boolean): Promise<void> {
  await AsyncStorage.setItem(K_ENABLED, on ? "1" : "0");
}

export async function getHatimReminderClock(): Promise<{ hour: number; minute: number }> {
  try {
    const [hRaw, mRaw] = await Promise.all([AsyncStorage.getItem(K_HOUR), AsyncStorage.getItem(K_MINUTE)]);
    const hour = clampHour(parseInt(hRaw ?? String(DEFAULT_HOUR), 10));
    const minute = clampMinute(parseInt(mRaw ?? String(DEFAULT_MINUTE), 10));
    return { hour, minute };
  } catch {
    return { hour: DEFAULT_HOUR, minute: DEFAULT_MINUTE };
  }
}

export async function setHatimReminderClock(hour: number, minute: number): Promise<void> {
  await AsyncStorage.multiSet([
    [K_HOUR, String(clampHour(hour))],
    [K_MINUTE, String(clampMinute(minute))],
  ]);
}

async function readScheduledId(): Promise<string | null> {
  try {
    const v = await AsyncStorage.getItem(K_SCHEDULED_ID);
    return v && v.length ? v : null;
  } catch {
    return null;
  }
}

async function writeScheduledId(id: string | null): Promise<void> {
  if (!id) {
    await AsyncStorage.removeItem(K_SCHEDULED_ID);
    return;
  }
  await AsyncStorage.setItem(K_SCHEDULED_ID, id);
}

async function cancelHatimOnly(N: typeof import("expo-notifications")): Promise<void> {
  const prev = await readScheduledId();
  if (prev) {
    try {
      await N.cancelScheduledNotificationAsync(prev);
    } catch {
      /* */
    }
    await writeScheduledId(null);
  }
}

async function ensureHatimAndroidChannel(N: typeof import("expo-notifications")): Promise<void> {
  if (Platform.OS !== "android") return;
  await N.setNotificationChannelAsync(ANDROID_CHANNEL, {
    name: kk.hatim.reminderNotifChannelName,
    importance: N.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 220, 120, 220],
    sound: "default",
  });
}

/**
 * Намаз хабарламаларын қайта жоспарлағанда `cancelAll` хатым ескертулерін де жояды —
 * сол себепті намаз жоспарынан кейін осы функцияны шақырып, хатымды қайта қосамыз.
 */
export async function syncHatimReminderSchedule(): Promise<void> {
  const N = await loadNotifications();
  if (!N) return;

  await cancelHatimOnly(N);

  const enabled = await getHatimReminderEnabled();
  if (!enabled) return;

  const { status } = await N.getPermissionsAsync();
  if (status !== "granted") return;

  const { hour, minute } = await getHatimReminderClock();
  await ensureHatimAndroidChannel(N);

  const id = await N.scheduleNotificationAsync({
    content: {
      title: kk.hatim.reminderNotifTitle,
      body: kk.hatim.reminderNotifBody,
      ...(Platform.OS === "android" ? { android: { channelId: ANDROID_CHANNEL } } : {}),
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
  await writeScheduledId(id);
}
