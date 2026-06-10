import { Platform } from "react-native";

export const PRAYER_NOTIF_BG_FETCH_TASK = "raqat-prayer-notif-reschedule-v1";

/** Вебте expo-task-manager жүктелмейді — тек native бандлда defineTask. */
if (Platform.OS !== "web") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const TaskManager = require("expo-task-manager") as typeof import("expo-task-manager");
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const BackgroundFetch = require("expo-background-fetch") as typeof import("expo-background-fetch");
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const { reschedulePrayerNotificationsFromCache } = require("./prayerNotifications") as typeof import("./prayerNotifications");
  const { refreshPrayerCacheIfCalendarStale } = require("./prayerDaySelfHeal") as typeof import("./prayerDaySelfHeal");

  TaskManager.defineTask(PRAYER_NOTIF_BG_FETCH_TASK, async () => {
    try {
      await refreshPrayerCacheIfCalendarStale();
      await reschedulePrayerNotificationsFromCache();
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
}

/** Фонда кэш + намаз хабарламалары; boot кейін де (stopOnTerminate: false). */
export async function ensurePrayerNotificationBackgroundFetch(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const BackgroundFetch = await import("expo-background-fetch");
    const TaskManager = await import("expo-task-manager");
    const status = await BackgroundFetch.getStatusAsync();
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Denied ||
      status === BackgroundFetch.BackgroundFetchStatus.Restricted
    ) {
      return;
    }
    const opts = {
      /** 1 сағ — жүйе рұқсат берсе, ұзақ уақыт қолданбаны ашпағанда да кесте/триггерлер жаңаруы мүмкін (OS қадағалауы). */
      minimumInterval: 60 * 60,
      startOnBoot: true,
      stopOnTerminate: false,
    } as const;
    const registered = await TaskManager.isTaskRegisteredAsync(PRAYER_NOTIF_BG_FETCH_TASK);
    if (!registered) {
      await BackgroundFetch.registerTaskAsync(PRAYER_NOTIF_BG_FETCH_TASK, opts);
    }
  } catch {
    /* симулятор, рұқсат */
  }
}

/** @deprecated ensurePrayerNotificationBackgroundFetch қолданыңыз */
export const registerPrayerNotificationBackgroundFetch = ensurePrayerNotificationBackgroundFetch;
