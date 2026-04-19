import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PrayerTimesResult } from "../api/prayerTimes";

const KEY = "raqat_prayer_cache_v1";

export type CachedPrayer = PrayerTimesResult & { savedAt: string };

export async function loadPrayerCache(): Promise<CachedPrayer | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as CachedPrayer;
    if (!j?.city || !j?.savedAt) return null;
    return j;
  } catch {
    return null;
  }
}

export async function savePrayerCache(data: PrayerTimesResult): Promise<void> {
  const payload: CachedPrayer = {
    ...data,
    savedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(payload));
}
