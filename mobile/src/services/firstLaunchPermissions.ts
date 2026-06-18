import { Platform } from "react-native";
import * as Location from "expo-location";
import { ensurePrayerAzanPermissions } from "./prayerAzanPermissions";

/**
 * Алғашқы ашылғанда бір рет: орын + азан рұқсаттары (хабарлама, дәл аларм, full-screen).
 */
export async function requestAllCorePermissionsOnFirstLaunch(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const fg = await Location.getForegroundPermissionsAsync();
    if (!fg.granted) {
      await Location.requestForegroundPermissionsAsync();
    }
  } catch {
    /* expo-location болмауы мүмкін */
  }

  try {
    await ensurePrayerAzanPermissions({
      openAndroidSystemScreens: true,
      rescheduleAfter: false,
    });
  } catch {
    /* expo-notifications / native */
  }
}
