import { Platform } from "react-native";

export const QURAN_AUDIO_BG_TASK = "raqat-quran-audio-download-v1";

if (Platform.OS !== "web") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const TaskManager = require("expo-task-manager") as typeof import("expo-task-manager");
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const BackgroundTask = require("expo-background-task") as typeof import("expo-background-task");
  const {
    resumeQuranAudioDownloadsInBackground,
  } = require("./quranAudioDownloadManager") as typeof import("./quranAudioDownloadManager");

  TaskManager.defineTask(QURAN_AUDIO_BG_TASK, async () => {
    try {
      await resumeQuranAudioDownloadsInBackground();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

export async function ensureQuranAudioBackgroundTask(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const BackgroundTask = await import("expo-background-task");
    const TaskManager = await import("expo-task-manager");
    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) return;
    const registered = await TaskManager.isTaskRegisteredAsync(QURAN_AUDIO_BG_TASK);
    if (!registered) {
      await BackgroundTask.registerTaskAsync(QURAN_AUDIO_BG_TASK, {
        minimumInterval: 60 * 60,
      });
    }
  } catch {
    /* OS/background task unavailable */
  }
}
