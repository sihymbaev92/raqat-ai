import {
  prayerDaylightPhaseFor,
  prayerDaylightPhaseFromClock,
  prayerDaylightLookFor,
  prayerDaylightTimesFromRows,
  softenPrayerDaylightLook,
  prayerHeroSkyLookFor,
} from "../prayerHeroDaylight";

describe("prayerHeroDaylight", () => {
  const times = {
    fajr: "04:30",
    sunrise: "06:00",
    dhuhr: "13:00",
    asr: "17:00",
    maghrib: "20:00",
    isha: "21:30",
  };

  function at(h: number, m = 0) {
    const d = new Date(2026, 6, 12, h, m, 0, 0);
    return d;
  }

  it("maps clock windows to daylight phases", () => {
    expect(prayerDaylightPhaseFor(times, at(3, 0))).toBe("night");
    expect(prayerDaylightPhaseFor(times, at(5, 0))).toBe("dawn");
    expect(prayerDaylightPhaseFor(times, at(8, 0))).toBe("sunrise");
    expect(prayerDaylightPhaseFor(times, at(14, 0))).toBe("day");
    expect(prayerDaylightPhaseFor(times, at(18, 0))).toBe("golden");
    expect(prayerDaylightPhaseFor(times, at(20, 30))).toBe("sunset");
    expect(prayerDaylightPhaseFor(times, at(22, 0))).toBe("night");
  });

  it("returns distinct sky-only looks per phase", () => {
    const dawn = prayerDaylightLookFor(times, at(5));
    const day = prayerDaylightLookFor(times, at(14));
    const night = prayerDaylightLookFor(times, at(23));
    expect(dawn.phase).toBe("dawn");
    expect(dawn.colors[dawn.colors.length - 1]).toMatch(/,\s*0\)$/);
    expect(night.colors[night.colors.length - 1]).toMatch(/,\s*0\)$/);
    expect(dawn.skyBandHeight).toBeLessThan(0.55);
    expect(day.skyBandHeight).toBeLessThan(0.55);
    expect(dawn.colors[0]).not.toBe(night.colors[0]);
  });

  it("reads sun key from home mockup rows", () => {
    const t = prayerDaylightTimesFromRows([
      { key: "fajr", time: "04:30" },
      { key: "sun", time: "06:00" },
      { key: "maghrib", time: "20:00" },
    ]);
    expect(t.sunrise).toBe("06:00");
    expect(t.fajr).toBe("04:30");
  });

  it("uses clock fallback when prayer rows are still empty", () => {
    expect(
      prayerDaylightPhaseFor(
        prayerDaylightTimesFromRows([
          { key: "fajr", time: "" },
          { key: "sun", time: "" },
        ]),
        at(14, 0)
      )
    ).toBe("day");
    expect(prayerDaylightPhaseFromClock(14 * 60)).toBe("day");
  });

  it("does not force night during daytime when only maghrib is known", () => {
    expect(
      prayerDaylightPhaseFor(
        { maghrib: "20:00" },
        at(14, 0)
      )
    ).toBe("day");
  });

  it("softens overlay alpha for lit hero photos", () => {
    const day = prayerDaylightLookFor(times, at(14));
    const soft = softenPrayerDaylightLook(day, 0.2);
    expect(soft.colors[0]).toContain("rgba(");
    expect(soft.colors[0]).not.toBe(day.colors[0]);
    expect(soft.skyBandHeight).toBeLessThan(day.skyBandHeight + 0.01);
  });

  it("maps sky phases to distinct wide hero bands", () => {
    const dawn = prayerHeroSkyLookFor(times, at(5));
    const sunrise = prayerHeroSkyLookFor(times, at(8));
    const day = prayerHeroSkyLookFor(times, at(14));
    const sunset = prayerHeroSkyLookFor(times, at(20, 30));
    const night = prayerHeroSkyLookFor(times, at(23));
    expect(dawn.phase).toBe("dawn");
    expect(sunrise.phase).toBe("sunrise");
    expect(day.phase).toBe("day");
    expect(sunset.phase).toBe("sunset");
    expect(night.phase).toBe("night");
    expect(dawn.skyBandHeight).toBeGreaterThanOrEqual(0.55);
    expect(day.colors[0]).toMatch(/70,\s*160,\s*255/);
    expect(sunset.colors[0]).toMatch(/255,\s*85,\s*40/);
    expect(dawn.colors[0]).not.toBe(sunset.colors[0]);
  });
});
