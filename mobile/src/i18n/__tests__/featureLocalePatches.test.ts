import { kk } from "../kk";
import { setCurrentLocale, type AppLocale } from "../runtime";

const PRIMARY_LOCALES: Exclude<AppLocale, "kk">[] = ["ru", "en", "ky", "uz", "tr", "ar"];

/** Letters unique to Kazakh (not used in standard Kyrgyz Cyrillic). */
const KAZAKH_ONLY_LETTERS = /[әғұһіӘҒҰҺІ]/;

type LocaleKeyProbe = { label: string; read: () => string };

const FEATURE_UI_KEYS: LocaleKeyProbe[] = [
  { label: "tasbih.bleTitle", read: () => kk.tasbih.bleTitle },
  { label: "tasbih.bleHint", read: () => kk.tasbih.bleHint },
  { label: "tasbih.bleScan", read: () => kk.tasbih.bleScan },
  { label: "tasbih.meaningLabel", read: () => kk.tasbih.meaningLabel },
  { label: "quran.tajweedModeLabel", read: () => kk.quran.tajweedModeLabel },
  { label: "quran.tajweedModeHint", read: () => kk.quran.tajweedModeHint },
  { label: "quran.tajweedLegendTitle", read: () => kk.quran.tajweedLegendTitle },
  { label: "quran.tajweedLoadFailedHint", read: () => kk.quran.tajweedLoadFailedHint },
  { label: "dashboard.homeTileTajweedSub", read: () => kk.dashboard.homeTileTajweedSub },
  { label: "dashboard.homeTileTasbihSub", read: () => kk.dashboard.homeTileTasbihSub },
  { label: "settings.quranSectionTajweed", read: () => kk.settings.quranSectionTajweed },
  { label: "hadith.meaningLabel", read: () => kk.hadith.meaningLabel },
];

const LOCALE_EXPECTED_SNIPPETS: Partial<Record<Exclude<AppLocale, "kk">, Record<string, RegExp>>> = {
  ru: {
    "tasbih.bleTitle": /Электрон/i,
    "quran.tajweedModeLabel": /таджвид/i,
    "hadith.meaningLabel": /^Значение$/,
  },
  en: {
    "tasbih.bleTitle": /Electronic/i,
    "quran.tajweedModeLabel": /Tajweed/i,
    "hadith.meaningLabel": /^Meaning$/,
  },
  ky: {
    "tasbih.bleTitle": /Электрондук/i,
    "quran.tajweedModeLabel": /Тажвид/i,
    "hadith.meaningLabel": /Мааниси/,
  },
  uz: {
    "tasbih.bleTitle": /Elektron/i,
    "quran.tajweedModeLabel": /Tajvid/i,
    "hadith.meaningLabel": /Ma'nosi/,
  },
  tr: {
    "tasbih.bleTitle": /Elektronik/i,
    "quran.tajweedModeLabel": /Tecvid/i,
    "hadith.meaningLabel": /Anlamı/,
  },
  ar: {
    "tasbih.bleTitle": /عداد|إلكتروني/,
    "quran.tajweedModeLabel": /تجويد/,
    "hadith.meaningLabel": /المعنى/,
  },
};

describe("feature locale patches (tajweed + BLE tasbih)", () => {
  afterEach(async () => {
    await setCurrentLocale("kk");
  });

  it.each(PRIMARY_LOCALES)("%s exposes non-empty feature UI strings", async (locale) => {
    await setCurrentLocale(locale);
    for (const key of FEATURE_UI_KEYS) {
      expect(key.read().trim().length).toBeGreaterThan(0);
    }
  });

  it.each(PRIMARY_LOCALES)(
    "%s feature strings avoid Kazakh-only letters and match locale snippets",
    async (locale) => {
      await setCurrentLocale(locale);
      const snippets = LOCALE_EXPECTED_SNIPPETS[locale] ?? {};
      for (const key of FEATURE_UI_KEYS) {
        const value = key.read();
        expect(value).not.toMatch(KAZAKH_ONLY_LETTERS);
        const re = snippets[key.label];
        if (re) expect(value).toMatch(re);
      }
    }
  );

  it("tr onboarding language title is Turkish-only", async () => {
    await setCurrentLocale("tr");
    expect(kk.onboarding.languageTitle).toBe("Uygulama dili");
    expect(kk.onboarding.languageTitle).not.toMatch(/Тіл/);
  });
});
