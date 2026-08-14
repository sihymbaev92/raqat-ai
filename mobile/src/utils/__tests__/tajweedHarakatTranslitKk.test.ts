import {
  formatTajweedHarakatReading,
  hasTajweedHarakat,
  resolveTajweedExampleReading,
  transliterateTajweedHarakatExample,
  transliterateTajweedHarakatSyllables,
} from "../tajweedHarakatTranslitKk";

describe("transliterateTajweedHarakatSyllables (1:1 clip order)", () => {
  const cases: Array<[string, string[]]> = [
    ["وَزَعَ", ["уа", "за", "‘а"]],
    ["زَرَأَ", ["за", "ра", "а"]],
    ["دَرَجَ", ["да", "ра", "жа"]],
    ["أَدَبَ", ["а", "да", "ба"]],
    ["دَرِبَ", ["да", "ри", "ба"]],
    ["وَرِثَ", ["уа", "ри", "са"]],
    ["وَزِعَ", ["уа", "зи", "‘а"]],
    ["أَرِبَ", ["а", "ри", "ба"]],
    ["رَزُلَ", ["ра", "зу", "ла"]],
    ["وُدِعَ", ["у", "ди", "‘а"]],
    ["رُزِقَ", ["ру", "зи", "қа"]],
    ["ضُرِبَ", ["ду", "ри", "ба"]],
    ["أَرِخْ", ["а", "ри", "х"]],
    ["اُدْعُ", ["у", "д", "‘у"]],
    ["أَنْ", ["а", "н"]],
    ["زِدْ", ["зи", "д"]],
  ];

  it.each(cases)("syllables for %s", (arabic, expected) => {
    expect(transliterateTajweedHarakatSyllables(arabic)).toEqual(expected);
  });
});

describe("formatTajweedHarakatReading", () => {
  it("joins syllables with middle dot", () => {
    expect(formatTajweedHarakatReading("وَزَعَ")).toBe("уа·за·‘а");
    expect(formatTajweedHarakatReading("دَرَجَ")).toBe("да·ра·жа");
  });
});

describe("transliterateTajweedHarakatExample (compact)", () => {
  it("joins without separator", () => {
    expect(transliterateTajweedHarakatExample("وَزَعَ")).toBe("уаза‘а");
    expect(transliterateTajweedHarakatExample("دَرَجَ")).toBe("даража");
  });
});

describe("hasTajweedHarakat", () => {
  it("detects harakat marks", () => {
    expect(hasTajweedHarakat("دَرَجَ")).toBe(true);
    expect(hasTajweedHarakat("ب")).toBe(false);
  });
});

describe("resolveTajweedExampleReading", () => {
  it("prefers manual book reading for harakat words", () => {
    expect(resolveTajweedExampleReading("دَرَجَ", "дәрәжә")).toBe("дәрәжә");
    expect(resolveTajweedExampleReading("وَزِعَ", "уәзиға")).toBe("уәзиға");
  });

  it("keeps manual reading for bare letters", () => {
    expect(resolveTajweedExampleReading("ب", "бә")).toBe("бә");
    expect(resolveTajweedExampleReading("ر", "ра")).toBe("ра");
  });

  it("falls back to manual when arabic is empty", () => {
    expect(resolveTajweedExampleReading("", "қолмен")).toBe("қолмен");
  });
});
