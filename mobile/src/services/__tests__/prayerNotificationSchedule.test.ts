import type { PrayerTimesResult } from "../../api/prayerTimes";
import { applyPrayerTimeShift, shiftPrayerTime } from "../../api/prayerTimes";
import {
  buildPrayerDayBuckets,
  collectUpcomingPrayerSlots,
  isPrayerNotificationIdentifier,
  localDayAtNoon,
  prayerNotificationId,
  shouldPlayPrayerAdhanSound,
} from "../prayerNotificationSchedule";

function samplePt(date: string, hour: string): PrayerTimesResult {
  return {
    city: "Алматы",
    country: "Kazakhstan",
    date,
    fajr: `${hour}:00`,
    sunrise: "07:00",
    dhuhr: "13:00",
    asr: "16:00",
    maghrib: "19:00",
    isha: "21:00",
  };
}

describe("prayerNotificationSchedule", () => {
  it("identifies prayer notification ids", () => {
    expect(isPrayerNotificationIdentifier("raqat-prayer-v2-20260518-fajr")).toBe(true);
    expect(isPrayerNotificationIdentifier("hatim")).toBe(false);
  });

  it("prefers cached today over empty fetch", () => {
    const anchor = new Date(2026, 4, 18, 12, 0, 0, 0);
    const today = localDayAtNoon(anchor, 0);
    const cached = samplePt("18-05-2026", "05");
    const buckets = buildPrayerDayBuckets(cached, [], anchor);
    expect(buckets.length).toBeGreaterThanOrEqual(1);
    expect(buckets[0].pt.fajr).toBe("05:00");
    const id = prayerNotificationId(today, "fajr");
    expect(id).toContain("fajr");
  });

  it("keeps cached today when fetched data also contains today", () => {
    const anchor = new Date(2026, 4, 18, 12, 0, 0, 0);
    const today = localDayAtNoon(anchor, 0);
    const cached = samplePt("18-05-2026", "05");
    const fetchedToday = samplePt("18-05-2026", "04");
    const buckets = buildPrayerDayBuckets(cached, [{ day: today, pt: fetchedToday }], anchor);

    expect(buckets[0].pt.fajr).toBe("05:00");
  });

  it("collects only future slots", () => {
    const anchor = new Date(2026, 4, 18, 12, 0, 0, 0);
    const cached = samplePt("18-05-2026", "23");
    const buckets = buildPrayerDayBuckets(cached, [], anchor);
    const slots = collectUpcomingPrayerSlots(buckets, anchor.getTime(), 64);
    expect(slots.some((s) => s.salatKey === "isha")).toBe(true);
    expect(slots.every((s) => s.when.getTime() > anchor.getTime())).toBe(true);
  });

  it("plays the selected adhan only for actual prayer slots", () => {
    expect(shouldPlayPrayerAdhanSound({ kind: "salat", salatKey: "asr" })).toBe(true);
    expect(shouldPlayPrayerAdhanSound({ kind: "sun", salatKey: "sunrise" })).toBe(false);
  });

  it("mutes adhan for individually disabled prayers", () => {
    expect(shouldPlayPrayerAdhanSound({ kind: "salat", salatKey: "asr" }, ["asr"])).toBe(false);
    expect(shouldPlayPrayerAdhanSound({ kind: "salat", salatKey: "maghrib" }, ["asr"])).toBe(true);
  });

  it("shifts mosque-adjusted prayer times across midnight", () => {
    expect(shiftPrayerTime("23:55", 10)).toBe("00:05");
    expect(shiftPrayerTime("00:05", -10)).toBe("23:55");
    expect(applyPrayerTimeShift(samplePt("18-05-2026", "05"), 3).fajr).toBe("05:03");
  });
});
