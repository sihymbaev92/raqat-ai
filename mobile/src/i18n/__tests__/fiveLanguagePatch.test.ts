import { kk } from "../kk";
import { setCurrentLocale, type AppLocale } from "../runtime";

const PRIMARY_LOCALES: AppLocale[] = ["kk", "ru", "en", "ky", "uz", "tr", "ar"];

/** UI copy that must resolve to non-empty, locale-appropriate strings (not Kazakh fallback). */
const PATCHED_STRING_KEYS: Array<{ label: string; read: () => string }> = [
  { label: "navigation.savedTab.emptyTitle", read: () => kk.navigation.savedTab.emptyTitle },
  { label: "navigation.savedTab.openHatim", read: () => kk.navigation.savedTab.openHatim },
  { label: "navigation.savedTab.open", read: () => kk.navigation.savedTab.open },
  { label: "navigation.savedTab.continue", read: () => kk.navigation.savedTab.continue },
  { label: "navigation.telegramInfo.openBot", read: () => kk.navigation.telegramInfo.openBot },
  { label: "features.traditionGuide.articlesTitle", read: () => kk.features.traditionGuide.articlesTitle },
  { label: "features.traditionGuide.favoritesTitle", read: () => kk.features.traditionGuide.favoritesTitle },
  { label: "features.traditionGuide.originTitle", read: () => kk.features.traditionGuide.originTitle },
  { label: "features.hajjRoadmapTitle", read: () => kk.features.hajjRoadmapTitle },
  { label: "features.kaabaLiveTitle", read: () => kk.features.kaabaLiveTitle },
  { label: "hadith.hub.searchPlaceholderExamples", read: () => kk.hadith.hub.searchPlaceholderExamples },
  { label: "hadith.hub.emptySearch", read: () => kk.hadith.hub.emptySearch },
  { label: "hadith.hub.searchPlaceholderShort", read: () => kk.hadith.hub.searchPlaceholderShort },
  { label: "hadith.hub.moreHadithSearchHint", read: () => kk.hadith.hub.moreHadithSearchHint },
  { label: "hadith.arabicOriginalLabel", read: () => kk.hadith.arabicOriginalLabel },
  { label: "features.traditionGuide.elderReadBtn", read: () => kk.features.traditionGuide.elderReadBtn },
  { label: "features.traditionGuide.emptySearch", read: () => kk.features.traditionGuide.emptySearch },
  { label: "namazGuide.studyMapTitle", read: () => kk.namazGuide.studyMapTitle },
  { label: "namazGuide.fivePrayersTitle", read: () => kk.namazGuide.fivePrayersTitle },
  { label: "namazGuide.studyNamazCardSub", read: () => kk.namazGuide.studyNamazCardSub },
  { label: "tajweedGuide.chaptersTitle", read: () => kk.tajweedGuide.chaptersTitle },
  { label: "seerah.lastLessonLabel", read: () => kk.seerah.lastLessonLabel },
  { label: "settings.nativeAzanExactAlarmWarning", read: () => kk.settings.nativeAzanExactAlarmWarning },
  { label: "settings.accountSection", read: () => kk.settings.accountSection },
];

/** Known Kazakh-only substrings that should not appear when another locale is active. */
const KK_ONLY_MARKERS: Partial<Record<Exclude<AppLocale, "kk">, RegExp[]>> = {
  ru: [/Әзірге сақталған/, /Таңдаулы хадистер/, /Үлкендерге ыңғайлы/, /Қажылық жол картасы/, /Хатымды ашу/],
  en: [/Әзірге сақталған/, /Таңдаулы хадистер/, /Оқу картасы/, /Қажылық жол картасы/],
  ky: [/Әзірге сақталған/, /Таңдаулы хадистер/, /Қажылық жол картасы/],
  uz: [/Әзірге сақталған/, /Таңдаулы хадистер/, /Намаз оқулығы/, /Қажылық жол картасы/],
  tr: [/Әзірге сақталған/, /Таңдаулы хадистер/, /Намаз оқулығы/, /Қажылық жол картасы/],
  ar: [/Әзірге сақталған/, /Таңдаулы хадистер/, /Намаз оқулығы/, /Қажылық жол картасы/],
};

/** Latin letters inside Cyrillic UI words (e.g. azan, kadam, ubada). Brand/API tokens allowed separately. */
const MIXED_SCRIPT_IN_WORD =
  /[\u0400-\u04FF]+[a-z][\u0400-\u04FF]|[\u0400-\u04FF][a-z]+[\u0400-\u04FF]/;

const ALLOWED_LATIN_FRAGMENTS =
  /^(Halal|bookmark|API|QA|Exact alarm|locked-phone|Azan|Siri|Muftyat|Fatua|QMDB|RAHAT|OMIR|AI|Full-screen|Locked-screen|channel|Android|JSON|HTTP|HTTPS|SQLite|PostgreSQL|npm|adb|FSI|VPN|Wi‑Fi|4G|5G|ngrok|Cloudflare|localtunnel|VPS|USB|APK|ETag|304|OAuth|Sunnah|WhatsApp|Oʻzbekcha|O'zbekcha)$/i;

function collectPatchedStrings(): string[] {
  return PATCHED_STRING_KEYS.map((k) => k.read()).filter((s) => typeof s === "string" && s.trim());
}

describe("five-language manual locale patches", () => {
  afterEach(async () => {
    await setCurrentLocale("kk");
  });

  it.each(PRIMARY_LOCALES)("locale %s exposes non-empty patched UI strings", async (locale) => {
    await setCurrentLocale(locale);
    for (const key of PATCHED_STRING_KEYS) {
      const value = key.read();
      expect(Boolean(value?.trim?.())).toBe(true);
    }
  });

  it.each(["ru", "en", "ky", "uz", "tr", "ar"] as const)(
    "locale %s does not leave Kazakh-only markers on patched keys",
    async (locale) => {
      await setCurrentLocale(locale);
      const markers = KK_ONLY_MARKERS[locale] ?? [];
      for (const value of collectPatchedStrings()) {
        for (const re of markers) {
          expect(value).not.toMatch(re);
        }
      }
    }
  );

  it("hadith hub hidden-count hint reads naturally in each locale", async () => {
    const samples: Record<AppLocale, string> = {
      kk: "",
      ru: "",
      en: "",
      ky: "",
      uz: "",
      tr: "",
      ar: "",
    };

    for (const locale of PRIMARY_LOCALES) {
      await setCurrentLocale(locale);
      const line = `${kk.hadith.hub.moreShort} 5 ${kk.hadith.hub.moreHadithSearchHint}`;
      samples[locale] = line;
      expect(line).not.toMatch(/5 5 /);
      expect(line.length).toBeGreaterThan(8);
    }

    expect(samples.ru).toMatch(/Ещё 5/);
    expect(samples.en).toMatch(/More 5/);
    expect(samples.ky).toMatch(/Дагы 5/);
    expect(samples.uz).toMatch(/Yana 5/);
    expect(samples.tr).toMatch(/Daha 5/);
    expect(samples.ar).toMatch(/المزيد 5|5 /);
  });

  it("ky/ru/kk patched strings avoid Latin letters inside Cyrillic words", async () => {
    for (const locale of ["kk", "ru", "ky"] as const) {
      await setCurrentLocale(locale);
      for (const value of collectPatchedStrings()) {
        if (!/[\u0400-\u04FF]/.test(value)) continue;
        const words = value.split(/\s+/);
        for (const word of words) {
          if (ALLOWED_LATIN_FRAGMENTS.test(word.replace(/[«».,:;!?()—\-]/g, ""))) continue;
          if (/^[A-Za-z0-9.+:/\-]+$/.test(word)) continue;
          expect(word).not.toMatch(MIXED_SCRIPT_IN_WORD);
        }
      }
    }
  });

  it("ky azan dua meaning uses Cyrillic-only Kyrgyz words", async () => {
    await setCurrentLocale("ky");
    const meaning = kk.prayer.azanDuaTextBlock.meaning;
    expect(meaning).toMatch(/убада|уада[ғг]ан/);
    expect(meaning).not.toMatch(/[a-z][а-я]/i);
    expect(meaning).toMatch(/васила/);
  });
});
