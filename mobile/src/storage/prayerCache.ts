import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules, Platform } from "react-native";
import {
  APP_PRAYER_ASR_SCHOOL,
  APP_PRAYER_CALCULATION_METHOD,
  type PrayerTimesResult,
} from "../api/prayerTimes";
import { getCityApproxCoords, getKzPresetCoords } from "../constants/kzCities";
import { kk } from "../i18n/kk";
import { getCurrentLocale } from "../i18n/runtime";
import { fetchOpenMeteoCurrent } from "../services/openMeteoCurrent";
import type { OpenMeteoCurrent } from "../services/openMeteoCurrent";

const KEY = "raqat_prayer_cache_v2";
const BY_CITY_KEY = "raqat_prayer_cache_by_city_v1";

function prayerCityKey(city: string, country: string): string {
  return `${city.trim().toLowerCase()}|${country.trim().toLowerCase()}`;
}

type PrayerCacheByCity = Record<string, CachedPrayer>;

async function loadPrayerCacheByCityMap(): Promise<PrayerCacheByCity> {
  try {
    const raw = await AsyncStorage.getItem(BY_CITY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PrayerCacheByCity;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function rememberPrayerCacheForCity(payload: CachedPrayer): Promise<void> {
  const map = await loadPrayerCacheByCityMap();
  map[prayerCityKey(payload.city, payload.country)] = payload;
  await AsyncStorage.setItem(BY_CITY_KEY, JSON.stringify(map));
}

/** Таңдалған қала үшін бұрын сақталған кесте (офлайн қала ауыстыру). */
export async function loadPrayerCacheForCity(city: string, country: string): Promise<CachedPrayer | null> {
  const hit = (await loadPrayerCacheByCityMap())[prayerCityKey(city, country)];
  if (!hit?.city || !hit?.savedAt) return null;
  if (hit.calculationMethod !== APP_PRAYER_CALCULATION_METHOD) return null;
  if (hit.calculationSchool !== APP_PRAYER_ASR_SCHOOL) return null;
  if (isKazakhstanPrayerCountry(hit.country) && hit.source !== "muftyat") return null;
  return hit;
}

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

async function buildWidgetPayload(
  payload: CachedPrayer,
  weatherOverride?: OpenMeteoCurrent | null
): Promise<Record<string, unknown>> {
  const base: Record<string, unknown> = { ...payload };
  const coords = cachedPrayerCoords(payload);
  if (coords) {
    base.latitude = coords.lat;
    base.longitude = coords.lon;
    try {
      const w =
        weatherOverride !== undefined
          ? weatherOverride
          : await fetchOpenMeteoCurrent(coords.lat, coords.lon);
      if (w) {
        base.weatherTempC = w.tempC;
        base.weatherCode = w.wmoCode;
      }
    } catch {
      /* optional weather */
    }
  }
  const locale = getCurrentLocale();
  base.locale = locale;
  /** Виджет жазулары — қолданба тілі (жүйе тілі емес). */
  base.labels = {
    fajr: kk.prayer.fajrShort,
    sunrise: kk.prayer.sunriseShort,
    dhuhr: kk.prayer.dhuhrShort,
    asr: kk.prayer.asrShort,
    maghrib: kk.prayer.maghribShort,
    isha: kk.prayer.ishaShort,
    nextHeading: kk.dashboard.nextPrayer,
  };
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

async function pushNativePrayerWidgetIfNeeded(
  payload: CachedPrayer,
  weatherOverride?: OpenMeteoCurrent | null
): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const native = prayerWidgetNative();
    if (!native?.setPayload) return;
    const enriched = await buildWidgetPayload(payload, weatherOverride);
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

export async function loadPrayerCacheRelaxed(): Promise<CachedPrayer | null> {
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
    calculationMethod: APP_PRAYER_CALCULATION_METHOD,
    calculationSchool: APP_PRAYER_ASR_SCHOOL,
    savedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(payload));
  await rememberPrayerCacheForCity(payload);
  await pushNativePrayerWidgetIfNeeded(payload);
}

/** Қолданба ашылғанда / кэшті native widget-ке синхрондау (Android + iOS). */
export async function syncNativePrayerWidgetFromStorage(
  weatherOverride?: OpenMeteoCurrent | null
): Promise<void> {
  const c = await loadPrayerCache();
  if (c) {
    await pushNativePrayerWidgetIfNeeded(c, weatherOverride);
  }
}
