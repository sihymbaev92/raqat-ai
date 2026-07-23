import {
  applyPrayerTimeShift,
  fetchPrayerTimesForLocation,
  isPrayerTimesResultForLocalToday,
} from "../api/prayerTimes";
import { loadPrayerCache, savePrayerCache } from "../storage/prayerCache";
import { getSelectedCity } from "../storage/prefs";
import { resolvePrayerScheduleLocation } from "./devicePrayerLocation";
import { getPrayerScheduleShiftMin } from "./prayerMosqueShiftAlign";

/**
 * Кэштегі кесте күнтізбелік «бүгінге» сәйкес емес болса (түн өткен соң) — желіден бүгінгі кестені алып сақтайды.
 * Мешіт ығысуын UI/азанмен бірдей қолданады (шикі Muftyat-ты кэшке жазбайды).
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
    const freshRaw = await fetchPrayerTimesForLocation(loc.city, loc.country, undefined, {
      lat: loc.lat,
      lon: loc.lon,
    });
    if (freshRaw.error) return;
    const shiftMin = await getPrayerScheduleShiftMin();
    const fresh = shiftMin === 0 ? freshRaw : applyPrayerTimeShift(freshRaw, shiftMin);
    await savePrayerCache(fresh, { appliedShiftMin: shiftMin });
  } catch {
    /* желі жоқ — елемеу */
  }
}
