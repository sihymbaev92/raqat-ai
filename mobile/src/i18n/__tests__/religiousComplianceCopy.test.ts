import { kk } from "../kk";

describe("religious compliance copy", () => {
  it("keeps hadith screens source-bound and Hanafi aligned without official org branding", () => {
    const hadithCopy = [
      kk.hadith.hub.leadUnified,
      kk.hadith.introBody,
      kk.hadith.titleMeaning,
      kk.hadith.sourceOnlyNote,
      kk.hadith.detailMeaningNote,
      kk.hadith.hub.boundaryNotice,
    ].join("\n");

    expect(hadithCopy).not.toMatch(/ҚМДБ|QMDB|Muftyat|Fatua/i);
    expect(hadithCopy).toContain("Ханафи");
    expect(hadithCopy).toContain("үкім");
    expect(hadithCopy).toContain("дереккөз");
    expect(hadithCopy).toContain("ұстаз");
    expect(hadithCopy).toContain("AI жауабы");
    expect(hadithCopy).toContain("фәтуа емес");
  });

  it("keeps Quran meaning and tafsir copy away from unsourced fatwa use", () => {
    const quranCopy = [
      kk.quran.ayahTranslationTafsirBody,
      kk.quran.ayahTranslationTafsirSuffix,
      kk.tajweedGuide.sourceSafetyNote,
    ].join("\n");

    expect(quranCopy).not.toMatch(/ҚМДБ|QMDB|Muftyat|Fatua/i);
    expect(quranCopy).toContain("үкім");
    expect(quranCopy).toContain("мәзһаб");
    expect(quranCopy).toContain("ұстаз");
  });
});
