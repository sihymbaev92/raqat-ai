import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules, Platform } from "react-native";
import {
  APP_PRAYER_ASR_SCHOOL,
  APP_PRAYER_CALCULATION_METHOD,
  type PrayerTimesResult,
} from "../api/prayerTimes";
import { getCityApproxCoords, getKzPresetCoords } from "../constants/kzCities";
import { fetchOpenMeteoCurrent } from "../services/openMeteoCurrent";

const KEY = "raqat_prayer_cache_v2";

export type CachedPrayer = PrayerTimesResult & {
  savedAt: string;
  calculationMethod?: number;
  calculationSchool?: number;
};

function isKazakhstanPrayerCountry(country: string): boolean {
  const t = (country ?? "").trim().toLowerCase();
  if (!t) return true;
  return t === "kazakhstan" || t === "қазақстан" || t === "казахстан" || t === "kz";
}

function cachedPrayerCoords(payload: PrayerTimesResult): { lat: number; lon: number } | null {
  if (Number.isFinite(payload.latitude) && Number.isFinite(payload.longitude)) {
    return { lat: payload.latitude as number, lon: payload.longitude as number };
  }
  return getKzPresetCoords(payload.city, payload.country) ?? getCityApproxCoords(payload.city);
}

async function buildWidgetPayload(payload: CachedPrayer): Promise<Record<string, unknown>> {
  const base: Record<string, unknown> = { ...payload };
  const coords = cachedPrayerCoords(payload);
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
      /* optional weather */
    }
  }
  return base;
}

type PrayerWidgetNative = {
  setQiblaHeading?: (heading: number) => void;
  setPayload?: (json: string) => void;
};

function prayerWidgetNative(): PrayerWidgetNative | undefined {
  return (NativeModules as { PrayerWidget?: PrayerWidgetNative }).PrayerWidget;
}

/** Native home widget: Android + iOS (App Group / WidgetKit). */
export function pushNativeWidgetQiblaHeading(headingDeg: number): void {
  if (Platform.OS === "web" || !Number.isFinite(headingDeg)) return;
  try {
    prayerWidgetNative()?.setQiblaHeading?.(headingDeg);
  } catch {
    /* native module missing */
  }
}

/** @deprecated use pushNativeWidgetQiblaHeading */
export const pushAndroidWidgetQiblaHeading = pushNativeWidgetQiblaHeading;

async function pushNativePrayerWidgetIfNeeded(payload: CachedPrayer): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const native = prayerWidgetNative();
    if (!native?.setPayload) return;
    const enriched = await buildWidgetPayload(payload);
    native.setPayload(JSON.stringify(enriched));
  } catch {
    /* native module missing */
  }
}

export async function loadPrayerCache(): Promise<CachedPrayer | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as CachedPrayer;
    if (!j?.city || !j?.savedAt) return null;
    if (j.calculationMethod !== APP_PRAYER_CALCULATION_METHOD) return null;
    if (j.calculationSchool !== APP_PRAYER_ASR_SCHOOL) return null;
    if (isKazakhstanPrayerCountry(j.country) && j.source !== "muftyat") return null;
    return j;
  } catch {
    return null;
  }
}

export async function savePrayerCache(data: PrayerTimesResult): Promise<void> {
  const payload: CachedPrayer = {
    ...data,
    calculationMethod: APP_PRAYER_CALCULATION_METHOD,
    calculationSchool: APP_PRAYER_ASR_SCHOOL,
    savedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(payload));
  await pushNativePrayerWidgetIfNeeded(payload);
}

/** Қолданба ашылғанда / кэшті native widget-ке синхрондау (Android + iOS). */
export async function syncNativePrayerWidgetFromStorage(): Promise<void> {
  const c = await loadPrayerCache();
  if (c) {
    await pushNativePrayerWidgetIfNeeded(c);
  }
}

/** @deprecated use syncNativePrayerWidgetFromStorage */
export const syncAndroidPrayerWidgetFromStorage = syncNativePrayerWidgetFromStorage;
