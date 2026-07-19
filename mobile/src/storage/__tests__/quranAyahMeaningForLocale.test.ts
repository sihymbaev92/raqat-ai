import { quranAyahMeaningForLocale } from "../quranSurahCache";
import { ensureBundledQuranReaderLoaded } from "../../services/bundledQuranReader";

describe("quranAyahMeaningForLocale", () => {
  it("uses bundled Quran translations when Hatim page fields are still loading", () => {
    const lightHatimAyah = {
      numberInSurah: 1,
      surahNumber: 1,
    };

    expect(quranAyahMeaningForLocale(lightHatimAyah, "en")).toBe(
      "In the name of Allah, the Entirely Merciful, the Especially Merciful."
    );
    expect(quranAyahMeaningForLocale(lightHatimAyah, "ru").length).toBeGreaterThan(5);
  });

  it("keeps Kazakh fallback when a bundled translation locale is not selected", () => {
    expect(
      quranAyahMeaningForLocale(
        {
          numberInSurah: 1,
          surahNumber: 1,
          textKk: "Аса қамқор, ерекше мейірімді Алланың атымен бастаймын.",
        },
        "kk"
      )
    ).toBe("Аса қамқор, ерекше мейірімді Алланың атымен бастаймын.");
  });

  it("uses bundled kk db when textKk is not on the ayah row yet", async () => {
    await ensureBundledQuranReaderLoaded();
    const meaning = quranAyahMeaningForLocale({ numberInSurah: 1, surahNumber: 1 }, "kk");
    expect(meaning.length).toBeGreaterThan(10);
  });
});
