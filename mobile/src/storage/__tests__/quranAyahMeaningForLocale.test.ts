import { quranAyahMeaningForLocale } from "../quranSurahCache";

describe("quranAyahMeaningForLocale", () => {
  it("uses bundled Quran translations when Hatim page fields are still loading", () => {
    const lightHatimAyah = {
      numberInSurah: 1,
      surahNumber: 1,
    };

    expect(quranAyahMeaningForLocale(lightHatimAyah, "en")).toBe(
      "In the name of Allah, the Entirely Merciful, the Especially Merciful."
    );
    expect(quranAyahMeaningForLocale(lightHatimAyah, "zh")).toBe("奉至仁至慈的真主之名");
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
});
