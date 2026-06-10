import { filterHatimSurahRows } from "../HatimSurahSearchSheet";

const rows = [
  { number: 1, name: "Әл-Фатиха", ayahCount: 7 },
  { number: 2, name: "Әл-Бақара", ayahCount: 286 },
  { number: 36, name: "Йасин", ayahCount: 83 },
];

describe("filterHatimSurahRows", () => {
  it("returns all rows when query is empty", () => {
    expect(filterHatimSurahRows(rows, "")).toHaveLength(3);
    expect(filterHatimSurahRows(rows, "   ")).toHaveLength(3);
  });

  it("filters by surah number prefix", () => {
    expect(filterHatimSurahRows(rows, "3").map((r) => r.number)).toEqual([36]);
    expect(filterHatimSurahRows(rows, "36").map((r) => r.number)).toEqual([36]);
  });

  it("filters by Kazakh title substring", () => {
    expect(filterHatimSurahRows(rows, "фатих").map((r) => r.number)).toEqual([1]);
    expect(filterHatimSurahRows(rows, "йасин").map((r) => r.number)).toEqual([36]);
  });
});
