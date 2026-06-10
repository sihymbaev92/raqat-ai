import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DashboardNewsItem } from "../content/dashboardNewsItems";

const CACHE_KEY = "raqat_official_home_feed_v1";
/** Күніне 2 рет жаңарту — 12 сағат кэш. */
export const OFFICIAL_HOME_FEED_TTL_MS = 12 * 60 * 60 * 1000;

type Payload = {
  syncedAt: string;
  items: DashboardNewsItem[];
};

export function officialHomeFeedCacheAgeMs(syncedAt: string): number | null {
  const age = Date.now() - new Date(syncedAt).getTime();
  return Number.isFinite(age) ? age : null;
}

export async function readOfficialHomeFeedCache(): Promise<DashboardNewsItem[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as Payload;
    if (!j?.items?.length || !j.syncedAt) return null;
    const age = officialHomeFeedCacheAgeMs(j.syncedAt);
    if (age == null || age > OFFICIAL_HOME_FEED_TTL_MS) return null;
    return j.items;
  } catch {
    return null;
  }
}

export async function writeOfficialHomeFeedCache(items: DashboardNewsItem[]): Promise<void> {
  if (!items.length) return;
  try {
    const payload: Payload = { syncedAt: new Date().toISOString(), items };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* сақталмады */
  }
}
