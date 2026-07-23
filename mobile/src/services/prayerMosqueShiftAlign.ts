/**
 * Мешіт ығысуы: UI мен азан бірдей HH:MM қолдануы керек.
 * Кэште `appliedShiftMin` — осы кестеге қосылған минут; өзгерсе қайта туралаймыз.
 */
import {
  applyPrayerTimeShift,
  type PrayerTimesResult,
} from "../api/prayerTimes";
import type { CachedPrayer } from "../storage/prayerCache";
import { getPrayerMosqueShiftMin, getPrayerSourceMode } from "../storage/prefs";

export async function getPrayerScheduleShiftMin(): Promise<number> {
  const [sourceMode, shiftMin] = await Promise.all([getPrayerSourceMode(), getPrayerMosqueShiftMin()]);
  return sourceMode === "mosque" ? shiftMin : 0;
}

/**
 * Кэш/API нәтижесін ағымдағы мешіт ығысуына сәйкестендіреді.
 * `appliedShiftMin` жоқ (ескі кэш) болса — уақытты өзгертпей, тек қажетті ығысуды «қолданылған» деп белгілей алмаймыз;
 * сондықтан `assumeAppliedIfMissing` арқылы: undefined → 0 (шикі) деп есептеп desired-ге қарай жылжытамыз
 * тек caller қайта fetch жасағанда. Мұнда: undefined → desired деп stamp (ескі Dashboard shifted кэштерін сақтау),
 * ал self-heal/raw үшін caller appliedShiftMin: 0 қояды.
 */
export function alignPrayerTimesToShift(
  data: PrayerTimesResult & { appliedShiftMin?: number },
  desiredShiftMin: number,
  opts?: { missingAppliedMeans?: "raw" | "alreadyDesired" },
): CachedPrayer {
  const missingMeans = opts?.missingAppliedMeans ?? "alreadyDesired";
  const applied =
    data.appliedShiftMin != null && Number.isFinite(data.appliedShiftMin)
      ? Math.trunc(data.appliedShiftMin)
      : missingMeans === "raw"
        ? 0
        : desiredShiftMin;

  if (applied === desiredShiftMin) {
    return {
      ...(data as CachedPrayer),
      appliedShiftMin: desiredShiftMin,
      savedAt: (data as CachedPrayer).savedAt ?? new Date().toISOString(),
    };
  }

  const raw = applied === 0 ? data : applyPrayerTimeShift(data, -applied);
  const next = desiredShiftMin === 0 ? raw : applyPrayerTimeShift(raw, desiredShiftMin);
  return {
    ...(next as CachedPrayer),
    appliedShiftMin: desiredShiftMin,
    savedAt: (data as CachedPrayer).savedAt ?? new Date().toISOString(),
  };
}

export async function alignPrayerTimesToCurrentScheduleShift(
  data: PrayerTimesResult & { appliedShiftMin?: number },
  opts?: { missingAppliedMeans?: "raw" | "alreadyDesired" },
): Promise<CachedPrayer> {
  const desired = await getPrayerScheduleShiftMin();
  return alignPrayerTimesToShift(data, desired, opts);
}
