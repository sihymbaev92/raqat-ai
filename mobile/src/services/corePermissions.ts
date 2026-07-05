import { Linking, NativeModules, Platform } from "react-native";
import * as Location from "expo-location";
import {
  getFullScreenAzanAlarmDiagnostics,
  requestNotificationPermissions,
  reschedulePrayerNotificationsFromCache,
} from "./prayerNotifications";
import {
  setFirstLaunchPermissionsBurstDone,
  setOnboardingDone,
  setNotifEnabled,
} from "../storage/prefs";

export type CorePermissionStep =
  | "location"
  | "notifications"
  | "exactAlarm"
  | "fullScreenIntent"
  | "battery";

export type CorePermissionSnapshot = {
  locationGranted: boolean;
  notificationsGranted: boolean;
  exactAlarmGranted: boolean;
  fullScreenIntentGranted: boolean;
  batteryOptimizationIgnored: boolean;
  missing: CorePermissionStep[];
  allSatisfied: boolean;
};

type PrayerWidgetPermModule = {
  requestExactAlarmPermissionIfNeeded?: () => Promise<boolean>;
  requestFullScreenIntentPermissionIfNeeded?: () => Promise<boolean>;
  isBatteryOptimizationIgnored?: () => Promise<boolean>;
  requestBatteryOptimizationIfNeeded?: () => Promise<boolean>;
};

function prayerWidgetModule(): PrayerWidgetPermModule | undefined {
  return NativeModules.PrayerWidget as PrayerWidgetPermModule | undefined;
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

async function readBatteryOptimizationIgnored(): Promise<boolean> {
  if (Platform.OS !== "android" || Number(Platform.Version) < 23) return true;
  const mod = prayerWidgetModule();
  if (typeof mod?.isBatteryOptimizationIgnored !== "function") return true;
  try {
    return Boolean(await mod.isBatteryOptimizationIgnored());
  } catch {
    return false;
  }
}

async function readLocationGranted(): Promise<boolean> {
  if (Platform.OS === "web") return true;
  try {
    const fg = await Location.getForegroundPermissionsAsync();
    return fg.granted;
  } catch {
    return false;
  }
}

async function readNotificationsGranted(): Promise<boolean> {
  if (Platform.OS === "web") return true;
  const N = await import("expo-notifications").catch(() => null);
  if (!N) return false;
  const { status } = await N.getPermissionsAsync();
  return status === "granted";
}

export async function getCorePermissionSnapshot(): Promise<CorePermissionSnapshot> {
  if (Platform.OS === "web") {
    return {
      locationGranted: true,
      notificationsGranted: true,
      exactAlarmGranted: true,
      fullScreenIntentGranted: true,
      batteryOptimizationIgnored: true,
      missing: [],
      allSatisfied: true,
    };
  }

  const locationGranted = await readLocationGranted();
  const notificationsGranted = await readNotificationsGranted();

  let exactAlarmGranted = true;
  let fullScreenIntentGranted = true;
  let batteryOptimizationIgnored = true;

  if (Platform.OS === "android") {
    const flags = await readAndroidAzanPermissionFlags();
    exactAlarmGranted = flags.exactAlarmGranted;
    fullScreenIntentGranted = flags.fullScreenIntentGranted;
    batteryOptimizationIgnored = await readBatteryOptimizationIgnored();
  }

  const missing: CorePermissionStep[] = [];
  if (!locationGranted) missing.push("location");
  if (!notificationsGranted) missing.push("notifications");
  if (Platform.OS === "android") {
    if (!exactAlarmGranted) missing.push("exactAlarm");
    if (!fullScreenIntentGranted) missing.push("fullScreenIntent");
    if (!batteryOptimizationIgnored) missing.push("battery");
  }

  return {
    locationGranted,
    notificationsGranted,
    exactAlarmGranted,
    fullScreenIntentGranted,
    batteryOptimizationIgnored,
    missing,
    allSatisfied: missing.length === 0,
  };
}

export async function areCorePermissionsSatisfied(): Promise<boolean> {
  return (await getCorePermissionSnapshot()).allSatisfied;
}

/** Келесі жоқ рұқсатты бір рет сұрайды (жүйелік диалог немесе баптаулар). */
export async function requestNextCorePermission(): Promise<CorePermissionStep | "done"> {
  const snap = await getCorePermissionSnapshot();
  if (snap.allSatisfied) return "done";

  const step = snap.missing[0];

  switch (step) {
    case "location":
      try {
        const fg = await Location.getForegroundPermissionsAsync();
        if (fg.canAskAgain) {
          await Location.requestForegroundPermissionsAsync();
        } else {
          await Linking.openSettings();
        }
      } catch {
        try {
          await Linking.openSettings();
        } catch {
          /* */
        }
      }
      break;
    case "notifications": {
      await requestNotificationPermissions();
      const granted = await readNotificationsGranted();
      if (!granted) {
        try {
          await Linking.openSettings();
        } catch {
          /* */
        }
      }
      break;
    }
    case "exactAlarm":
      try {
        await prayerWidgetModule()?.requestExactAlarmPermissionIfNeeded?.();
      } catch {
        /* */
      }
      break;
    case "fullScreenIntent":
      try {
        await prayerWidgetModule()?.requestFullScreenIntentPermissionIfNeeded?.();
      } catch {
        /* */
      }
      break;
    case "battery":
      try {
        await prayerWidgetModule()?.requestBatteryOptimizationIfNeeded?.();
      } catch {
        /* */
      }
      break;
  }

  return step;
}

/** Барлық рұқсаттар берілгеннен кейін — бір реттік дайындық. */
export async function onCorePermissionsGranted(): Promise<void> {
  await Promise.all([setOnboardingDone(), setFirstLaunchPermissionsBurstDone(), setNotifEnabled(true)]);
  try {
    await reschedulePrayerNotificationsFromCache();
  } catch {
    /* */
  }
}
