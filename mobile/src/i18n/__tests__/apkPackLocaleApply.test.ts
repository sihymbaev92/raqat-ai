import { kk } from "../kk";
import { setCurrentLocale } from "../runtime";
import { findKkLocaleLeaks } from "../localeLeakScan";
import {
  areOfflineAutoTranslationsReady,
  hasOfflineAutoTranslationLocale,
} from "../../services/offlineAutoTranslations";

describe("sync APK offline pack locale apply", () => {
  afterEach(async () => {
    await setCurrentLocale("kk");
  });

  it("applies Russian UI from inline APK pack with few Kazakh leaks", async () => {
    await setCurrentLocale("ru");
    expect(areOfflineAutoTranslationsReady()).toBe(true);
    expect(hasOfflineAutoTranslationLocale("ru")).toBe(true);
    expect(kk.common.close).not.toMatch(/Жабу/);
    expect(kk.tabs.home).not.toMatch(/Басты/);
    expect(kk.settings.title).not.toMatch(/Баптау/);
    const leaks = findKkLocaleLeaks(kk);
    expect(leaks.length).toBeLessThan(40);
  });

  it("switches ru → en without staying on Kazakh chrome", async () => {
    await setCurrentLocale("ru");
    await setCurrentLocale("en");
    expect(kk.common.close.toLowerCase()).toMatch(/close/);
    expect(kk.tabs.home.toLowerCase()).toMatch(/home|main/);
    const leaks = findKkLocaleLeaks(kk);
    expect(leaks.length).toBeLessThan(40);
  });
});
