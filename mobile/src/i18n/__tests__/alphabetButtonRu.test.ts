import { setCurrentLocale } from "../runtime";
import { kk } from "../kk";
import { tajweedLetterDisplayName, TAJWEED_LETTER_NAME_RU } from "../../content/tajweedLetterNamesLocale";
import { TAJWEED_ALPHABET_ROWS } from "../../content/tajweedAlphabet";

const KK = /[әғқңөұүіһӘҒҚҢӨҰҮІҺ]/;

describe("alphabet button RU", () => {
  afterEach(async () => {
    await setCurrentLocale("kk");
  });

  it("dashboard tile and tajweed titles are Russian without Kazakh letters", async () => {
    await setCurrentLocale("ru");
    expect(kk.dashboard.arabicLettersTile).toBe("Алфавит");
    expect(KK.test(kk.dashboard.arabicLettersTile)).toBe(false);
    expect(kk.tajweedGuide.shortTitle).toBe("Алфавит");
    expect(kk.tajweedGuide.screenTitle).toBe("Арабский алфавит");
    expect(kk.tajweedGuide.alphabetHeading).toBe("Арабский алфавит");
    expect(KK.test(kk.tajweedGuide.sectionBookSub(10))).toBe(false);
    expect(kk.dashboard.tajweedCardSub).toBe("Алфавит · короткая сура");
    expect(KK.test(kk.dashboard.tajweedCardSub)).toBe(false);
  });

  it("letter button names use Russian map without Kazakh letters", async () => {
    await setCurrentLocale("ru");
    const identity = (s: string) => s;
    for (const cell of TAJWEED_ALPHABET_ROWS.flat()) {
      const name = tajweedLetterDisplayName(cell.nameKk, "ru", identity);
      expect(TAJWEED_LETTER_NAME_RU[cell.nameKk]).toBeTruthy();
      expect(KK.test(name)).toBe(false);
      expect(name).not.toBe("…");
    }
  });
});
