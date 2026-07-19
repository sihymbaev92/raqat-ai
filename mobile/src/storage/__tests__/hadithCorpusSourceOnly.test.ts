import {
  filterHadithCorpusKkOnly,
  hadithHasKkMeaning,
  hadithTextForLocale,
  type HadithCorpus,
  type SahihHadithEntry,
} from "../hadithCorpus";
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

describe("hadith KK-only corpus", () => {
  it("hides unapproved translations for source-only hadith rows", () => {
    expect(hadithTextForLocale(sourceOnlyHadith, "kk")).toBe("");
    expect(hadithTextForLocale(sourceOnlyHadith, "ru")).toBe("");
    expect(hadithTextForLocale(sourceOnlyHadith, "en")).toBe("");
    expect(hadithTextForLocale(sourceOnlyHadith, "tr")).toBe("");
  });

  it("still allows Arabic for source-only hadith rows", () => {
    expect(hadithTextForLocale(sourceOnlyHadith, "ar")).toContain("الْأَعْمَالُ");
  });

  it("ships curated rows with Kazakh meaning; Enc supplements may omit KK", () => {
    const rows = (seedJson as HadithCorpus).hadiths ?? [];
    expect(rows.length).toBeGreaterThanOrEqual(80);
    const curated = rows.filter((row) => row.catalogOrigin !== "hadeethenc");
    expect(curated.length).toBeGreaterThanOrEqual(80);
    for (const row of curated) {
      expect(hadithHasKkMeaning(row)).toBe(true);
      expect(row.sourceOnly).toBeFalsy();
      expect((row.textKk ?? "").trim().length).toBeGreaterThan(30);
    }
    for (const row of rows.filter((r) => r.catalogOrigin === "hadeethenc")) {
      expect((row.arabic ?? "").trim().length).toBeGreaterThan(10);
      expect((row.textKy ?? "").trim().length + (row.textUz ?? "").trim().length).toBeGreaterThan(10);
    }
  });

  it("filters out source-only and empty-KK rows", () => {
    const mixed: HadithCorpus = {
      version: 1,
      provenance: {
        origin: "test",
        evidenceKk: "t",
        recordedAt: "2026-01-01",
      },
      hadiths: [
        sourceOnlyHadith,
        {
          ...sourceOnlyHadith,
          id: "bukhari-2",
          sourceOnly: false,
          textKk: "Ниетіне қарай істер есептеледі.",
        },
        {
          ...sourceOnlyHadith,
          id: "bukhari-3",
          sourceOnly: false,
          textKk: "",
        },
      ],
    };
    const filtered = filterHadithCorpusKkOnly(mixed);
    expect(filtered?.hadiths).toHaveLength(1);
    expect(filtered?.hadiths[0]?.id).toBe("bukhari-2");
  });

  it("seed v10+ includes HadeethEnc ky/uz on matched rows", () => {
    const body = seedJson as HadithCorpus & {
      provenance?: { editions?: Record<string, string> };
    };
    expect(Number(body.version)).toBeGreaterThanOrEqual(10);
    const withKy = (body.hadiths ?? []).filter((h) => (h.textKy ?? "").trim().length > 0);
    const withUz = (body.hadiths ?? []).filter((h) => (h.textUz ?? "").trim().length > 0);
    expect(withKy.length).toBeGreaterThanOrEqual(20);
    expect(withUz.length).toBeGreaterThanOrEqual(20);
    expect(body.provenance?.editions?.ky).toMatch(/HadeethEnc/i);
    expect(body.provenance?.editions?.uz).toMatch(/HadeethEnc/i);
  });
});
