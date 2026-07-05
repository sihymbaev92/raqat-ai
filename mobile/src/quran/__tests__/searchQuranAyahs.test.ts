import {
  resetQuranKkSearchIndexForTests,
  searchQuranKkIndex,
} from "../quranKkSearchIndex";
import { searchQuranAyahsLocal, quranSearchLangForLocale } from "../searchQuranAyahs";
import {
  releaseBundledQuranTranslationsMemory,
  searchBundledQuranTranslations,
} from "../../services/quranOfflineTranslations";

jest.mock("../../utils/loadBundledJson", () => ({
  loadBundledJson: jest.fn(async (name: string) => {
    if (name === "quran-kk-from-db.json") {
      return {
        data: {
          surahs: [
            {
              number: 2,
              ayahs: [
                { numberInSurah: 183, text_kk: "Әй мүміндер! ... ораза парыз қылынды." },
                { numberInSurah: 184, text_kk: "Санаулы күндерде." },
              ],
            },
            {
              number: 4,
              ayahs: [
                { numberInSurah: 15, text_kk: "Сондай әйелдеріңнен зина қылғandar..." },
                { numberInSurah: 103, text_kk: "Намаз уақытында абайлаңдар" },
              ],
            },
          ],
        },
      };
    }
    if (name === "quran-translations-offline.json") {
      return {
        surahs: [
          {
            number: 2,
            ayahs: [
              {
                numberInSurah: 183,
                textRu: "О те, которые уверовали! Вам предписан пост.",
                textEn: "O you who have believed, decreed upon you is fasting",
              },
            ],
          },
          {
            number: 4,
            ayahs: [
              { numberInSurah: 103, textEn: "Be mindful of your prayers at prayer times." },
            ],
          },
        ],
      };
    }
    throw new Error(`unexpected bundled json: ${name}`);
  }),
}));

describe("searchQuranKkIndex", () => {
  beforeEach(() => {
    resetQuranKkSearchIndexForTests();
    releaseBundledQuranTranslationsMemory();
  });

  it("returns empty for short query", async () => {
    expect(await searchQuranKkIndex("")).toEqual([]);
    expect(await searchQuranKkIndex("a")).toEqual([]);
  });

  it("finds ayahs by Kazakh keyword", async () => {
    const fasting = await searchQuranKkIndex("ораза");
    expect(fasting.some((h) => h.surah === 2 && h.ayah === 183)).toBe(true);

    const prayer = await searchQuranKkIndex("намаз");
    expect(prayer.some((h) => h.surah === 4 && h.ayah === 103)).toBe(true);
  });

  it("finds zina-related ayahs", async () => {
    const hits = await searchQuranKkIndex("зина", 20);
    expect(hits.some((h) => h.surah === 4 && h.ayah === 15)).toBe(true);
    expect(hits[0]?.meaning.toLowerCase()).toContain("зина");
  });

  it("finds namaz-related ayahs", async () => {
    const hits = await searchQuranKkIndex("намаз", 20);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((h) => h.meaning.toLowerCase().includes("намаз"))).toBe(true);
  });
});

describe("searchBundledQuranTranslations", () => {
  beforeEach(() => {
    releaseBundledQuranTranslationsMemory();
  });

  it("finds ayahs in Russian translation", async () => {
    const hits = await searchBundledQuranTranslations("пост", 20, "ru" as never);
    expect(hits.some((h) => h.surah === 2 && h.ayah === 183)).toBe(true);
    expect(hits[0]?.meaning.toLowerCase()).toContain("пост");
  });

  it("finds ayahs in English translation", async () => {
    const hits = await searchBundledQuranTranslations("fasting", 20, "en" as never);
    expect(hits.some((h) => h.surah === 2 && h.ayah === 183)).toBe(true);
    expect(hits[0]?.meaning.toLowerCase()).toContain("fasting");
  });
});

describe("searchQuranAyahsLocal locale routing", () => {
  beforeEach(() => {
    resetQuranKkSearchIndexForTests();
    releaseBundledQuranTranslationsMemory();
  });

  it("uses kk bundle for kk locale", async () => {
    const hits = await searchQuranAyahsLocal("ораза", 20, "kk");
    expect(hits.some((h) => h.surah === 2 && h.ayah === 183)).toBe(true);
  });

  it("uses offline translations for ru locale", async () => {
    const hits = await searchQuranAyahsLocal("пост", 20, "ru");
    expect(hits.some((h) => h.surah === 2 && h.ayah === 183)).toBe(true);
    expect(hits[0]?.meaning.toLowerCase()).toContain("пост");
  });

  it("maps api lang from app locale", () => {
    expect(quranSearchLangForLocale("kk")).toBe("kk");
    expect(quranSearchLangForLocale("ru")).toBe("ru");
    expect(quranSearchLangForLocale("en")).toBe("en");
    expect(quranSearchLangForLocale("uz")).toBe("uz");
  });
});
