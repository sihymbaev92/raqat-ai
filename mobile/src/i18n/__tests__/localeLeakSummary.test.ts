import { kk } from "../kk";
import { setCurrentLocale, type AppLocale } from "../runtime";
import { findKkLocaleLeaks, findKyLocaleLeaks } from "../localeLeakScan";

const LOCALES: AppLocale[] = ["ru", "en", "ky", "uz", "tr", "ar"];

describe("per-locale leak counts after apply", () => {
  afterEach(async () => {
    await setCurrentLocale("kk");
  });

  it.each(LOCALES)("%s leak summary", async (locale) => {
    await setCurrentLocale(locale);
    const leaks =
      locale === "ky" ? findKyLocaleLeaks(kk) : findKkLocaleLeaks(kk);
    // Soft report — fail only if chrome still clearly Kazakh
    expect(kk.common.close).not.toMatch(/^Жабу$/);
    expect(kk.tabs.home).not.toMatch(/^Басты$/);
    expect(kk.settings.title).not.toMatch(/Баптаулар/);
    expect(leaks.length).toBeLessThan(locale === "ky" ? 80 : 5);
    // eslint-disable-next-line no-console
    console.log(`[${locale}] leaks=${leaks.length} close=${kk.common.close} home=${kk.tabs.home}`);
  });
});
