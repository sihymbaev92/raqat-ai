import { displayPrayerRowsFromNext, currentSalatRow } from "../prayerSchedule";

describe("displayPrayerRowsFromNext", () => {
  const rows = [
    { key: "fajr", time: "05:00" },
    { key: "sun", time: "06:15" },
    { key: "dhuhr", time: "12:30" },
    { key: "asr", time: "16:00" },
    { key: "maghrib", time: "19:10" },
    { key: "isha", time: "20:30" },
  ];

  it("includes sunrise after the next salat in the remaining schedule", () => {
    const now = new Date(2026, 5, 17, 4, 30, 0);
    const displayed = displayPrayerRowsFromNext(rows, null, now);
    expect(displayed.map((r) => r.key)).toEqual(["sun", "dhuhr", "asr", "maghrib", "isha"]);
  });

  it("drops past sunrise when next salat is later in the day", () => {
    const now = new Date(2026, 5, 17, 13, 0, 0);
    const displayed = displayPrayerRowsFromNext(rows, null, now);
    expect(displayed.map((r) => r.key)).toEqual(["asr", "maghrib", "isha"]);
    expect(displayed.some((r) => r.key === "sun")).toBe(false);
  });
});

describe("currentSalatRow", () => {
  const rows = [
    { key: "fajr", time: "05:00" },
    { key: "sun", time: "06:15" },
    { key: "dhuhr", time: "12:30" },
    { key: "asr", time: "16:00" },
    { key: "maghrib", time: "19:10" },
    { key: "isha", time: "20:30" },
  ];

  it("marks dhuhr as current when asr is still next", () => {
    const now = new Date(2026, 5, 17, 14, 15, 0);
    expect(currentSalatRow(rows, now)?.key).toBe("dhuhr");
  });

  it("marks asr as current once asr has entered", () => {
    const now = new Date(2026, 5, 17, 16, 0, 0);
    expect(currentSalatRow(rows, now)?.key).toBe("asr");
  });

  it("keeps isha current before fajr", () => {
    const now = new Date(2026, 5, 17, 3, 0, 0);
    expect(currentSalatRow(rows, now)?.key).toBe("isha");
  });
});
