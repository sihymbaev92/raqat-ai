import { kk } from "../kk";
import { setCurrentLocale } from "../runtime";

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
    expect(kk.aiChat.apiMissingDetail).toBe(
      "Кызмат убактылуу жеткиликсиз. Интернетти текшерип, кийинчерээк кайра аракет кылыңыз."
    );
  });

  it("keeps manual locale patches above generated offline patches", async () => {
    await setCurrentLocale("ru");

    expect(kk.common.close).toBe("Закрыть");
    expect(kk.tabs.home).toBe("Главная");
    expect(kk.onboarding.languageTitle).toBe("Язык приложения");
    expect(kk.aiChat.apiMissingDetail).toBe(
      "Сервис временно недоступен. Проверьте интернет и попробуйте позже."
    );

    await setCurrentLocale("en");

    expect(kk.common.close).toBe("Close");
    expect(kk.tabs.home).toBe("Home");
    expect(kk.onboarding.languageTitle).toBe("App language");
    expect(kk.aiChat.apiMissingDetail).toBe(
      "The service is temporarily unavailable. Check your internet connection and try again later."
    );
  });
});
