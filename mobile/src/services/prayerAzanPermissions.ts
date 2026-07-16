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
};

function prayerWidgetModule(): PrayerWidgetAzanPermModule | undefined {
  return NativeModules.PrayerWidget as PrayerWidgetAzanPermModule | undefined;
}

const PERMISSION_PROMPT_COOLDOWN_MS = 10_000;

export type PrayerAzanPermissionStatus = {
  notificationsGranted: boolean;
  exactAlarmGranted: boolean;
  batteryOptimizationIgnored: boolean;
  oemNeedsBackgroundSetup: boolean;
  openedExactAlarmScreen: boolean;
  openedBatteryWhitelistScreen: boolean;
  openedOemBackgroundScreen: boolean;
};

let lastPermissionPromptAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readAndroidAzanPermissionFlags(): Promise<{
  exactAlarmGranted: boolean;
}> {
  const diag = await getFullScreenAzanAlarmDiagnostics();
  return {
    exactAlarmGranted: diag.exactAlarmPermissionGranted !== false,
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
  if (!flags.exactAlarmGranted) return false;
  if (oem.batteryOptimizationIgnored === false) return false;
  return true;
}

/**
 * Азан үшін барлық рұқсаттарды автоматты сұрайды (баптауға қолмен кірмей):
 * 1) хабарлама
 * 2) дәл уақыт алармы (Android 12+)
 * 3) батарея whitelist диалогы
 * 4) OEM autostart / фон экраны
 */
export async function ensurePrayerAzanPermissions(opts?: {
  openAndroidSystemScreens?: boolean;
  rescheduleAfter?: boolean;
  /** Хабарлама қабылданбаса жүйелік app settings ашу (бірінші іске қосуда false). */
  openAppSettingsOnDenied?: boolean;
}): Promise<PrayerAzanPermissionStatus> {
  const openAndroidSystemScreens = opts?.openAndroidSystemScreens !== false;
  const rescheduleAfter = opts?.rescheduleAfter !== false;
  const openAppSettingsOnDenied = opts?.openAppSettingsOnDenied === true;

  const notificationsGranted = await requestNotificationPermissions();
  let { exactAlarmGranted } =
    Platform.OS === "android"
      ? await readAndroidAzanPermissionFlags()
      : { exactAlarmGranted: true };

  let openedExactAlarmScreen = false;
  let openedBatteryWhitelistScreen = false;
  let openedOemBackgroundScreen = false;
  let batteryOptimizationIgnored = true;
  let oemNeedsBackgroundSetup = false;

  if (Platform.OS === "android" && openAndroidSystemScreens) {
    const oemFirst = await ensureOemPowerSetupForAzan({
      openSystemScreens: true,
      forceBatteryPrompt: true,
    });
    batteryOptimizationIgnored = oemFirst.batteryOptimizationIgnored;
    oemNeedsBackgroundSetup = oemFirst.oemNeedsBackgroundSetup;
    openedBatteryWhitelistScreen = oemFirst.openedBatteryWhitelistScreen;
    openedOemBackgroundScreen = oemFirst.openedOemBackgroundScreen;
    if (openedBatteryWhitelistScreen) await sleep(700);

    if (!exactAlarmGranted && typeof prayerWidgetModule()?.requestExactAlarmPermissionIfNeeded === "function") {
      try {
        openedExactAlarmScreen = Boolean(await prayerWidgetModule()!.requestExactAlarmPermissionIfNeeded!());
        if (openedExactAlarmScreen) await sleep(800);
      } catch {
        /* жүйе экраны ашылмады */
      }
      exactAlarmGranted = (await readAndroidAzanPermissionFlags()).exactAlarmGranted;
    }

    if (!openedOemBackgroundScreen) {
      const oem = await ensureOemPowerSetupForAzan({ openSystemScreens: true, forceBatteryPrompt: false });
      batteryOptimizationIgnored = oem.batteryOptimizationIgnored;
      oemNeedsBackgroundSetup = oem.oemNeedsBackgroundSetup;
      openedBatteryWhitelistScreen = openedBatteryWhitelistScreen || oem.openedBatteryWhitelistScreen;
      openedOemBackgroundScreen = oem.openedOemBackgroundScreen;
    }
  } else if (Platform.OS === "android") {
    const oem = await getOemPowerDiagnostics();
    batteryOptimizationIgnored = oem.batteryOptimizationIgnored !== false;
    oemNeedsBackgroundSetup = oem.oemNeedsBackgroundSetup === true;
  }

  if (!notificationsGranted && openAppSettingsOnDenied && Platform.OS === "android") {
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
    batteryOptimizationIgnored,
    oemNeedsBackgroundSetup,
    openedExactAlarmScreen,
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
    if (notifStatus === "granted" && flags.exactAlarmGranted && oem.batteryOptimizationIgnored !== false) {
      return;
    }
  }

  lastPermissionPromptAt = now;
  await ensurePrayerAzanPermissions({
    openAndroidSystemScreens: true,
    rescheduleAfter: true,
  });
}
