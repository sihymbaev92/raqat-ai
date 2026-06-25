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

async function reverseGeocodeLabel(
  lat: number,
  lon: number
): Promise<{ city: string; country: string } | null> {
  try {
    const rows = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
    const row = rows[0];
    if (!row) return null;
    const city = (row.city ?? row.subregion ?? row.region ?? "").trim();
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
 * автоматты режимде GPS/Wi‑Fi → ең жақын қала + нақты координат.
 */
export async function resolvePrayerScheduleLocation(): Promise<ResolvedPrayerLocation> {
  const saved = await getSelectedCity();
  const auto = await getPrayerLocationAutoEnabled();

  if (auto) {
    const device = await readDeviceCoords();
    if (device) {
      const nearest = findNearestKzCityPreset(device.lat, device.lon);
      const inKz =
        isInKazakhstanBBox(device.lat, device.lon) ||
        (nearest != null && nearest.distanceM <= 180_000);

      let city = nearest?.city ?? saved.city;
      let country = nearest?.country ?? saved.country;

      if (!inKz) {
        const geo = await reverseGeocodeLabel(device.lat, device.lon);
        if (geo?.city) city = geo.city;
        if (geo?.country) country = geo.country;
      } else if (nearest && (saved.city !== city || saved.country !== country)) {
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
