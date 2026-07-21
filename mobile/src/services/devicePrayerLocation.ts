import { Platform } from "react-native";
import * as Location from "expo-location";
import {
  findNearestKzCityPreset,
  getKzPresetCoords,
  isInKazakhstanBBox,
} from "../constants/kzCities";
import {
  getPrayerLocationAutoEnabled,
  getSelectedCity,
  setPrayerLocationAutoEnabled,
  setSelectedCity,
} from "../storage/prefs";

export type DeviceCoordsSource = "gps" | "network";

export type DeviceCoords = {
  lat: number;
  lon: number;
  accuracyM: number | null;
  source: DeviceCoordsSource;
};

export type ResolvedPrayerLocation = {
  city: string;
  country: string;
  lat: number;
  lon: number;
  locationSource: "device" | "saved";
  deviceSource?: DeviceCoordsSource;
};

const DEVICE_COORD_MAX_AGE_MS = 15 * 60_000;
const DEVICE_COORD_REQUIRED_ACCURACY_M = 5_000;

function isFiniteCoord(lat: number, lon: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}

function coordsFromPosition(
  lat: number,
  lon: number,
  accuracyM: number | null | undefined,
  source: DeviceCoordsSource
): DeviceCoords | null {
  if (!isFiniteCoord(lat, lon)) return null;
  return {
    lat,
    lon,
    accuracyM: typeof accuracyM === "number" && Number.isFinite(accuracyM) ? accuracyM : null,
    source,
  };
}

async function readWebDeviceCoords(): Promise<DeviceCoords | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve(
          coordsFromPosition(
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.accuracy,
            "network"
          )
        );
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: DEVICE_COORD_MAX_AGE_MS }
    );
  });
}

async function readNativeDeviceCoords(): Promise<DeviceCoords | null> {
  try {
    const fg = await Location.getForegroundPermissionsAsync();
    if (!fg.granted) {
      const req = await Location.requestForegroundPermissionsAsync();
      if (!req.granted) return null;
    }
    if (!(await Location.hasServicesEnabledAsync())) return null;

    try {
      const last = await Location.getLastKnownPositionAsync({
        maxAge: DEVICE_COORD_MAX_AGE_MS,
        requiredAccuracy: DEVICE_COORD_REQUIRED_ACCURACY_M,
      });
      if (last) {
        const hit = coordsFromPosition(
          last.coords.latitude,
          last.coords.longitude,
          last.coords.accuracy,
          "gps"
        );
        if (hit) return hit;
      }
    } catch {
      /* next */
    }

    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.LocationAccuracy.Balanced,
        mayShowUserSettingsDialog: true,
      });
      return coordsFromPosition(
        pos.coords.latitude,
        pos.coords.longitude,
        pos.coords.accuracy,
        "gps"
      );
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

/** GPS / Wi‑Fi / желі геолокациясы (web: navigator.geolocation). */
export async function readDeviceCoords(): Promise<DeviceCoords | null> {
  if (Platform.OS === "web") return readWebDeviceCoords();
  return readNativeDeviceCoords();
}

function samePlaceName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** Google Open Location Code (мысалы JJ2C+MR6) — елді мекен атауы емес. */
export function isPlusCodePlaceName(value: string): boolean {
  const s = value.trim();
  if (!s) return false;
  // Қысқа: JJ2C+MR6 · толық: 8Q7XJJ2C+MR6
  if (/^[A-Z0-9]{2,8}\+[A-Z0-9]{2,8}$/i.test(s)) return true;
  if (/\b[A-Z0-9]{4}\+[A-Z0-9]{2,3}\b/i.test(s) && !/[\u0400-\u04FF]/.test(s)) return true;
  return false;
}

/** Көше/үй нөмірі / Plus Code — елді мекен атауы емес. */
export function isStreetLikePlaceName(value: string, street?: string | null): boolean {
  const s = value.trim();
  if (!s) return true;
  if (isPlusCodePlaceName(s)) return true;
  if (street && samePlaceName(s, street)) return true;
  if (/^\d+[A-Za-zА-Яа-яӘәІіҢңҒғҮүҰұҚқӨөҺһ/-]*$/u.test(s)) return true;
  if (/^(ул\.?|улица|көше|пр\.?|проспект|мкр\.?|микрорайон|б\.?|бульвар)\b/iu.test(s)) return true;
  return false;
}

type GeocodePlaceRow = {
  city?: string | null;
  district?: string | null;
  name?: string | null;
  subregion?: string | null;
  region?: string | null;
  street?: string | null;
  country?: string | null;
  formattedAddress?: string | null;
};

/**
 * Ауыл/елді мекенді қаладан бұрын алу:
 * district (subLocality) → name → city → subregion → region.
 * Шымкент маңындағы Құтарыс сияқты ауылдарда city=Shymkent болса да district/name сақталады.
 */
export function pickSettlementFromGeocode(row: GeocodePlaceRow): string {
  const region = (row.region ?? "").trim();
  const street = (row.street ?? "").trim();
  const candidates = [row.district, row.name, row.city, row.subregion, row.region]
    .map((x) => (x ?? "").trim())
    .filter(Boolean);

  for (const cand of candidates) {
    if (isStreetLikePlaceName(cand, street)) continue;
    if (region && samePlaceName(cand, region) && candidates.some((c) => c !== cand && !samePlaceName(c, region))) {
      continue;
    }
    return cand;
  }

  const formatted = (row.formattedAddress ?? "").split(",")[0]?.trim() ?? "";
  if (formatted && !isStreetLikePlaceName(formatted, street)) return formatted;
  return "";
}

async function reverseGeocodeLabel(
  lat: number,
  lon: number
): Promise<{ city: string; country: string } | null> {
  try {
    const rows = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
    const row = rows[0];
    if (!row) return null;
    const city = pickSettlementFromGeocode(row);
    const country = (row.country ?? "").trim();
    if (!city && !country) return null;
    return { city: city || "Unknown", country: country || "Unknown" };
  } catch {
    return null;
  }
}

function savedCoordsFallback(city: string, country: string): { lat: number; lon: number } {
  const preset = getKzPresetCoords(city, country);
  if (preset) return preset;
  const nearest = findNearestKzCityPreset(42.34167, 69.59028);
  return { lat: nearest?.lat ?? 42.34167, lon: nearest?.lon ?? 69.59028 };
}

/**
 * Намаз кестесі, ауа райы және құбыла үшін бір орын:
 * автоматты режимде GPS/Wi‑Fi координат + reverse-geocode мекенжай
 * (ауыл/елді мекен атауы; сәтсіз болса — ең жақын қала пресеті).
 */
export async function resolvePrayerScheduleLocation(): Promise<ResolvedPrayerLocation> {
  const saved = await getSelectedCity();
  const auto = await getPrayerLocationAutoEnabled();

  if (auto) {
    const device = await readDeviceCoords();
    if (device) {
      const nearest = findNearestKzCityPreset(device.lat, device.lon);
      const geo = await reverseGeocodeLabel(device.lat, device.lon);

      let city = geo?.city || nearest?.city || saved.city;
      let country = geo?.country || nearest?.country || saved.country;

      // Plus Code / бос геокод — ең жақын қала/елді мекен.
      if (!city.trim() || isPlusCodePlaceName(city) || city === "Unknown") {
        city = nearest?.city || (isPlusCodePlaceName(saved.city) ? "" : saved.city) || city;
      }
      if (isPlusCodePlaceName(city) && nearest?.city) {
        city = nearest.city;
        country = nearest.country;
      }

      // ҚР ішінде геокод ел атауын бере алмаса — Kazakhstan.
      if (
        !geo?.country &&
        (isInKazakhstanBBox(device.lat, device.lon) ||
          (nearest != null && nearest.distanceM <= 180_000))
      ) {
        country = nearest?.country ?? "Kazakhstan";
      }

      if (saved.city !== city || saved.country !== country) {
        void setSelectedCity(city, country);
      }

      return {
        city,
        country,
        lat: device.lat,
        lon: device.lon,
        locationSource: "device",
        deviceSource: device.source,
      };
    }
  }

  const coords = savedCoordsFallback(saved.city, saved.country);
  return {
    city: saved.city,
    country: saved.country,
    lat: coords.lat,
    lon: coords.lon,
    locationSource: "saved",
  };
}

/** Қолмен қала таңдағанда автоматты орынды өшіру. */
export async function disablePrayerLocationAutoFromManualPick(): Promise<void> {
  await setPrayerLocationAutoEnabled(false);
}
