import { shouldFireInAppPrayerMoment } from "../prayerMomentAlertWindow";

describe("shouldFireInAppPrayerMoment", () => {
  it("fires only when the app was already active before the prayer moment", () => {
    const now = new Date(2026, 5, 11, 10, 0, 3);
    const targetMs = new Date(2026, 5, 11, 10, 0, 0).getTime();

    expect(shouldFireInAppPrayerMoment(now, "10:00", targetMs - 6_000)).toBe(true);
    expect(shouldFireInAppPrayerMoment(now, "10:00", targetMs + 1_000)).toBe(false);
  });

  it("does not catch up late azan playback after the moment has passed", () => {
    const now = new Date(2026, 5, 11, 10, 0, 30);
    const targetMs = new Date(2026, 5, 11, 10, 0, 0).getTime();

    expect(shouldFireInAppPrayerMoment(now, "10:00", targetMs - 60_000)).toBe(false);
  });
});
