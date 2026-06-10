import { BASMALA_KK_TRANSLIT_CANON, transliterateArabicToKazakh } from "../arabicTranslitKk";

const FATIHA_1_1_UTHMANI = "\ufeffبِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

describe("transliterateArabicToKazakh", () => {
  it("recognizes Uthmani basmala (ٱ→ا) and returns asyldin-style phrase", () => {
    expect(transliterateArabicToKazakh(FATIHA_1_1_UTHMANI)).toBe(BASMALA_KK_TRANSLIT_CANON);
  });

  it("recognizes markless basmala without hamza/wasla variants", () => {
    expect(transliterateArabicToKazakh("بسم الله الرحمن الرحيم")).toBe(BASMALA_KK_TRANSLIT_CANON);
  });

  it("assimilates definite article before sun letters (р)", () => {
    expect(transliterateArabicToKazakh("ٱلرَّحْمَٰن")).toMatch(/әр-рахман/);
  });

  it("does not pausal-trim ar-Rahmani ending (ани → ан)", () => {
    const out = transliterateArabicToKazakh("ٱلرَّحْمَٰنِ");
    expect(out).toContain("әр-рахмани");
    expect(out.endsWith("ан")).toBe(false);
  });
});
