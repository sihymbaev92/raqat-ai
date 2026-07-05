import { Linking, NativeModules, Platform } from "react-native";
import { getNotifEnabled } from "../storage/prefs";
import {
  reschedulePrayerNotificationsFromCache,
  requestNotificationPermissions,
} from "./prayerNotifications";
import { getFullScreenAzanAlarmDiagnostics } from "./prayerFullScreenAzan";
import { ensureOemPowerSetupForAzan, getOemPowerDiagnostics } from "./prayerOemBatterySetup";

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
  batteryOptimizationIgnored: boolean;
  oemNeedsBackgroundSetup: boolean;
  openedExactAlarmScreen: boolean;
  openedFullScreenScreen: boolean;
  openedBatteryWhitelistScreen: boolean;
  openedOemBackgroundScreen: boolean;
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
  const [flags, oem] = await Promise.all([readAndroidAzanPermissionFlags(), getOemPowerDiagnostics()]);
  if (!flags.exactAlarmGranted || !flags.fullScreenIntentGranted) return false;
  if (oem.batteryOptimizationIgnored === false) return false;
  return true;
}

/**
 * Азан үшін барлық рұқсаттарды автоматты сұрайды:
 * 1) хабарлама
 * 2) дәл уақыт алармы (Android 12+)
 * 3) full-screen intent (Android 14+)
 * 4) батарея whitelist (Samsung/Xiaomi фон)
 * 5) OEM autostart / фон экраны
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
  let openedBatteryWhitelistScreen = false;
  let openedOemBackgroundScreen = false;
  let batteryOptimizationIgnored = true;
  let oemNeedsBackgroundSetup = false;

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

    const oem = await ensureOemPowerSetupForAzan({ openSystemScreens: true });
    batteryOptimizationIgnored = oem.batteryOptimizationIgnored;
    oemNeedsBackgroundSetup = oem.oemNeedsBackgroundSetup;
    openedBatteryWhitelistScreen = oem.openedBatteryWhitelistScreen;
    openedOemBackgroundScreen = oem.openedOemBackgroundScreen;
  } else if (Platform.OS === "android") {
    const oem = await getOemPowerDiagnostics();
    batteryOptimizationIgnored = oem.batteryOptimizationIgnored !== false;
    oemNeedsBackgroundSetup = oem.oemNeedsBackgroundSetup === true;
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
    batteryOptimizationIgnored,
    oemNeedsBackgroundSetup,
    openedExactAlarmScreen,
    openedFullScreenScreen,
    openedBatteryWhitelistScreen,
    openedOemBackgroundScreen,
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
    const [flags, oem] = await Promise.all([readAndroidAzanPermissionFlags(), getOemPowerDiagnostics()]);
    const N = await import("expo-notifications").catch(() => null);
    const notifStatus = N ? (await N.getPermissionsAsync()).status : "granted";
    if (
      notifStatus === "granted" &&
      flags.exactAlarmGranted &&
      flags.fullScreenIntentGranted &&
      oem.batteryOptimizationIgnored !== false
    ) {
      return;
    }
  }

  lastPermissionPromptAt = now;
  await ensurePrayerAzanPermissions({
    openAndroidSystemScreens: true,
    rescheduleAfter: true,
  });
}
