import AsyncStorage from "@react-native-async-storage/async-storage";
import type { OpenMeteoCurrent } from "../services/openMeteoCurrent";

const KEY = "raqat_weather_cache_v1";
/** Офлайн көрсету: 48 сағатқа дейін соңғы ауа райы. */
const DEFAULT_MAX_AGE_MS = 48 * 60 * 60 * 1000;

type WeatherCacheEntry = {
  lat: number;
  lon: number;
  snap: OpenMeteoCurrent;
  savedAt: string;
};

function coordKey(lat: number, lon: number): string {
  return `${lat.toFixed(3)}:${lon.toFixed(3)}`;
}

export async function saveWeatherCache(
  lat: number,
  lon: number,
  snap: OpenMeteoCurrent
): Promise<void> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const store: Record<string, WeatherCacheEntry> = raw ? JSON.parse(raw) : {};
    store[coordKey(lat, lon)] = {
      lat,
      lon,
      snap,
      savedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export async function loadWeatherCache(
  lat: number,
  lon: number,
  maxAgeMs = DEFAULT_MAX_AGE_MS
): Promise<OpenMeteoCurrent | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const store = JSON.parse(raw) as Record<string, WeatherCacheEntry>;
    const hit = store[coordKey(lat, lon)];
    if (!hit?.snap || !hit.savedAt) return null;
    if (Date.now() - Date.parse(hit.savedAt) > maxAgeMs) return null;
    return hit.snap;
  } catch {
    return null;
  }
}
