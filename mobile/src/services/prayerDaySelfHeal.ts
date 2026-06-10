import { fetchPrayerTimesForLocation, isPrayerTimesResultForLocalToday } from "../api/prayerTimes";
import { loadPrayerCache, savePrayerCache } from "../storage/prayerCache";
import { getSelectedCity } from "../storage/prefs";

/**
 * Кэштегі кесте күнтізбелік «бүгінге» сәйкес емес болса (түн өткен соң) — желіден бүгінгі кестені алып сақтайды.
 * Фонда (AppState / background fetch) және басты беттің минуттық тексеруінде қолданылады.
 */
export async function refreshPrayerCacheIfCalendarStale(): Promise<void> {
  try {
    const cached = await loadPrayerCache();
    if (cached && !cached.error && isPrayerTimesResultForLocalToday(cached)) return;
    const { city, country } = await getSelectedCity();
    const fresh = await fetchPrayerTimesForLocation(city, country);
    if (!fresh.error) await savePrayerCache(fresh);
  } catch {
    /* желі жоқ — елемеу */
  }
}
