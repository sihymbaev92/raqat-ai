import { Platform } from "react-native";
import * as Location from "expo-location";
import { requestNotificationPermissions } from "./prayerNotifications";

/**
 * Алғашқы ашылғанда бір рет: мекенжай/құбыла (орын), намаз хабарламалары.
 * Жүйелік терезелер қатарынан шығады — қайта сұрау prefs кілті арқылы шектеледі.
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
    await requestNotificationPermissions();
  } catch {
    /* expo-notifications */
  }
}
