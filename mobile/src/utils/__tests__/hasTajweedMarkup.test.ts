import { hasTajweedMarkup } from "../hasTajweedMarkup";

describe("hasTajweedMarkup", () => {
  it("detects Al Quran Cloud bracket tags", () => {
    expect(hasTajweedMarkup("[h:1[ٱ]للَّهِ")).toBe(true);
    expect(hasTajweedMarkup("قَالُوا [g[مِن] رَبِّهِمْ")).toBe(true);
  });

  it("detects HTML font color markup", () => {
    expect(hasTajweedMarkup('<font color="#537FFF">مَا</font>')).toBe(true);
  });

  it("rejects plain Arabic and empty", () => {
    expect(hasTajweedMarkup("بِسْمِ ٱللَّهِ")).toBe(false);
    expect(hasTajweedMarkup("")).toBe(false);
    expect(hasTajweedMarkup(null)).toBe(false);
    expect(hasTajweedMarkup(undefined)).toBe(false);
    expect(hasTajweedMarkup("   ")).toBe(false);
  });
});
