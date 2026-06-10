import { TAJWEED_ALPHABET_ROWS } from "../tajweedAlphabet";

describe("TAJWEED_ALPHABET_ROWS", () => {
  it("matches 28-letter infographic layout (7×4)", () => {
    expect(TAJWEED_ALPHABET_ROWS.length).toBe(4);
    for (const row of TAJWEED_ALPHABET_ROWS) {
      expect(row.length).toBe(7);
    }
    const flat = TAJWEED_ALPHABET_ROWS.flat();
    expect(flat.length).toBe(28);
  });

  it("marks 7 tafkhim (heavy) letters: خ ص ض ط ظ غ ق", () => {
    const heavy = TAJWEED_ALPHABET_ROWS.flat().filter((c) => c.heavy);
    expect(heavy.length).toBe(7);
    const set = new Set(heavy.map((c) => c.ar));
    expect(set).toEqual(new Set(["خ", "ص", "ض", "ط", "ظ", "غ", "ق"]));
  });

  it("has a pronunciation example for every letter cell", () => {
    for (const cell of TAJWEED_ALPHABET_ROWS.flat()) {
      expect(cell.example.trim()).toBeTruthy();
      expect(cell.example).toMatch(/[\u0600-\u06FF]/u);
    }
  });
});
