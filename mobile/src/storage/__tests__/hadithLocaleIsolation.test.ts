import {
  filterHadithCorpusForLocale,
  hadithHasTextForLocale,
  hadithTextForLocale,
  type SahihHadithEntry,
} from "../hadithCorpus";

const sample: SahihHadithEntry = {
  id: "bukhari-1",
  collection: "bukhari",
  collectionNameKk: "Сахих әл-Бұхари",
  bookTitleKk: "Sahih al-Bukhari",
  reference: "1",
  arabic: "إنما الأعمال بالنيات",
  textKk: "Амалдар ниетке байланысты",
  textRu: "Поистине, дела — по намерениям",
  textEn: "Actions are but by intention",
  textTr: "Ameller niyetlere göredir",
  narratorKk: "Ömer",
};

describe("hadith locale isolation", () => {
  it("returns only the selected language text (no cross-locale fallback)", () => {
    expect(hadithTextForLocale(sample, "kk")).toContain("ниет");
    expect(hadithTextForLocale(sample, "ru")).toContain("намерениям");
    expect(hadithTextForLocale(sample, "en")).toContain("intention");
    expect(hadithTextForLocale(sample, "tr")).toContain("niyet");
    expect(hadithTextForLocale(sample, "ar")).toContain("الأعمال");
    expect(hadithTextForLocale(sample, "ky")).toBe("");
    expect(hadithTextForLocale(sample, "uz")).toBe("");
  });

  it("serves ky/uz only from trusted fields (no KK fallback)", () => {
    const withKyUz: SahihHadithEntry = {
      ...sample,
      textKy: "Амалдар ниектерге жараша",
      textUz: "Амаллар ниятга боғлиқ",
      hadeethEncId: "66511",
      kyUzSourceLabel: "HadeethEnc.com",
    };
    expect(hadithTextForLocale(withKyUz, "ky")).toContain("ниектерге");
    expect(hadithTextForLocale(withKyUz, "uz")).toContain("ниятга");
    expect(hadithTextForLocale(withKyUz, "kk")).toContain("ниет");
  });

  it("filters corpus so other-language rows are hidden", () => {
    const corpus = {
      version: 1,
      provenance: { origin: "test", evidenceKk: "t", recordedAt: "x" },
      hadiths: [
        sample,
        { ...sample, id: "kk-only", textRu: "", textEn: "", textTr: "" },
        { ...sample, id: "ru-only", textKk: "", textEn: "", textTr: "", arabic: "ع" },
        {
          ...sample,
          id: "ky-uz",
          textKk: "",
          textRu: "",
          textEn: "",
          textTr: "",
          textKy: "Кыргызча",
          textUz: "Ўзбекча",
        },
      ],
    };
    const ru = filterHadithCorpusForLocale(corpus, "ru");
    expect(ru?.hadiths.map((h) => h.id)).toEqual(["bukhari-1", "ru-only"]);
    const ky = filterHadithCorpusForLocale(corpus, "ky");
    expect(ky?.hadiths.map((h) => h.id)).toEqual(["ky-uz"]);
    const uz = filterHadithCorpusForLocale(corpus, "uz");
    expect(uz?.hadiths.map((h) => h.id)).toEqual(["ky-uz"]);
    expect(hadithHasTextForLocale(sample, "ky")).toBe(false);
  });
});
