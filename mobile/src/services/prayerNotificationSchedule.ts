import type { PrayerTimesResult } from "../api/prayerTimes";
import { isPrayerTimesResultForLocalToday } from "../api/prayerTimes";
import type { PrayerNotifSalatKey } from "../storage/prefs";
import { kk } from "../i18n/kk";

export const PRAYER_NOTIF_ID_PREFIX = "raqat-prayer-v2-";

export type PrayerSalatKey = "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";

export type PrayerSalatRow = {
  k: PrayerSalatKey;
  kind: "salat" | "sun";
};

/** Тұрақты кілттер — label әрқашан ағымдағы тілден. */
export const PRAYER_SALAT_KEYS: PrayerSalatRow[] = [
  { k: "fajr", kind: "salat" },
  { k: "sunrise", kind: "sun" },
  { k: "dhuhr", kind: "salat" },
  { k: "asr", kind: "salat" },
  { k: "maghrib", kind: "salat" },
  { k: "isha", kind: "salat" },
];

export function prayerSalatShortLabel(key: PrayerSalatKey): string {
  switch (key) {
    case "fajr":
      return kk.prayer.fajrShort;
    case "sunrise":
      return kk.prayer.sunriseShort;
    case "dhuhr":
      return kk.prayer.dhuhrShort;
    case "asr":
      return kk.prayer.asrShort;
    case "maghrib":
      return kk.prayer.maghribShort;
    case "isha":
      return kk.prayer.ishaShort;
    default:
      return key;
  }
}

/** Совместимость: label ағымдағы kk тілінен (қатынау кезінде). */
export const PRAYER_SALAT_ROWS: {
  k: PrayerSalatKey;
  label: string;
  kind: "salat" | "sun";
}[] = PRAYER_SALAT_KEYS.map((row) => ({
  k: row.k,
  kind: row.kind,
  get label() {
    return prayerSalatShortLabel(row.k);
  },
}));

export function prayerNotificationId(day: Date, salatKey: PrayerSalatKey): string {
  const y = day.getFullYear();
  const m = day.getMonth() + 1;
  const d = day.getDate();
  return `${PRAYER_NOTIF_ID_PREFIX}${y}${String(m).padStart(2, "0")}${String(d).padStart(2, "0")}-${salatKey}`;
}

export function isPrayerNotificationIdentifier(id: string | undefined | null): boolean {
  return typeof id === "string" && id.startsWith(PRAYER_NOTIF_ID_PREFIX);
}

export function shouldPlayPrayerAdhanSound(
  slot: Pick<PrayerScheduleSlot, "kind" | "salatKey">,
  mutedSalatKeys: readonly PrayerNotifSalatKey[] = []
): boolean {
  if (slot.kind !== "salat") return false;
  return !mutedSalatKeys.includes(slot.salatKey as PrayerNotifSalatKey);
}

export function atTimeOnDay(hhmm: string, day: Date): Date {
  const p = hhmm.split(":");
  const h = parseInt(p[0] ?? "0", 10);
  const m = parseInt(p[1] ?? "0", 10);
  const d = new Date(day);
  d.setSeconds(0, 0);
  d.setMilliseconds(0);
  d.setHours(h, m, 0, 0);
  return d;
}

export function localDayAtNoon(base: Date, addDays: number): Date {
  const d = new Date(base);
  d.setHours(12, 0, 0, 0);
  d.setMilliseconds(0);
  d.setDate(d.getDate() + addDays);
  return d;
}

export type PrayerDayBucket = { day: Date; pt: PrayerTimesResult };

/** Кэшті бүгінгі күн үшін бірінші қолданады (фонда желі күтпей). */
export function buildPrayerDayBuckets(
  data: PrayerTimesResult,
  fetched: PrayerDayBucket[],
  anchor: Date
): PrayerDayBucket[] {
  const byDay = new Map<string, PrayerDayBucket>();
  const today = localDayAtNoon(anchor, 0);
  const todayKey = dayKey(today);

  if (!data.error && isPrayerTimesResultForLocalToday(data, today)) {
    byDay.set(todayKey, { day: today, pt: data });
  }

  for (const row of fetched) {
    if (dayKey(row.day) === todayKey && byDay.has(todayKey)) continue;
    byDay.set(dayKey(row.day), row);
  }

  const out: PrayerDayBucket[] = [];
  for (let i = 0; i < 14; i++) {
    const day = localDayAtNoon(anchor, i);
    const hit = byDay.get(dayKey(day));
    if (hit && !hit.pt.error) out.push(hit);
  }
  return out;
}

function dayKey(day: Date): string {
  return `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
}

export type PrayerScheduleSlot = {
  identifier: string;
  when: Date;
  salatKey: PrayerSalatKey;
  label: string;
  kind: "salat" | "sun";
  timeShort: string;
};

export function collectUpcomingPrayerSlots(
  dayBuckets: PrayerDayBucket[],
  nowMs: number,
  maxCount: number
): PrayerScheduleSlot[] {
  const out: PrayerScheduleSlot[] = [];
  for (const { day, pt } of dayBuckets) {
    for (const row of PRAYER_SALAT_KEYS) {
      if (out.length >= maxCount) return out;
      const time = pt[row.k];
      if (typeof time !== "string" || !time.trim()) continue;
      const when = atTimeOnDay(time, day);
      if (when.getTime() <= nowMs) continue;
      const timeShort = time.trim().split(/\s+/)[0] ?? time;
      out.push({
        identifier: prayerNotificationId(day, row.k),
        when,
        salatKey: row.k,
        label: prayerSalatShortLabel(row.k),
        kind: row.kind,
        timeShort,
      });
    }
  }
  return out;
}
