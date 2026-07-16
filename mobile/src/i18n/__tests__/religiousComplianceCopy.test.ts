import { kk } from "../kk";

describe("religious compliance copy", () => {
  it("keeps hadith screens source-bound and Hanafi aligned with explicit QMDb guidance", () => {
    const hadithCopy = [
      kk.hadith.hub.leadUnified,
      kk.hadith.introBody,
      kk.hadith.titleMeaning,
      kk.hadith.sourceOnlyNote,
      kk.hadith.detailMeaningNote,
      kk.hadith.hub.boundaryNotice,
    ].join("\n");

    expect(hadithCopy).toContain("ҚМДБ");
    expect(hadithCopy).toContain("Ханафи");
    expect(hadithCopy).toContain("үкім");
    expect(hadithCopy).toContain("дереккөз");
    expect(hadithCopy).toContain("ұстаз");
    expect(hadithCopy).toContain("AI жауабы");
    expect(hadithCopy).toContain("пәтуа емес");
  });

  it("keeps Quran meaning and tafsir copy away from unsourced fatwa use", () => {
    const quranCopy = [
      kk.quran.ayahTranslationTafsirBody,
      kk.quran.ayahTranslationTafsirSuffix,
      kk.tajweedGuide.sourceSafetyNote,
    ].join("\n");

    expect(quranCopy).toContain("ҚМДБ");
    expect(quranCopy).toContain("үкім");
    expect(quranCopy).toContain("мәзһаб");
    expect(quranCopy).toContain("ұстаз");
  });
});
