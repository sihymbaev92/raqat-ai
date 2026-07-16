import {
  PRAYER_TIMES_SCREEN_HERO_BG,
  resolvePrayerHeroBackground,
} from "../dashboardPrayerHero";

describe("resolvePrayerHeroBackground", () => {
  it("uses the same user hero on home and prayer screen", () => {
    expect(resolvePrayerHeroBackground("night", "dashboardNext")).toBe(PRAYER_TIMES_SCREEN_HERO_BG);
    expect(resolvePrayerHeroBackground("day", "dashboardNext")).toBe(PRAYER_TIMES_SCREEN_HERO_BG);
    expect(resolvePrayerHeroBackground("golden", "prayerScreen")).toBe(PRAYER_TIMES_SCREEN_HERO_BG);
  });
});
