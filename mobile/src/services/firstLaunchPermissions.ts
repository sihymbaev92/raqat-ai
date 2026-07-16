import { Platform } from "react-native";
import * as Location from "expo-location";
import { Camera } from "expo-camera";
import { ensurePrayerAzanPermissions } from "./prayerAzanPermissions";
import { requestNotificationPermissions } from "./prayerNotifications";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type FirstLaunchPermissionBurstResult = {
  notifications: boolean;
  location: boolean;
  camera: boolean;
  azan: Awaited<ReturnType<typeof ensurePrayerAzanPermissions>> | null;
};

/**
 * Орнатқаннан кейінгі бірінші ашылу — баптауға кірмей,
 * барлық негізгі рұқсаттарды бірден рет-ретімен сұрайды:
 * 1) хабарлама
 * 2) орын (намаз уақыты / мешіт)
 * 3) камера (халал сканер)
 * 4) азан: батарея + exact alarm + full-screen + OEM фон
 */
export async function requestAllCorePermissionsOnFirstLaunch(): Promise<FirstLaunchPermissionBurstResult> {
  if (Platform.OS === "web") {
    return { notifications: false, location: false, camera: false, azan: null };
  }

  let notifications = false;
  let location = false;
  let camera = false;

  try {
    notifications = await requestNotificationPermissions();
  } catch {
    /* expo-notifications */
  }
  await sleep(350);

  try {
    const fg = await Location.getForegroundPermissionsAsync();
    if (fg.granted) {
      location = true;
    } else {
      const asked = await Location.requestForegroundPermissionsAsync();
      location = asked.granted;
    }
  } catch {
    /* expo-location */
  }
  await sleep(350);

  try {
    const cam = await Camera.getCameraPermissionsAsync();
    if (cam.granted) {
      camera = true;
    } else {
      const asked = await Camera.requestCameraPermissionsAsync();
      camera = asked.granted;
    }
  } catch {
    /* expo-camera болмауы мүмкін */
  }
  await sleep(400);

  let azan: FirstLaunchPermissionBurstResult["azan"] = null;
  try {
    azan = await ensurePrayerAzanPermissions({
      openAndroidSystemScreens: true,
      rescheduleAfter: true,
      openAppSettingsOnDenied: false,
    });
  } catch {
    /* native / notifications */
  }

  return { notifications, location, camera, azan };
}
