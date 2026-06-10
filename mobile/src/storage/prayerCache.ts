import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules, Platform } from "react-native";
import { APP_PRAYER_CALCULATION_METHOD, type PrayerTimesResult } from "../api/prayerTimes";
import { getCityApproxCoords, getKzPresetCoords } from "../constants/kzCities";
import { fetchOpenMeteoCurrent } from "../services/openMeteoCurrent";

const KEY = "raqat_prayer_cache_v1";

export type CachedPrayer = PrayerTimesResult & { savedAt: string; calculationMethod?: number };

async function buildAndroidWidgetPayload(payload: CachedPrayer): Promise<Record<string, unknown>> {
  const base: Record<string, unknown> = { ...payload };
  const coords =
    getKzPresetCoords(payload.city, payload.country) ?? getCityApproxCoords(payload.city);
  if (coords) {
    base.latitude = coords.lat;
    base.longitude = coords.lon;
    try {
      const w = await fetchOpenMeteoCurrent(coords.lat, coords.lon);
      if (w) {
        base.weatherTempC = w.tempC;
        base.weatherCode = w.wmoCode;
      }
    } catch {
      /* ауа райы болмағанда да координаттар виджетке кетеді */
    }
  }
  return base;
}

/** Android home widget: құбыла стрелкасы (heading) — қолданба ашық кезде. */
export function pushAndroidWidgetQiblaHeading(headingDeg: number): void {
  if (Platform.OS !== "android" || !Number.isFinite(headingDeg)) {
    return;
  }
  try {
    const PW = NativeModules as {
      PrayerWidget?: { setQiblaHeading?: (heading: number) => void };
    };
    PW.PrayerWidget?.setQiblaHeading?.(headingDeg);
  } catch {
    /* native модуль жоқ */
  }
}

async function pushAndroidPrayerWidgetIfNeeded(payload: CachedPrayer): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }
  try {
    const PW = (NativeModules as { PrayerWidget?: { setPayload: (json: string) => void } }).PrayerWidget;
    const enriched = await buildAndroidWidgetPayload(payload);
    PW?.setPayload(JSON.stringify(enriched));
  } catch {
    /* native модуль болмаған жобада — елемеу */
  }
}

export async function loadPrayerCache(): Promise<CachedPrayer | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as CachedPrayer;
    if (!j?.city || !j?.savedAt) return null;
    if (j.calculationMethod !== APP_PRAYER_CALCULATION_METHOD) return null;
    return j;
  } catch {
    return null;
  }
}

export async function savePrayerCache(data: PrayerTimesResult): Promise<void> {
  const payload: CachedPrayer = {
    ...data,
    calculationMethod: APP_PRAYER_CALCULATION_METHOD,
    savedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(payload));
  await pushAndroidPrayerWidgetIfNeeded(payload);
}

/** Қолданба ашылғанда / алдыңғы кэшті виджетке қайта жіберу (Android). */
export async function syncAndroidPrayerWidgetFromStorage(): Promise<void> {
  const c = await loadPrayerCache();
  if (c) {
    await pushAndroidPrayerWidgetIfNeeded(c);
  }
}
