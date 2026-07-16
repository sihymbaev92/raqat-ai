import {
  htmlFontTajweedRuns,
  isHtmlFontTajweedText,
  normalizeTajweedHtmlColor,
  stripHtmlFontTajweedTags,
} from "../htmlTajweedParse";

describe("htmlTajweedParse", () => {
  it("parses font color tags into inline runs normalized to standard palette", () => {
    const runs = htmlFontTajweedRuns(
      'بِسْمِ <font color="#009900">ٱ</font>للَّ<font color="#DD0000">هِ</font>'
    );
    expect(runs.length).toBeGreaterThanOrEqual(3);
    expect(runs.some((r) => r.color === "#00C853")).toBe(true);
    expect(runs.some((r) => r.color === "#DD2C00")).toBe(true);
  });

  it("normalizes known API hex to standard colors", () => {
    expect(normalizeTajweedHtmlColor("#1A237E", false)).toBe("#1A237E");
    expect(normalizeTajweedHtmlColor("#FFD600", false)).toBe("#FFD600");
    expect(normalizeTajweedHtmlColor("#AA00FF", false)).toBe("#00C853");
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
