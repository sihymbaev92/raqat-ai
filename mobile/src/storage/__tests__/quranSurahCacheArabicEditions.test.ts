jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

import type { CachedAyah } from "../quranSurahCache";
import {
  displayCachedAyahArabic,
  mergeDualAlquranArabicOntoBase,
  mergeTurkishPrintArabicFromParsed,
} from "../quranSurahCache";

describe("Arabic edition merge & display", () => {
  it("mergeTurkishPrintArabicFromParsed adds textTurkishPrint by ayah number", () => {
    const base: CachedAyah[] = [
      { numberInSurah: 1, text: "AAA" },
      { numberInSurah: 2, text: "BBB" },
    ];
    const alt: CachedAyah[] = [
      { numberInSurah: 1, text: "TT1" },
      { numberInSurah: 2, text: "TT2" },
    ];
    const out = mergeTurkishPrintArabicFromParsed(base, alt);
    expect(out[0]?.text).toBe("AAA");
    expect(out[0]?.textTurkishPrint).toBe("TT1");
    expect(out[1]?.textTurkishPrint).toBe("TT2");
  });

  it("mergeDualAlquranArabicOntoBase overlays madinah and turkish lines", () => {
    const base: CachedAyah[] = [{ numberInSurah: 1, text: "plat", textKk: "kk1" }];
    const mad: CachedAyah[] = [{ numberInSurah: 1, text: "uth" }];
    const uni: CachedAyah[] = [{ numberInSurah: 1, text: "uni" }];
    const out = mergeDualAlquranArabicOntoBase(base, mad, uni);
    expect(out[0]?.text).toBe("uth");
    expect(out[0]?.textTurkishPrint).toBe("uni");
    expect(out[0]?.textKk).toBe("kk1");
  });

  it("displayCachedAyahArabic prefers turkish line when edition is turkish", () => {
    const a: CachedAyah = { numberInSurah: 1, text: "uth", textTurkishPrint: "uni" };
    expect(displayCachedAyahArabic(a, "madinah")).toBe("uth");
    expect(displayCachedAyahArabic(a, "turkish")).toBe("uni");
  });

  it("displayCachedAyahArabic falls back to text when turkish line missing", () => {
    const a: CachedAyah = { numberInSurah: 1, text: "uth" };
    expect(displayCachedAyahArabic(a, "turkish")).toBe("uth");
  });
});
