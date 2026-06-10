import { hadithTextForLocale, type SahihHadithEntry } from "../hadithCorpus";

const sourceOnlyHadith: SahihHadithEntry = {
  id: "bukhari-1",
  collection: "bukhari",
  collectionNameKk: "Сахих әл-Бұхари",
  bookTitleKk: "",
  reference: "1",
  arabic: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ",
  textKk: "Бекітілмеген қазақша мәтін",
  textRu: "Непроверенный перевод",
  textEn: "Unapproved translation",
  textTr: "Onaysız çeviri",
  narratorKk: "",
  sourceOnly: true,
};

describe("hadithTextForLocale", () => {
  it("hides unapproved translations for source-only hadith rows", () => {
    expect(hadithTextForLocale(sourceOnlyHadith, "kk")).toBe("");
    expect(hadithTextForLocale(sourceOnlyHadith, "ru")).toBe("");
    expect(hadithTextForLocale(sourceOnlyHadith, "en")).toBe("");
    expect(hadithTextForLocale(sourceOnlyHadith, "tr")).toBe("");
  });

  it("still allows Arabic for source-only hadith rows", () => {
    expect(hadithTextForLocale(sourceOnlyHadith, "ar")).toContain("الْأَعْمَالُ");
  });
});
