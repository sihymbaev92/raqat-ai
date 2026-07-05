import { Platform } from "react-native";
import { getFullScreenAzanAlarmDiagnostics } from "./prayerFullScreenAzan";
import { getOemPowerDiagnostics } from "./prayerOemBatterySetup";

export type PrayerAzanReliabilityBlocker =
  | "exact_alarm"
  | "full_screen_intent"
  | "battery_optimization"
  | "notifications";

export type PrayerAzanReliabilityStatus = {
  reliable: boolean;
  blockers: PrayerAzanReliabilityBlocker[];
  exactAlarmGranted: boolean | null;
  fullScreenIntentGranted: boolean | null;
  batteryOptimizationIgnored: boolean | null;
};

/** Locked-screen azan + нақты namaz уақыты — барлық рұқсаттар live тексеріледі. */
export async function getPrayerAzanReliabilityStatus(): Promise<PrayerAzanReliabilityStatus> {
  if (Platform.OS !== "android") {
    return {
      reliable: true,
      blockers: [],
      exactAlarmGranted: null,
      fullScreenIntentGranted: null,
      batteryOptimizationIgnored: null,
    };
  }

  const N = await import("expo-notifications").catch(() => null);
  const notifStatus = N ? (await N.getPermissionsAsync()).status : "granted";
  const [azan, oem] = await Promise.all([getFullScreenAzanAlarmDiagnostics(), getOemPowerDiagnostics()]);

  const blockers: PrayerAzanReliabilityBlocker[] = [];
  if (notifStatus !== "granted") blockers.push("notifications");
  if (Number(Platform.Version) >= 31 && azan.exactAlarmPermissionGranted === false) {
    blockers.push("exact_alarm");
  }
  if (Number(Platform.Version) >= 34 && azan.fullScreenIntentPermissionGranted === false) {
    blockers.push("full_screen_intent");
  }
  if (oem.batteryOptimizationIgnored === false) blockers.push("battery_optimization");

  return {
    reliable: blockers.length === 0,
    blockers,
    exactAlarmGranted: azan.exactAlarmPermissionGranted,
    fullScreenIntentGranted: azan.fullScreenIntentPermissionGranted,
    batteryOptimizationIgnored: oem.batteryOptimizationIgnored,
  };
}

export async function ensurePrayerAzanReliabilityBeforeSchedule(): Promise<PrayerAzanReliabilityStatus> {
  const status = await getPrayerAzanReliabilityStatus();
  if (status.reliable) return status;
  const { ensurePrayerAzanPermissions } = await import("./prayerAzanPermissions");
  await ensurePrayerAzanPermissions({ openAndroidSystemScreens: true, rescheduleAfter: false });
  return getPrayerAzanReliabilityStatus();
}
