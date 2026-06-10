import {
  estimateQuranAyahRowHeight,
  quranAyahListRowLayoutKind,
} from "../quranAyahListItemLayout";

describe("quranAyahListItemLayout", () => {
  it("arabic-only smallest", () => {
    const h = estimateQuranAyahRowHeight({
      showReaderArabic: true,
      showReaderTranslit: false,
      showReaderMeaning: false,
    });
    expect(h).toBeGreaterThan(0);
    expect(quranAyahListRowLayoutKind({
      showReaderArabic: true,
      showReaderTranslit: false,
      showReaderMeaning: false,
    })).toBe("arabic-only");
  });

  it("full blocks tallest", () => {
    const minimal = estimateQuranAyahRowHeight({
      showReaderArabic: true,
      showReaderTranslit: false,
      showReaderMeaning: false,
    });
    const full = estimateQuranAyahRowHeight({
      showReaderArabic: true,
      showReaderTranslit: true,
      showReaderMeaning: true,
    });
    expect(full).toBeGreaterThan(minimal);
    expect(quranAyahListRowLayoutKind({
      showReaderArabic: true,
      showReaderTranslit: true,
      showReaderMeaning: true,
    })).toBe("translit-meaning");
  });

  it("translit-only between arabic and full", () => {
    const ar = estimateQuranAyahRowHeight({
      showReaderArabic: true,
      showReaderTranslit: false,
      showReaderMeaning: false,
    });
    const tr = estimateQuranAyahRowHeight({
      showReaderArabic: true,
      showReaderTranslit: true,
      showReaderMeaning: false,
    });
    expect(tr).toBeGreaterThan(ar);
  });
});
