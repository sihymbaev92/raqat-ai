import { Linking, NativeModules, Platform } from "react-native";
import { getNotifEnabled } from "../storage/prefs";
import {
  reschedulePrayerNotificationsFromCache,
  requestNotificationPermissions,
  openAndroidFullScreenIntentSettings,
} from "./prayerNotifications";
import { getFullScreenAzanAlarmDiagnostics } from "./prayerFullScreenAzan";
import { ensureOemPowerSetupForAzan, getOemPowerDiagnostics } from "./prayerOemBatterySetup";

type PrayerWidgetAzanPermModule = {
  requestExactAlarmPermissionIfNeeded?: () => Promise<boolean>;
  requestAlarmKitAuthorization?: () => Promise<{ authorized?: boolean; state?: string }>;
};

function prayerWidgetModule(): PrayerWidgetAzanPermModule | undefined {
  return NativeModules.PrayerWidget as PrayerWidgetAzanPermModule | undefined;
}

function isIosAlarmKitAvailable(): boolean {
  return Platform.OS === "ios" && Number.parseFloat(String(Platform.Version)) >= 26;
}

async function requestIosAlarmKitAuthorization(): Promise<boolean> {
  if (!isIosAlarmKitAvailable()) return true;
  const request = prayerWidgetModule()?.requestAlarmKitAuthorization;
  if (typeof request !== "function") return true;
  try {
    const result = await request();
    return result?.authorized === true;
  } catch {
    return false;
  }
}

const PERMISSION_PROMPT_COOLDOWN_MS = 10_000;

export type PrayerAzanPermissionStatus = {
  notificationsGranted: boolean;
  exactAlarmGranted: boolean;
  fullScreenIntentAllowed: boolean;
  batteryOptimizationIgnored: boolean;
  oemNeedsBackgroundSetup: boolean;
  openedExactAlarmScreen: boolean;
  openedFullScreenIntentScreen: boolean;
  openedBatteryWhitelistScreen: boolean;
  openedOemBackgroundScreen: boolean;
};

let lastPermissionPromptAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readAndroidAzanPermissionFlags(): Promise<{
  exactAlarmGranted: boolean;
  fullScreenIntentAllowed: boolean;
}> {
  const diag = await getFullScreenAzanAlarmDiagnostics();
  return {
    exactAlarmGranted: diag.exactAlarmPermissionGranted !== false,
    fullScreenIntentAllowed:
      Platform.OS !== "android" ||
      Number(Platform.Version) < 34 ||
      diag.fullScreenIntentAllowed !== false,
  };
}

export async function arePrayerAzanPermissionsSatisfied(): Promise<boolean> {
  if (Platform.OS === "web") return true;
  const N = await import("expo-notifications").catch(() => null);
  if (!N) return false;
  const { status } = await N.getPermissionsAsync();
  if (status !== "granted") return false;
  if (Platform.OS === "ios") {
    if (!isIosAlarmKitAvailable()) return true;
    const diag = await getFullScreenAzanAlarmDiagnostics();
    return diag.exactAlarmPermissionGranted !== false;
  }
  if (Platform.OS !== "android") return true;
  const [flags, oem] = await Promise.all([readAndroidAzanPermissionFlags(), getOemPowerDiagnostics()]);
  if (!flags.exactAlarmGranted) return false;
  if (!flags.fullScreenIntentAllowed) return false;
  if (oem.batteryOptimizationIgnored === false) return false;
  return true;
}

/**
 * Азан үшін барлық рұқсаттарды автоматты сұрайды (баптауға қолмен кірмей):
 * 1) хабарлама
 * 2) дәл уақыт алармы (Android 12+)
 * 3) full-screen intent (Android 14+ — құлып экраны)
 * 4) батарея whitelist диалогы
 * 5) OEM autostart / фон экраны
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
  let { exactAlarmGranted, fullScreenIntentAllowed } =
    Platform.OS === "android"
      ? await readAndroidAzanPermissionFlags()
      : { exactAlarmGranted: true, fullScreenIntentAllowed: true };

  let openedExactAlarmScreen = false;
  let openedFullScreenIntentScreen = false;
  let openedBatteryWhitelistScreen = false;
  let openedOemBackgroundScreen = false;
  let batteryOptimizationIgnored = true;
  let oemNeedsBackgroundSetup = false;

  if (Platform.OS === "ios") {
    exactAlarmGranted = await requestIosAlarmKitAuthorization();
    if (!exactAlarmGranted && openAppSettingsOnDenied) {
      try {
        await Linking.openSettings();
        openedExactAlarmScreen = true;
      } catch {
        /* */
      }
    }
  } else if (Platform.OS === "android" && openAndroidSystemScreens) {
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

    if (!fullScreenIntentAllowed && Number(Platform.Version) >= 34) {
      try {
        await openAndroidFullScreenIntentSettings();
        openedFullScreenIntentScreen = true;
        await sleep(800);
      } catch {
        /* */
      }
      fullScreenIntentAllowed = (await readAndroidAzanPermissionFlags()).fullScreenIntentAllowed;
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

  if (
    !notificationsGranted &&
    openAppSettingsOnDenied &&
    (Platform.OS === "android" || Platform.OS === "ios")
  ) {
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
    fullScreenIntentAllowed,
    batteryOptimizationIgnored,
    oemNeedsBackgroundSetup,
    openedExactAlarmScreen,
    openedFullScreenIntentScreen,
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

  /** Азан құлып экранында тұрса — жүйелік рұқсат парағын ашпау (PIN/баптау үстіне шықпасын). */
  if (Platform.OS === "android" || Platform.OS === "ios") {
    try {
      const { ensurePrayerAzanShouldBypassOnboarding, isNativeAzanSessionActive } = await import(
        "./prayerFullScreenAzan"
      );
      if ((await isNativeAzanSessionActive()) || (await ensurePrayerAzanShouldBypassOnboarding())) {
        return;
      }
    } catch {
      /* continue */
    }
  }

  const now = Date.now();
  if (now - lastPermissionPromptAt < PERMISSION_PROMPT_COOLDOWN_MS) return;

  if (Platform.OS === "android") {
    const [flags, oem] = await Promise.all([readAndroidAzanPermissionFlags(), getOemPowerDiagnostics()]);
    const N = await import("expo-notifications").catch(() => null);
    const notifStatus = N ? (await N.getPermissionsAsync()).status : "granted";
    if (
      notifStatus === "granted" &&
      flags.exactAlarmGranted &&
      flags.fullScreenIntentAllowed &&
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
