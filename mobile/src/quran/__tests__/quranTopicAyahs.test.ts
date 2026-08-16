import { getQuranTopicById } from "../../content/quranTopicCatalog";
import { resetQuranKkSearchIndexForTests } from "../quranKkSearchIndex";
import { searchQuranTopicAyahsLocalOnly } from "../quranTopicAyahs";

jest.mock("../../utils/loadBundledJson", () => ({
  loadBundledJson: jest.fn(async (name: string) => {
    if (name === "quran-kk-from-db.json") {
      return {
        data: {
          surahs: [
            {
              number: 2,
              ayahs: [
                {
                  numberInSurah: 183,
                  text_kk: "Әй мүміндер! ... ораза парыз қылынды.",
                  translit: "йә әйюһәлләзина әмәну кутибә ъаләйкумус сийәм",
                },
              ],
            },
            {
              number: 4,
              ayahs: [
                {
                  numberInSurah: 103,
                  text_kk: "Намаз уақытында абайлаңдар",
                  translit: "фәхзамус саләуат",
                },
              ],
            },
          ],
        },
      };
    }
    throw new Error(`unexpected bundled json: ${name}`);
  }),
}));

describe("searchQuranTopicAyahsLocalOnly", () => {
  beforeEach(() => {
    resetQuranKkSearchIndexForTests();
  });

  it("returns curated ayahs for namaz topic", async () => {
    const topic = getQuranTopicById("namaz");
    expect(topic).toBeTruthy();
    const hits = await searchQuranTopicAyahsLocalOnly(topic!, { locale: "kk", limit: 20 });
    expect(hits.some((h) => h.surah === 4 && h.ayah === 103)).toBe(true);
    expect(hits[0]?.meaning.length).toBeGreaterThan(0);
  });

  it("returns curated ayahs for oraza topic", async () => {
    const topic = getQuranTopicById("oraza");
    expect(topic).toBeTruthy();
    const hits = await searchQuranTopicAyahsLocalOnly(topic!, { locale: "kk", limit: 20 });
    expect(hits.some((h) => h.surah === 2 && h.ayah === 183)).toBe(true);
  });
});
