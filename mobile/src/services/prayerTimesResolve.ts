import {
  fetchPrayerTimesForLocation,
  isPrayerTimesResultForLocalToday,
  type PrayerTimesResult,
} from "../api/prayerTimes";
import { loadPrayerCache, loadPrayerCacheRelaxed, savePrayerCache } from "../storage/prayerCache";

export type PrayerTimesResolveResult = {
  data: PrayerTimesResult;
  fromCache: boolean;
  /** Кэш бүгінгі күнге сәйкес емес (желі жоқ). */
  staleDay: boolean;
  networkError?: string;
};

function cacheMatchesLocation(
  cached: PrayerTimesResult,
  city: string,
  country: string
): boolean {
  return (
    !cached.error &&
    cached.city.trim().toLowerCase() === city.trim().toLowerCase() &&
    cached.country.trim().toLowerCase() === country.trim().toLowerCase()
  );
}

function pickCacheForLocation(city: string, country: string): Promise<PrayerTimesResult | null> {
  return (async () => {
    const strict = await loadPrayerCache();
    if (strict && cacheMatchesLocation(strict, city, country)) return strict;
    const relaxed = await loadPrayerCacheRelaxed();
    if (relaxed && cacheMatchesLocation(relaxed, city, country)) return relaxed;
    return null;
  })();
}

/**
 * Алдымен кэш, содан желіден; желіден сәтсіз болса — офлайн кэш (бүгінгі немесе соңғы).
 */
export async function resolvePrayerTimesForDisplay(
  city: string,
  country: string,
  coordsHint?: { lat: number; lon: number } | null
): Promise<PrayerTimesResolveResult> {
  const cached = await pickCacheForLocation(city, country);
  const cachedToday = cached ? isPrayerTimesResultForLocalToday(cached) : false;

  let fresh: PrayerTimesResult;
  try {
    fresh = await fetchPrayerTimesForLocation(city, country, undefined, coordsHint);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    if (cached) {
      return {
        data: cached,
        fromCache: true,
        staleDay: !cachedToday,
        networkError: msg,
      };
    }
    return {
      data: {
        city,
        country,
        date: "",
        fajr: "",
        sunrise: "",
        dhuhr: "",
        asr: "",
        maghrib: "",
        isha: "",
        error: msg,
      },
      fromCache: false,
      staleDay: false,
      networkError: msg,
    };
  }

  if (!fresh.error) {
    await savePrayerCache(fresh);
    return { data: fresh, fromCache: false, staleDay: false };
  }

  if (cached) {
    return {
      data: cached,
      fromCache: true,
      staleDay: !cachedToday,
      networkError: fresh.error,
    };
  }

  return {
    data: fresh,
    fromCache: false,
    staleDay: false,
    networkError: fresh.error,
  };
}
