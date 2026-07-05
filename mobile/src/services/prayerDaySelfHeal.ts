import { fetchPrayerTimesForLocation, isPrayerTimesResultForLocalToday } from "../api/prayerTimes";
import { loadPrayerCache, savePrayerCache } from "../storage/prayerCache";
import { getSelectedCity } from "../storage/prefs";
import { resolvePrayerScheduleLocation } from "./devicePrayerLocation";

/**
 * Кэштегі кесте күнтізбелік «бүгінге» сәйкес емес болса (түн өткен соң) — желіден бүгінгі кестені алып сақтайды.
 * Фонда (AppState / background fetch) және басты беттің минуттық тексеруінде қолданылады.
 */
export async function refreshPrayerCacheIfCalendarStale(): Promise<void> {
  try {
    const { city, country } = await getSelectedCity();
    const cached = await loadPrayerCache();
    if (
      cached &&
      !cached.error &&
      cached.city === city &&
      cached.country === country &&
      isPrayerTimesResultForLocalToday(cached)
    ) {
      return;
    }
    const loc = await resolvePrayerScheduleLocation();
    const fresh = await fetchPrayerTimesForLocation(loc.city, loc.country, undefined, {
      lat: loc.lat,
      lon: loc.lon,
    });
    if (!fresh.error) await savePrayerCache(fresh);
  } catch {
    /* желі жоқ — елемеу */
  }
}
