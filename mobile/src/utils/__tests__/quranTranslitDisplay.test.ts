import { transliterateArabicToKazakh } from "../arabicTranslitKk";
import { resolveQuranTranslitForDisplay } from "../quranTranslitDisplay";

describe("resolveQuranTranslitForDisplay", () => {
  it("prefers bundled book Cyrillic when present", () => {
    const ar = "\ufeffبِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
    const bundled = "бисмилләһир рахманир рахиим";
    expect(resolveQuranTranslitForDisplay(bundled, ar)).toBe(bundled);
  });

  it("falls back to bundled translit when Arabic is empty", () => {
    expect(resolveQuranTranslitForDisplay("әлхәмду", "")).toBe("әлхәмду");
  });

  it("uses Arabic-derived when bundled is Latin-only", () => {
    const ar = "ٱلرَّحْمَٰنِ";
    expect(resolveQuranTranslitForDisplay("ar-rahman", ar)).toBe(transliterateArabicToKazakh(ar));
  });
});
