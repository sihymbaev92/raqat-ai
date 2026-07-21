import {
  htmlFontTajweedRuns,
  isHtmlFontTajweedText,
  normalizeTajweedHtmlColor,
  stripHtmlFontTajweedTags,
} from "../htmlTajweedParse";

describe("htmlTajweedParse", () => {
  it("keeps Al Quran Cloud official hex on font tags", () => {
    const runs = htmlFontTajweedRuns(
      'بِسْمِ <font color="#FF7E1E">ٱ</font>للَّ<font color="#537FFF">هِ</font>'
    );
    expect(runs.length).toBeGreaterThanOrEqual(3);
    expect(runs.some((r) => r.color === "#FF7E1E")).toBe(true);
    expect(runs.some((r) => r.color === "#537FFF")).toBe(true);
  });

  it("maps legacy hex to Al Quran Cloud group representatives", () => {
    expect(normalizeTajweedHtmlColor("#DD0008", false)).toBe("#DD0008");
    expect(normalizeTajweedHtmlColor("#009900", false)).toBe("#FF7E1E");
    expect(normalizeTajweedHtmlColor("#DD0000", false)).toBe("#537FFF");
    expect(normalizeTajweedHtmlColor("#AA00FF", false)).toBe("#FF7E1E");
    expect(normalizeTajweedHtmlColor("#1A237E", false)).toBe("#DD0008");
  });

  it("strips font tags to plain arabic", () => {
    const plain = stripHtmlFontTajweedTags('<font color="red">ٱ</font>للَّ');
    expect(plain).not.toContain("<font");
    expect(plain).toContain("ٱ");
  });

  it("detects html font tajweed", () => {
    expect(isHtmlFontTajweedText('<font color="#000">x</font>')).toBe(true);
    expect(isHtmlFontTajweedText("[g[ٱ")).toBe(false);
  });
});
