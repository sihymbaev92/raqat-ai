import { kk } from "../kk";
import { setCurrentLocale } from "../runtime";
import { collectKkFunctionReturnLeaks, collectKkStringLeaves, findKkLocaleLeaks } from "../localeLeakScan";
import { prayerEnteredTitleForSlot } from "../../services/prayerFullScreenAzan";

const KK_SPECIFIC = /[әғқңөұүіһӘҒҚҢӨҰҮІҺ]/;

describe("Russian locale zero-Kazakh audit", () => {
  afterEach(async () => {
    await setCurrentLocale("kk");
  });

  it("has no Kazakh-letter chrome leaks after apply", async () => {
    await setCurrentLocale("ru");
    const leaks = findKkLocaleLeaks(kk);
    expect(leaks).toEqual([]);
  });

  it("prayer entered titles are Russian", async () => {
    await setCurrentLocale("ru");
    expect(kk.prayer.enteredFajr).toBe("Наступило время фаджра");
    expect(kk.prayer.enteredDhuhr).toBe("Наступило время зухра");
    expect(kk.prayer.enteredAsr).toBe("Наступило время аср");
    expect(kk.prayer.enteredMaghrib).toBe("Наступило время магриба");
    expect(kk.prayer.enteredIsha).toBe("Наступило время иша");
    expect(kk.prayer.enteredDefault).toBe("Наступило время намаза");
    expect(prayerEnteredTitleForSlot("Фаджр", "fajr")).toBe("Наступило время фаджра");
    expect(prayerEnteredTitleForSlot("Аср", "asr")).toBe("Наступило время аср");
    expect(prayerEnteredTitleForSlot("Тест", undefined)).toBe("Наступило время: Тест");
    expect(KK_SPECIFIC.test(kk.prayer.enteredFajr)).toBe(false);
  });

  it("key dashboard/brand strings are Russian", async () => {
    await setCurrentLocale("ru");
    expect(kk.dashboard.heroAiStripTitle).toBe("Центр источников");
    expect(kk.dashboard.dailyAiLabel).toBe("Центр источников");
    expect(kk.dashboard.promoAiHeadline).toBe("Центр источников");
    expect(kk.dashboard.promoHolidayKurbanTitle).toBe("Курбан-байрам");
    expect(kk.common.close).toBe("Закрыть");
    expect(kk.tabs.home).toBe("Главная");
    expect(kk.quran.meaningKk).toBe("Значение");
  });

  it("formatter functions do not return Kazakh letters under ru", async () => {
    await setCurrentLocale("ru");
    const leaks = collectKkFunctionReturnLeaks(kk).filter(
      (l) => l.value !== "…" && !l.value.includes("ҚМДБ")
    );
    if (leaks.length) {
      // eslint-disable-next-line no-console
      console.log(
        "FUNCTION leaks:",
        leaks.slice(0, 40).map((x) => `${x.path}=${JSON.stringify(x.value).slice(0, 70)}`)
      );
    }
    expect(leaks).toEqual([]);
  });

  it("lists residual Kazakh-letter leaves for debugging (must be empty or allowlisted)", async () => {
    await setCurrentLocale("ru");
    expect(kk.settings.languageKk).toBe("Казахский");
    const residual = collectKkStringLeaves(kk).filter(
      (l) => KK_SPECIFIC.test(l.value) && l.value !== "…" && !l.value.includes("ҚМДБ")
    );
    const unexpected = residual.filter(
      (l) => !l.path.includes("languageKk") && !l.path.includes("settings.language")
    );
    if (unexpected.length) {
      // eslint-disable-next-line no-console
      console.log(
        "UNEXPECTED residual:",
        unexpected.slice(0, 30).map((x) => `${x.path}=${JSON.stringify(x.value).slice(0, 60)}`)
      );
    }
    expect(unexpected.length).toBe(0);
  });
});
