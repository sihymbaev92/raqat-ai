import { kk } from "../kk";
import { setCurrentLocale } from "../runtime";
import {
  areOfflineAutoTranslationsReady,
  getOfflineAutoTranslation,
} from "../../services/offlineAutoTranslations";

describe("runtime offline locale patches", () => {
  afterEach(async () => {
    await setCurrentLocale("kk");
  });

  it("translates direct kk string lookups through the offline bundle for full offline locales", async () => {
    await setCurrentLocale("ky");

    expect(kk.common.close).toBe("Жабуу");
    expect(kk.tabs.home).toBe("Башкы");
    expect(kk.onboarding.languageTitle).toBe("Колдонмо тили");
    expect(kk.navigation.tabProfile).toBe("Жеке бет");
    expect(kk.dashboard.scheduleTable).toBe("Бүгүнкү жадыбал");
    expect(kk.features.halalHeroTagRegistry).toBe("Расмий тизмек");
    expect(kk.kmdbHub.officialSitesLead).toContain("Расмий текстти");
  });

  it("keeps manual locale patches above generated offline patches", async () => {
    await setCurrentLocale("ru");

    expect(kk.common.close).toBe("Закрыть");
    expect(kk.tabs.home).toBe("Главная");
    expect(kk.onboarding.languageTitle).toBe("Язык приложения");
    expect(kk.kmdbHub.officialSitesLead).toContain("официальный текст");
    expect(kk.prayer.enteredFajr).toBe("Наступило время фаджра");
    expect(kk.prayer.enteredGeneric("Аср")).toBe("Наступило время: Аср");
    expect(kk.dashboard.promoHolidayKurbanTitle).toBe("Курбан-байрам");

    await setCurrentLocale("en");

    expect(kk.common.close).toBe("Close");
    expect(kk.tabs.home).toBe("Home");
    expect(kk.onboarding.languageTitle).toBe("App language");
    expect(kk.kmdbHub.officialSitesLead).toContain("official text");
    expect(kk.prayer.enteredFajr).toBe("Fajr time has entered");
  });

  it("keeps offline dictionary in memory so tr() lookups still work after applyLocale", async () => {
    await setCurrentLocale("en");
    expect(areOfflineAutoTranslationsReady()).toBe(true);
    expect(getOfflineAutoTranslation("Құран", "en")).toBe("Quran");
  });
});
