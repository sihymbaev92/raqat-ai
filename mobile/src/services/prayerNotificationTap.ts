import { Platform } from "react-native";
import { rootNavigationRef } from "../navigation/rootNavigationRef";
import type { PrayerNotifSoundId } from "../storage/prefs";
import { openPrayerAzanScreen } from "./prayerFullScreenAzan";

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

async function routePrayerAzanNotification(data: PrayerAzanNotificationData): Promise<void> {
  await openPrayerAzanScreen({
    label: data.label,
    enteredTitle: data.enteredTitle,
    time: data.timeShort,
    salatKey: data.salatKey,
    soundId: (data.soundId as PrayerNotifSoundId | undefined) ?? undefined,
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
}
