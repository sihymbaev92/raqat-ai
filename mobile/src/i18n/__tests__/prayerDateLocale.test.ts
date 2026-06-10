import { kk } from "../kk";
import { setCurrentLocale } from "../runtime";
import {
  formatDashboardHeaderDateLines,
  formatKkHijriUmmAlQura,
} from "../../utils/formatKkDate";

describe("prayer and date locale coverage", () => {
  afterEach(async () => {
    await setCurrentLocale("kk");
  });

  it("keeps short prayer labels translated for selectable offline locales", async () => {
    await setCurrentLocale("en");
    expect(kk.prayer.fajrShort).toBe("Fajr");
    expect(kk.prayer.sunriseShort).toBe("Sun");

    await setCurrentLocale("ru");
    expect(kk.prayer.fajrShort).toBe("Фаджр");
    expect(kk.prayer.sunriseShort).toBe("Восход");

    await setCurrentLocale("ky");
    expect(kk.prayer.fajrShort).toBe("Багымдат");
    expect(kk.prayer.sunriseShort).toBe("Күн");
  });

  it("formats dashboard Gregorian and Hijri date labels by app locale", () => {
    const d = new Date(2026, 0, 15, 12, 0, 0);

    expect(formatDashboardHeaderDateLines(d, "en").gregorian).toBe("15 January 2026");
    expect(formatDashboardHeaderDateLines(d, "ru").gregorian).toBe("15 января 2026");
    expect(formatDashboardHeaderDateLines(d, "ky").gregorian).toBe("15 январь 2026");

    expect(formatKkHijriUmmAlQura(d, "en")).toContain("AH");
    expect(formatKkHijriUmmAlQura(d, "ru")).toContain("г. х.");
    expect(formatKkHijriUmmAlQura(d, "ky")).toContain("х.ж.");
  });
});
