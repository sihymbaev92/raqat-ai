import { Linking, NativeModules, Platform } from "react-native";
import { getNotifEnabled } from "../storage/prefs";
import {
  getFullScreenAzanAlarmDiagnostics,
  requestNotificationPermissions,
  reschedulePrayerNotificationsFromCache,
} from "./prayerNotifications";

type PrayerWidgetAzanPermModule = {
  requestExactAlarmPermissionIfNeeded?: () => Promise<boolean>;
  requestFullScreenIntentPermissionIfNeeded?: () => Promise<boolean>;
};

function prayerWidgetModule(): PrayerWidgetAzanPermModule | undefined {
  return NativeModules.PrayerWidget as PrayerWidgetAzanPermModule | undefined;
}

const PERMISSION_PROMPT_COOLDOWN_MS = 10_000;

export type PrayerAzanPermissionStatus = {
  notificationsGranted: boolean;
  exactAlarmGranted: boolean;
  fullScreenIntentGranted: boolean;
  openedExactAlarmScreen: boolean;
  openedFullScreenScreen: boolean;
};

let lastPermissionPromptAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readAndroidAzanPermissionFlags(): Promise<{
  exactAlarmGranted: boolean;
  fullScreenIntentGranted: boolean;
}> {
  const diag = await getFullScreenAzanAlarmDiagnostics();
  return {
    exactAlarmGranted: diag.exactAlarmPermissionGranted !== false,
    fullScreenIntentGranted: diag.fullScreenIntentPermissionGranted !== false,
  };
}

export async function arePrayerAzanPermissionsSatisfied(): Promise<boolean> {
  if (Platform.OS === "web") return true;
  const N = await import("expo-notifications").catch(() => null);
  if (!N) return false;
  const { status } = await N.getPermissionsAsync();
  if (status !== "granted") return false;
  if (Platform.OS !== "android") return true;
  const flags = await readAndroidAzanPermissionFlags();
  return flags.exactAlarmGranted && flags.fullScreenIntentGranted;
}

/**
 * Азан үшін барлық рұқсаттарды автоматты сұрайды:
 * 1) хабарлама (жүйелік диалог)
 * 2) дәл уақыт алармы (Android 12+ жүйе экраны)
 * 3) full-screen intent (Android 14+ жүйе экраны)
 */
export async function ensurePrayerAzanPermissions(opts?: {
  openAndroidSystemScreens?: boolean;
  rescheduleAfter?: boolean;
}): Promise<PrayerAzanPermissionStatus> {
  const openAndroidSystemScreens = opts?.openAndroidSystemScreens !== false;
  const rescheduleAfter = opts?.rescheduleAfter !== false;

  const notificationsGranted = await requestNotificationPermissions();
  let { exactAlarmGranted, fullScreenIntentGranted } =
    Platform.OS === "android"
      ? await readAndroidAzanPermissionFlags()
      : { exactAlarmGranted: true, fullScreenIntentGranted: true };

  let openedExactAlarmScreen = false;
  let openedFullScreenScreen = false;

  if (Platform.OS === "android" && openAndroidSystemScreens) {
    if (!exactAlarmGranted && typeof prayerWidgetModule()?.requestExactAlarmPermissionIfNeeded === "function") {
      try {
        openedExactAlarmScreen = Boolean(await prayerWidgetModule()!.requestExactAlarmPermissionIfNeeded!());
        if (openedExactAlarmScreen) await sleep(600);
      } catch {
        /* жүйе экраны ашылмады */
      }
      exactAlarmGranted = (await readAndroidAzanPermissionFlags()).exactAlarmGranted;
    }

    if (
      !fullScreenIntentGranted &&
      typeof prayerWidgetModule()?.requestFullScreenIntentPermissionIfNeeded === "function"
    ) {
      try {
        openedFullScreenScreen = Boolean(await prayerWidgetModule()!.requestFullScreenIntentPermissionIfNeeded!());
        if (openedFullScreenScreen) await sleep(400);
      } catch {
        /* жүйе экраны ашылмады */
      }
      fullScreenIntentGranted = (await readAndroidAzanPermissionFlags()).fullScreenIntentGranted;
    }
  }

  if (!notificationsGranted && Platform.OS === "android") {
    try {
      await Linking.openSettings();
    } catch {
      /* */
    }
  }

  if (rescheduleAfter && (await getNotifEnabled())) {
    await reschedulePrayerNotificationsFromCache();
  }

  return {
    notificationsGranted,
    exactAlarmGranted,
    fullScreenIntentGranted,
    openedExactAlarmScreen,
    openedFullScreenScreen,
  };
}

export function resetPrayerAzanPermissionPromptCooldown(): void {
  lastPermissionPromptAt = 0;
}

/** Қолданба алға шыққанда — жоқ рұқсаттарды қайта сұрау (10 сек cooldown). */
export async function ensurePrayerAzanPermissionsOnAppActive(): Promise<void> {
  if (Platform.OS === "web") return;
  if (!(await getNotifEnabled())) return;

  const now = Date.now();
  if (now - lastPermissionPromptAt < PERMISSION_PROMPT_COOLDOWN_MS) return;

  if (Platform.OS === "android") {
    const flags = await readAndroidAzanPermissionFlags();
    const N = await import("expo-notifications").catch(() => null);
    const notifStatus = N ? (await N.getPermissionsAsync()).status : "granted";
    if (notifStatus === "granted" && flags.exactAlarmGranted && flags.fullScreenIntentGranted) {
      return;
    }
  }

  lastPermissionPromptAt = now;
  await ensurePrayerAzanPermissions({
    openAndroidSystemScreens: true,
    rescheduleAfter: true,
  });
}
