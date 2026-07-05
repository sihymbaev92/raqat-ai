import { hadithTextForLocale, type SahihHadithEntry } from "../hadithCorpus";
import seedJson from "../../../assets/bundled/hadith-from-db-seed.json";

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

  it("keeps bundled hadith seed source-only when Kazakh text is not officially approved", () => {
    const rows = (seedJson as { hadiths?: SahihHadithEntry[] }).hadiths ?? [];
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.sourceOnly).toBe(true);
      expect((row.textKk ?? "").trim()).toBe("");
      expect((row.sourceCitationKk ?? "").trim()).toBeTruthy();
    }
  });
});
