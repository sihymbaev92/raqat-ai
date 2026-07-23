import { alignPrayerTimesToShift } from "../prayerMosqueShiftAlign";
import type { PrayerTimesResult } from "../../api/prayerTimes";

const base: PrayerTimesResult = {
  city: "Шымкент",
  country: "Kazakhstan",
  date: "24-07-2026",
  fajr: "03:21",
  sunrise: "05:10",
  dhuhr: "13:05",
  asr: "17:00",
  maghrib: "20:20",
  isha: "21:50",
  source: "muftyat",
};

describe("alignPrayerTimesToShift", () => {
  it("applies +8 from raw so UI and azan share 03:29", () => {
    const aligned = alignPrayerTimesToShift(
      { ...base, appliedShiftMin: 0 },
      8,
      { missingAppliedMeans: "raw" },
    );
    expect(aligned.fajr).toBe("03:29");
    expect(aligned.appliedShiftMin).toBe(8);
  });

  it("undoes old shift when mosque offset changes", () => {
    const shifted = alignPrayerTimesToShift(
      { ...base, appliedShiftMin: 0 },
      8,
      { missingAppliedMeans: "raw" },
    );
    const back = alignPrayerTimesToShift(shifted, 0, { missingAppliedMeans: "raw" });
    expect(back.fajr).toBe("03:21");
    expect(back.appliedShiftMin).toBe(0);
  });

  it("does not double-shift when already at desired", () => {
    const once = alignPrayerTimesToShift(
      { ...base, fajr: "03:29", appliedShiftMin: 8 },
      8,
      { missingAppliedMeans: "raw" },
    );
    expect(once.fajr).toBe("03:29");
  });

  it("keeps already-shifted cache fallback at +8 without doubling", () => {
    const cached = { ...base, fajr: "03:29", appliedShiftMin: 8 };
    const aligned = alignPrayerTimesToShift(cached, 8, { missingAppliedMeans: "raw" });
    expect(aligned.fajr).toBe("03:29");
  });
});
