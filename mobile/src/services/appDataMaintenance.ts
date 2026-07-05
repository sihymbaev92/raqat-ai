import { Linking, NativeModules, Platform } from "react-native";
import { invalidateHalalDamuAllCaches } from "../api/halalDamuWp";
import { clearOfficialSiteWebCache } from "../components/officialSiteWebViewReload";

type AppMaintenanceModule = {
  openAppStorageSettings?: () => Promise<boolean>;
};

function maintenanceModule(): AppMaintenanceModule | undefined {
  return NativeModules.PrayerWidget as AppMaintenanceModule | undefined;
}

/** Android: Параметрлер → Қолданбалар → RAHAT OMIR → Storage (толық clear data). */
export async function openAndroidAppStorageSettings(): Promise<boolean> {
  if (Platform.OS === "android") {
    return (await maintenanceModule()?.openAppStorageSettings?.()) === true;
  }
  await Linking.openSettings();
  return true;
}

export async function clearWebViewDiskCache(): Promise<void> {
  await clearOfficialSiteWebCache();
}

export async function clearHalalNetworkCaches(): Promise<void> {
  await invalidateHalalDamuAllCaches();
}

export async function clearSelectableAppCaches(): Promise<void> {
  await Promise.allSettled([clearWebViewDiskCache(), clearHalalNetworkCaches()]);
}
