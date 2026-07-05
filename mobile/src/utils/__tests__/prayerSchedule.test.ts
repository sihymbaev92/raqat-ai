import { displayPrayerRowsFromNext } from "../prayerSchedule";

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
