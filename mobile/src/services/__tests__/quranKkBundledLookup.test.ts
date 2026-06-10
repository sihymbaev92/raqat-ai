import type { CachedAyah } from "../../storage/quranSurahCache";
import {
  mergeBundledBookTranslitFromDb,
  mergeBundledKkMeaningsIfMissing,
} from "../quranKkBundledLookup";
import { prefetchBundledQuranReader } from "../bundledQuranReader";

beforeAll(async () => {
  await prefetchBundledQuranReader();
});

describe("mergeBundledKkMeaningsIfMissing", () => {
  it("fills textKk from bundle when missing", () => {
    const rows: CachedAyah[] = [
      { numberInSurah: 1, text: "بِسْمِ" },
      { numberInSurah: 2, text: "الْحَمْدُ", textKk: "   " },
    ];
    const out = mergeBundledKkMeaningsIfMissing(1, rows);
    expect(out[0].textKk?.length).toBeGreaterThan(10);
    expect(out[1].textKk?.length).toBeGreaterThan(10);
  });

  it("does not overwrite existing textKk", () => {
    const rows: CachedAyah[] = [{ numberInSurah: 1, text: "x", textKk: "Сақталған аударма" }];
    const out = mergeBundledKkMeaningsIfMissing(1, rows);
    expect(out[0].textKk).toBe("Сақталған аударма");
  });
});

describe("mergeBundledBookTranslitFromDb", () => {
  it("replaces Latin translit with book Cyrillic from bundle", () => {
    const rows: CachedAyah[] = [{ numberInSurah: 1, text: "بِسْمِ", translit: "Bismillah" }];
    const out = mergeBundledBookTranslitFromDb(1, rows);
    expect(out[0].translit).toBe("бисмилләһир рахманир рахиим");
  });
});
