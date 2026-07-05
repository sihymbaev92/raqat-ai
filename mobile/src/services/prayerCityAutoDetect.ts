import { Platform } from "react-native";
import * as Location from "expo-location";
import {
  findKzCityPresetByName,
  findNearestKzCityPreset,
} from "../constants/kzCities";
import type { KzCityPreset } from "../constants/kzCityPresetsList";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addSavedCity,
  getCityLocationMode,
  getSelectedCity,
  setSelectedCity,
  setSelectedCityCoords,
  type CityLocationMode,
} from "../storage/prefs";

const K = {
  autoDetectedAt: "raqat_city_auto_detected_at_v1",
} as const;

/** Фондық auto-detect интервалы (экран ашқанда forceDetect әрдайым GPS/IP). */
const AUTO_DETECT_MIN_INTERVAL_MS = 30 * 60 * 1000;
const GPS_TIMEOUT_MS = 15_000;
const IP_GEO_TIMEOUT_MS = 10_000;
const LAST_KNOWN_MAX_AGE_MS = 60 * 60 * 1000;

export type PrayerCityDetectSource = "gps" | "ip";

export type DetectedPrayerCity = {
  city: string;
  country: string;
  label: string;
  lat: number;
  lon: number;
  source: PrayerCityDetectSource;
};

export type ResolvedPrayerCity = {
  city: string;
  country: string;
  source: "stored" | PrayerCityDetectSource;
};

function presetToDetected(p: KzCityPreset, source: PrayerCityDetectSource, lat: number, lon: number): DetectedPrayerCity {
  return {
    city: p.city,
    country: p.country,
    label: p.label,
    lat,
    lon,
    source,
  };
}

async function shouldRefreshAutoDetect(minIntervalMs: number): Promise<boolean> {
  const raw = await AsyncStorage.getItem(K.autoDetectedAt);
  if (!raw) return true;
  const ts = Date.parse(raw);
  return !Number.isFinite(ts) || Date.now() - ts > minIntervalMs;
}

async function markAutoDetected(): Promise<void> {
  await AsyncStorage.setItem(K.autoDetectedAt, new Date().toISOString());
}

function isKzCountryName(raw: string | null | undefined): boolean {
  const t = (raw ?? "").trim().toLowerCase();
  if (!t) return true;
  return t === "kazakhstan" || t === "қазақстан" || t === "казахстан" || t === "kz";
}

function presetFromGeocodeNames(names: string[], country?: string | null): KzCityPreset | null {
  if (country && !isKzCountryName(country)) return null;
  for (const name of names) {
    const hit = findKzCityPresetByName(name, country ?? "Kazakhstan");
    if (hit) return hit;
  }
  return null;
}

async function resolvePresetFromCoords(
  lat: number,
  lon: number,
  source: PrayerCityDetectSource
): Promise<DetectedPrayerCity> {
  try {
    const rows = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
    for (const row of rows) {
      const names = [row.city, row.district, row.subregion, row.region, row.name].filter(
        (x): x is string => typeof x === "string" && x.trim().length > 0
      );
      const hit = presetFromGeocodeNames(names, row.country);
      if (hit) return presetToDetected(hit, source, lat, lon);
    }
  } catch {
    /* reverse geocode optional */
  }
  const nearest = findNearestKzCityPreset(lat, lon);
  return presetToDetected(nearest, source, lat, lon);
}

async function readCurrentGpsCoords(): Promise<{ lat: number; lon: number } | null> {
  try {
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { lat: pos.coords.latitude, lon: pos.coords.longitude };
  } catch {
    return null;
  }
}

async function readDeviceCoords(requestPermission: boolean): Promise<{ lat: number; lon: number } | null> {
  if (Platform.OS === "web") return null;

  try {
    let perm = await Location.getForegroundPermissionsAsync();
    if (!perm.granted && requestPermission) {
      perm = await Location.requestForegroundPermissionsAsync();
    }
    if (!perm.granted) return null;
    if (!(await Location.hasServicesEnabledAsync())) return null;

    const fresh = await Promise.race([
      readCurrentGpsCoords(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), GPS_TIMEOUT_MS)),
    ]);
    if (fresh) return fresh;

    const cached = await Location.getLastKnownPositionAsync({
      maxAge: LAST_KNOWN_MAX_AGE_MS,
      requiredAccuracy: 8000,
    });
    if (cached) {
      return { lat: cached.coords.latitude, lon: cached.coords.longitude };
    }
  } catch {
    return null;
  }
  return null;
}

async function readIpApproxCoords(): Promise<{ lat: number; lon: number } | null> {
  const fromWho = await readIpWhoIsCoords();
  if (fromWho) return fromWho;
  return readIpApiCoCoords();
}

async function readIpWhoIsCoords(): Promise<{ lat: number; lon: number } | null> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), IP_GEO_TIMEOUT_MS);
  try {
    const r = await fetch("https://ipwho.is/", { signal: c.signal });
    if (!r.ok) return null;
    const j = (await r.json()) as {
      success?: boolean;
      latitude?: number;
      longitude?: number;
      country_code?: string;
    };
    if (j.success === false) return null;
    if (j.country_code && j.country_code.toUpperCase() !== "KZ") return null;
    const lat = typeof j.latitude === "number" ? j.latitude : NaN;
    const lon = typeof j.longitude === "number" ? j.longitude : NaN;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { lat, lon };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function readIpApiCoCoords(): Promise<{ lat: number; lon: number } | null> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), IP_GEO_TIMEOUT_MS);
  try {
    const r = await fetch("https://ipapi.co/json/", { signal: c.signal });
    if (!r.ok) return null;
    const j = (await r.json()) as {
      latitude?: number;
      longitude?: number;
      country_code?: string;
      error?: boolean;
    };
    if (j.error) return null;
    if (j.country_code && j.country_code.toUpperCase() !== "KZ") return null;
    const lat = typeof j.latitude === "number" ? j.latitude : NaN;
    const lon = typeof j.longitude === "number" ? j.longitude : NaN;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { lat, lon };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function persistDetectedCity(detected: DetectedPrayerCity): Promise<void> {
  await setSelectedCity(detected.city, detected.country);
  await setSelectedCityCoords(detected.lat, detected.lon);
  await addSavedCity(detected.city, detected.country);
  await markAutoDetected();
}

/** GPS (соңы — IP геолокация) арқылы қala анықтау. */
export async function detectPrayerCityFromDevice(opts?: {
  requestPermission?: boolean;
}): Promise<DetectedPrayerCity | null> {
  const requestPermission = opts?.requestPermission !== false;

  const gps = await readDeviceCoords(requestPermission);
  if (gps) {
    return resolvePresetFromCoords(gps.lat, gps.lon, "gps");
  }

  const ip = await readIpApproxCoords();
  if (ip) {
    return resolvePresetFromCoords(ip.lat, ip.lon, "ip");
  }

  return null;
}

/** Авто режимде GPS/IP арқылы қala; қолмен таңдалса — сақталған мән. */
export async function resolvePrayerLocationCity(opts?: {
  forceDetect?: boolean;
  requestPermission?: boolean;
}): Promise<ResolvedPrayerCity> {
  const mode: CityLocationMode = await getCityLocationMode();
  if (mode === "manual" && !opts?.forceDetect) {
    return { ...(await getSelectedCity()), source: "stored" };
  }

  if (!opts?.forceDetect && !(await shouldRefreshAutoDetect(AUTO_DETECT_MIN_INTERVAL_MS))) {
    return { ...(await getSelectedCity()), source: "stored" };
  }

  const detected = await detectPrayerCityFromDevice({
    requestPermission: opts?.requestPermission !== false,
  });
  if (!detected) {
    return { ...(await getSelectedCity()), source: "stored" };
  }

  await persistDetectedCity(detected);
  return { city: detected.city, country: detected.country, source: detected.source };
}
