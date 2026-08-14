import { resolveTajweedExampleReading } from "../tajweedHarakatTranslitKk";

const PAGE_13: Array<[string, string]> = [
  ["وَزَعَ", "уәзә‘а"],
  ["زَرَأَ", "зәрәә"],
  ["دَرَجَ", "дәрәжә"],
  ["أَدَبَ", "әдәбә"],
  ["دَرِبَ", "дәрибә"],
  ["وَرِثَ", "уәрисә"],
  ["وَزِعَ", "уәзи‘а"],
  ["أَرِبَ", "әрибә"],
  ["رَزُلَ", "рәзулә"],
  ["وُدِعَ", "уди‘а"],
  ["رُزِقَ", "рузиқа"],
  ["ضُرِبَ", "дурибә"],
  ["أَرِخْ", "әрих"],
  ["اُدْعُ", "уд‘u"],
  ["أَنْ", "ән"],
  ["زِدْ", "зид"],
];

describe("PAGE_13 Muftyat readings", () => {
  it.each(PAGE_13)("resolve(%s) → book reading", (arabic, reading) => {
    expect(resolveTajweedExampleReading(arabic, reading)).toBe(reading);
  });
});
