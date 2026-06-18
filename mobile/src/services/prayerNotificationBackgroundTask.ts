import { Platform } from "react-native";

export const PRAYER_NOTIF_BG_TASK = "raqat-prayer-notif-reschedule-v1";

/** Вебте expo-task-manager жүктелмейді — тек native бандлда defineTask. */
if (Platform.OS !== "web") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const TaskManager = require("expo-task-manager") as typeof import("expo-task-manager");
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const BackgroundTask = require("expo-background-task") as typeof import("expo-background-task");
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const { reschedulePrayerNotificationsFromCache } = require("./prayerNotifications") as typeof import("./prayerNotifications");
  const { refreshPrayerCacheIfCalendarStale } = require("./prayerDaySelfHeal") as typeof import("./prayerDaySelfHeal");

  TaskManager.defineTask(PRAYER_NOTIF_BG_TASK, async () => {
    try {
      await refreshPrayerCacheIfCalendarStale();
      await reschedulePrayerNotificationsFromCache();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

/** Фонда кэш + намаз хабарламалары; OS WorkManager/BGTaskScheduler арқылы. */
export async function ensurePrayerNotificationBackgroundTask(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const BackgroundTask = await import("expo-background-task");
    const TaskManager = await import("expo-task-manager");
    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) {
      return;
    }
    const opts = {
      /** 1 сағ — жүйе рұқсат берсе, ұзақ уақыт қолданбаны ашпағанда да кесте/триггерлер жаңаруы мүмкін (OS қадағалауы). */
      minimumInterval: 60 * 60,
    } as const;
    const registered = await TaskManager.isTaskRegisteredAsync(PRAYER_NOTIF_BG_TASK);
    if (!registered) {
      await BackgroundTask.registerTaskAsync(PRAYER_NOTIF_BG_TASK, opts);
    }
  } catch {
    /* симулятор, рұқсат */
  }
}
