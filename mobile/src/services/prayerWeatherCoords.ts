import type { PrayerTimesResult } from "../api/prayerTimes";
import { getKzPresetCoords } from "../constants/kzCities";
import { getSelectedCityCoords } from "../storage/prefs";

export function prayerResultWeatherCoords(
  d: Pick<PrayerTimesResult, "latitude" | "longitude"> | null | undefined
): { lat: number; lon: number } | null {
  if (d && Number.isFinite(d.latitude) && Number.isFinite(d.longitude)) {
    return { lat: d.latitude as number, lon: d.longitude as number };
  }
  return null;
}

/** Погода: API lat/lon → GPS сақталған → KZ preset. */
export async function resolvePrayerWeatherCoords(
  city: string,
  country: string,
  prayer?: Pick<PrayerTimesResult, "latitude" | "longitude"> | null
): Promise<{ lat: number; lon: number } | null> {
  const fromPrayer = prayerResultWeatherCoords(prayer);
  if (fromPrayer) return fromPrayer;
  const stored = await getSelectedCityCoords();
  if (stored) return stored;
  return getKzPresetCoords(city, country);
}
