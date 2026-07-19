import { Platform } from "react-native";
import { rootNavigationRef } from "../navigation/rootNavigationRef";
import type { PrayerNotifSoundId } from "../storage/prefs";
import { openPrayerAzanScreen } from "./prayerFullScreenAzan";
import { isPrayerNotificationIdentifier } from "./prayerNotificationSchedule";
import { kk } from "../i18n/kk";

type PrayerAzanNotificationData = {
  raqatType?: string;
  label?: string;
  enteredTitle?: string;
  timeShort?: string;
  salatKey?: string;
  soundId?: string;
};

function parsePrayerAzanData(raw: unknown): PrayerAzanNotificationData | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as PrayerAzanNotificationData;
  if (data.raqatType !== "prayer_azan") return null;
  return data;
}

export async function routePrayerAzanNotification(data: PrayerAzanNotificationData): Promise<void> {
  await openPrayerAzanScreen({
    label: data.label ?? kk.prayer.azanScreenDefaultLabel,
    enteredTitle: data.enteredTitle,
    time: data.timeShort,
    salatKey: data.salatKey,
    soundId: (data.soundId as PrayerNotifSoundId | undefined) ?? "adhan_haramain",
    nativeAudio: Platform.OS === "ios" || Platform.OS === "android",
  });
}

export async function initPrayerNotificationTapRouting(): Promise<void> {
  if (Platform.OS === "web") return;
  const Notifications = await import("expo-notifications");

  const handle = (response: import("expo-notifications").NotificationResponse | null | undefined) => {
    const data = parsePrayerAzanData(response?.notification.request.content.data);
    if (!data) return;
    if (!rootNavigationRef.isReady()) {
      void routePrayerAzanNotification(data);
      return;
    }
    void routePrayerAzanNotification(data);
  };

  const last = await Notifications.getLastNotificationResponseAsync();
  handle(last);

  Notifications.addNotificationResponseReceivedListener((response) => {
    handle(response);
  });

  /** Қолданба ашық кезде: push көрсетпей, азан экранын бірден ашу. */
  Notifications.addNotificationReceivedListener((notification) => {
    const id = notification.request.identifier;
    const data = parsePrayerAzanData(notification.request.content.data);
    if (!data && !(id && isPrayerNotificationIdentifier(id))) return;
    if (data) {
      void routePrayerAzanNotification(data);
    }
    if (id) {
      void Notifications.dismissNotificationAsync(id).catch(() => {});
    }
  });
}
