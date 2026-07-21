import { setCurrentLocale } from "../runtime";
import { kk } from "../kk";
import { tajweedLetterDisplayName } from "../../content/tajweedLetterNamesLocale";
import { tajweedSectionDisplayTitle } from "../../content/tajweedSectionTitlesLocale";
import { TAJWEED_ALPHABET_ROWS } from "../../content/tajweedAlphabet";
import { TAJWEED_MUFTYAT_SECTIONS } from "../../content/tajweedMuftyatCatalog";

const KK = /[әғқңөұүіһӘҒҚҢӨҰҮІҺ]/;

function hasKk(s: string) {
  return KK.test(s) && s !== "…" && !s.includes("ҚМДБ");
}

describe("tajweed alphabet screen full RU", () => {
  afterEach(async () => {
    await setCurrentLocale("kk");
  });

  it("chrome, letters and TOC titles are Russian without Kazakh letters", async () => {
    await setCurrentLocale("ru");
    const identity = (s: string) => s;

    const chrome = [
      kk.dashboard.arabicLettersTile,
      kk.tajweedGuide.shortTitle,
      kk.tajweedGuide.screenTitle,
      kk.tajweedGuide.alphabetHeading,
      kk.tajweedGuide.intro,
      kk.tajweedGuide.sectionAlphabet,
      kk.tajweedGuide.sectionLaterTitle,
      kk.tajweedGuide.sectionBook,
      kk.tajweedGuide.alphabetTapHint,
      kk.tajweedGuide.chaptersHint,
      kk.tajweedGuide.practiceCtaTitle,
      kk.dashboard.tajweedCardSub,
    ];
    expect(chrome.filter(hasKk)).toEqual([]);

    for (const cell of TAJWEED_ALPHABET_ROWS.flat()) {
      expect(hasKk(tajweedLetterDisplayName(cell.nameKk, "ru", identity))).toBe(false);
    }

    for (const sec of TAJWEED_MUFTYAT_SECTIONS) {
      const t = tajweedSectionDisplayTitle(sec.title, "ru", identity);
      expect(hasKk(t)).toBe(false);
      expect(t).not.toBe("…");
    }
  });
});
